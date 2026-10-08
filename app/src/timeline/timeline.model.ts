import { FPS, LANE_COUNT, quantize, toFrame, toTime } from '../shared/frame-math.contract';
import type { StageTransform } from '../stage/stage-size.model';

export interface MediaSource {
  id: string; name: string; kind: 'video' | 'audio'; url: string; file: File;
  duration: number; width: number; height: number;
}
export interface Clip {
  id: string; sourceId: string; start: number; duration: number; offset: number;
  lane: number; volume: number; order: number; transform: StageTransform;
}
export const clipEnd = (clip: Clip) => quantize(clip.start + clip.duration);
export const timelineEnd = (clips: Clip[]) => Math.max(0, ...clips.map(clipEnd));
export const isActive = (clip: Clip, time: number) => time >= clip.start && time < clipEnd(clip);
export const renderOrder = (clips: Clip[]) => [...clips].sort((left, right) => right.lane - left.lane || left.order - right.order);
export const cloneClips = (clips: Clip[]) => clips.map(clip => ({ ...clip, transform: { ...clip.transform } }));

/** Highest compositing priority occupies the upper available overlap row. Disjoint clips can share a row. */
export function packLaneClips(clips: Clip[]) {
  const ordered = [...clips].sort((a, b) => b.order - a.order || a.id.localeCompare(b.id));
  const tracks: Clip[][] = [], rows: Record<string, number> = {};
  for (const clip of ordered) {
    let row = tracks.findIndex(track => track.every(other => clip.start >= clipEnd(other) || clipEnd(clip) <= other.start));
    if (row < 0) { row = tracks.length; tracks.push([]); }
    tracks[row].push(clip); rows[clip.id] = row;
  }
  return { clips: ordered, rows, rowCount: Math.max(1, tracks.length) };
}

export interface ClipReorder { anchorId: string; placement: 'before' | 'after' }
export function reorderLaneClips(clips: Clip[], ids: string[], reorder: ClipReorder | null) {
  if (!reorder) return clips;
  const anchor = clips.find(clip => clip.id === reorder.anchorId);
  if (!anchor || ids.includes(anchor.id)) return clips;
  const ordered = clips.filter(clip => clip.lane === anchor.lane).sort((a,b) => b.order-a.order || a.id.localeCompare(b.id));
  const moving = ordered.filter(clip => ids.includes(clip.id));
  if (!moving.length) return clips;
  const remaining = ordered.filter(clip => !ids.includes(clip.id));
  const index = remaining.findIndex(clip => clip.id === anchor.id) + (reorder.placement === 'after' ? 1 : 0);
  remaining.splice(index, 0, ...moving);
  if (remaining.every((clip, index) => clip.id === ordered[index].id)) return clips;
  const priorities = new Map(remaining.map((clip, index) => [clip.id, remaining.length-index]));
  return clips.map(clip => priorities.has(clip.id) ? { ...clip, order: priorities.get(clip.id)! } : clip);
}

export function validateClips(clips: Clip[], sources: MediaSource[]) {
  const ids = new Set<string>();
  for (const clip of clips) {
    const source = sources.find(item => item.id === clip.sourceId);
    if (!source || ids.has(clip.id)) throw new Error('clip has an invalid source or identity');
    ids.add(clip.id);
    if (![clip.start, clip.duration, clip.offset, clip.lane, clip.volume, clip.order].every(Number.isFinite)) {
      throw new Error('clip values must be finite');
    }
    if (clip.start < 0 || clip.offset < 0 || toFrame(clip.duration) < 1 ||
        clip.offset + clip.duration > source.duration + 0.0001) throw new Error('clip exceeds source bounds');
    if (!Number.isInteger(clip.lane) || clip.lane < 0 || clip.lane >= LANE_COUNT) throw new Error('drop inside one of the ten lanes');
    if (!Number.isInteger(clip.volume) || clip.volume < 0 || clip.volume > 100) throw new Error('volume must be 0–100');
    for (const value of [clip.start, clip.duration, clip.offset]) {
      if (Math.abs(quantize(value) - value) > 0.00001) throw new Error('clip bounds must follow the 24 fps grid');
    }
  }
}

