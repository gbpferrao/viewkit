import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { moveClips, trimClip, splitClip, snapTime, closeVacatedGaps, validateClips } from './timeline.model';
import type { Clip, MediaSource } from './timeline.model';
import { defaultTransform, defaultStage, validateStage } from '../stage/stage-size.model';
import { useProject } from './project-timeline.state';
import { createHistory } from './history-clipboard.workflow';
import { createTimelineEdits } from './edit-timeline.workflow';
import { createStageEdits } from '../stage/stage-layout.workflow';

const clip = (id: string, start = 0, duration = 2, lane = 0): Clip => ({ id, sourceId: 'source', start, duration, offset: 0, lane, volume: 100, order: 1, transform: defaultTransform() });
const source = { id: 'source', name: 'fixture.mp4', kind: 'video', duration: 10, width: 640, height: 360, url: 'blob:test', file: {} } as MediaSource;

describe('timeline invariants and editing transactions', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('allows overlapping intervals on a lane while enforcing source/frame/lane bounds', () => {
    expect(() => validateClips([clip('a'), clip('b', 1)], [source])).not.toThrow();
    expect(() => validateClips([clip('a', 0, 11)], [source])).toThrow('source bounds');
    expect(() => validateClips([clip('a', 0.01)], [source])).toThrow('24 fps');
    expect(() => validateClips([clip('a', 0, 1, 10)], [source])).toThrow('ten lanes');
  });
  it('clamps a whole group with one time delta and rejects an invalid lane atomically', () => {
    const before = [clip('a', 1), clip('b', 3, 2, 9)];
    const moved = moveClips(before, ['a', 'b'], -4, 0);
    expect(moved.map(item => item.start)).toEqual([0, 2]);
    expect(() => moveClips(before, ['a', 'b'], 1, 1)).toThrow();
    expect(before.map(item => item.start)).toEqual([1, 3]);
  });
  it('trims preserve source content, enforce one frame, and extend only to available media', () => {
    const before = { ...clip('a', 2, 3), offset: 1 };
    const trimmed = trimClip(before, 'start', 3, 10);
    expect([trimmed.start, trimmed.offset, trimmed.duration]).toEqual([3, 2, 2]);
    expect(trimClip(before, 'start', 0, 10).start).toBe(1);
    expect(trimClip(before, 'end', 50, 10).duration).toBe(9);
    expect(trimClip(before, 'end', 1, 10).duration).toBeCloseTo(1 / 24);
  });
  it('splits exact offsets and retains transform/gain; edge splits are no-ops', () => {
    const before = { ...clip('a', 2, 4), offset: 1, volume: 50, transform: { ...defaultTransform(), rotation: 90 } };
    const split = splitClip(before, 3, () => 'b');
    expect(split.map(item => [item.start, item.duration, item.offset])).toEqual([[2, 1, 1], [3, 3, 2]]);
    expect(split[1].volume).toBe(50); expect(split[1].transform.rotation).toBe(90);
    expect(splitClip(before, 2, () => 'b')).toHaveLength(1);
  });
  it('snap threshold is screen-relative and disabled snap still follows the frame grid', () => {
    expect(snapTime(1.06, [1], 100, true).target).toBe(1);
    expect(snapTime(1.06, [1], 200, true).target).toBeNull();
    expect(snapTime(1.06, [1], 100, false)).toEqual({ time: 25 / 24, target: null });
  });
  it('autofill closes a removed interval once when deleted clips overlap', () => {
    const before = [clip('a'), clip('b'), clip('c', 2), clip('other', 4, 2, 1)];
    const result = closeVacatedGaps(before, before.slice(2), before.slice(0, 2));
    expect(result.find(item => item.id === 'c')?.start).toBe(0);
    expect(result.find(item => item.id === 'other')?.start).toBe(4);
  });
  it('autofill closes the union of partially overlapping removed intervals', () => {
    const removed = [clip('a', 0, 2), clip('b', 1, 2)];
    const later = [clip('c', 3)];
    expect(closeVacatedGaps([...removed, ...later], later, removed)[0].start).toBe(0);
  });
  it('history preserves interleaved edits, clears redo on new edit, and caps depth', () => {
    const project = useProject(); project.addSource(source);
    const history = createHistory(project), edits = createTimelineEdits(project, history), stage = createStageEdits(project, history);
    edits.place('source', 0, 0); const id = project.clips[0].id;
    edits.commitMove([id], 2, 0); stage.setSize(640, 360); edits.setVolume(50);
    history.undo(); expect(project.clips[0].volume).toBe(100);
    history.undo(); expect(project.stage).toEqual(defaultStage());
    history.undo(); expect(project.clips[0].start).toBe(0);
    history.redo(); expect(project.clips[0].start).toBe(2);
    edits.commitMove([id], 1, 0); expect(history.future.value).toHaveLength(0);
    for (let index = 0; index < 60; index++) edits.commitMove([id], 1 / 24, 0);
    expect(history.past.value).toHaveLength(50);
  });
  it('copy/paste allows overlap, uses fresh IDs and undo removes pasted clips only', () => {
    const project = useProject(); project.addSource(source);
    const history = createHistory(project), edits = createTimelineEdits(project, history);
    edits.place('source', 0, 0); edits.place('source', 1, 0); project.select(project.clips.map(item => item.id));
    history.copy(); edits.paste(0); expect(project.clips).toHaveLength(4);
    expect(new Set(project.clips.map(item => item.id)).size).toBe(4);
    expect(project.clips.slice(2).map(item => item.start)).toEqual([0, 1]);
    history.undo(); expect(project.clips).toHaveLength(2);
  });
  it('rejects invalid stage changes without consuming history or altering prior stage', () => {
    const project = useProject(), history = createHistory(project), edits = createStageEdits(project, history);
    edits.setSize(0, 720); expect(project.stage).toEqual(defaultStage()); expect(history.past.value).toHaveLength(0);
    expect(() => validateStage({ width: NaN, height: 720 })).toThrow();
  });
});