/** One common delta preserves group offsets even when the earliest member reaches zero. */
export function moveClips(clips: Clip[], ids: string[], delta: number, laneDelta: number) {
  const selected = clips.filter(clip => ids.includes(clip.id));
  if (!selected.length) return cloneClips(clips);
  const shift = Math.max(quantize(delta), -Math.min(...selected.map(clip => clip.start)));
  if (selected.some(clip => clip.lane + laneDelta < 0 || clip.lane + laneDelta >= LANE_COUNT)) {
    throw new Error('the entire selection must stay inside the ten lanes');
  }
  return clips.map(clip => ids.includes(clip.id) ? { ...clip, start: quantize(clip.start + shift), lane: clip.lane + laneDelta, transform: { ...clip.transform } } : { ...clip, transform: { ...clip.transform } });
}

export function trimClip(clip: Clip, edge: 'start' | 'end', time: number, sourceDuration: number): Clip {
  const result = { ...clip, transform: { ...clip.transform } };
  const end = clipEnd(clip);
  if (edge === 'start') {
    const next = Math.max(0, clip.start - clip.offset, Math.min(end - 1 / FPS, quantize(time)));
    result.offset = quantize(clip.offset + next - clip.start);
    result.start = next; result.duration = quantize(end - next);
  } else {
    const next = Math.max(clip.start + 1 / FPS, Math.min(clip.start + sourceDuration - clip.offset, quantize(time)));
    result.duration = quantize(next - clip.start);
  }
  return result;
}

export function splitClip(clip: Clip, time: number, createId: () => string): Clip[] {
  const frame = toFrame(time);
  if (frame <= toFrame(clip.start) || frame >= toFrame(clipEnd(clip))) return [{ ...clip, transform: { ...clip.transform } }];
  const leftDuration = toTime(frame - toFrame(clip.start));
  return [
    { ...clip, duration: leftDuration, transform: { ...clip.transform } },
    { ...clip, id: createId(), start: toTime(frame), duration: quantize(clip.duration - leftDuration),
      offset: quantize(clip.offset + leftDuration), order: clip.order + 0.0001, transform: { ...clip.transform } }
  ];
}

/** Close only gaps created by this edit. Previously empty spaces and all other lanes remain intact. */
export function closeVacatedGaps(before: Clip[], after: Clip[], affected: Clip[]) {
  const result = cloneClips(after);
  for (const lane of new Set(affected.map(clip => clip.lane))) {
    const intervals = affected.filter(clip => clip.lane === lane && before.some(item => item.id === clip.id))
      .map(clip => ({ start: clip.start, end: clipEnd(clip) })).sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const interval of intervals) {
      const previous = merged.at(-1);
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push({ ...interval });
    }
    let vacant = merged;
    for (const blocker of after.filter(clip => clip.lane === lane)) {
      vacant = vacant.flatMap(interval => {
        if (blocker.start >= interval.end || clipEnd(blocker) <= interval.start) return [interval];
        const pieces: { start: number; end: number }[] = [];
        if (blocker.start > interval.start) pieces.push({ start: interval.start, end: blocker.start });
        if (clipEnd(blocker) < interval.end) pieces.push({ start: clipEnd(blocker), end: interval.end });
        return pieces;
      });
    }
    for (const clip of result.filter(clip => clip.lane === lane)) {
      const gap = vacant.filter(interval => interval.end <= clip.start).reduce((total, interval) => total + interval.end - interval.start, 0);
      clip.start = quantize(clip.start - gap);
    }
  }
  return result;
}

export function snapTime(time: number, targets: number[], pixelsPerSecond: number, enabled: boolean) {
  if (!enabled) return { time: quantize(time), target: null as number | null };
  let target: number | null = null, distance = 8 / pixelsPerSecond;
  for (const candidate of targets) {
    const current = Math.abs(candidate - time);
    if (current <= distance) { target = candidate; distance = current; }
  }
  return { time: quantize(target ?? time), target };
}
