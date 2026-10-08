export const FPS = 24;
export const LANE_COUNT = 10;
export function toFrame(seconds: number) { return Math.round(seconds * FPS); }
export function toTime(frame: number) { return frame / FPS; }
export function quantize(seconds: number) { return toTime(toFrame(seconds)); }
export function formatTime(seconds: number) {
  const frame = Math.max(0, toFrame(seconds));
  const wholeSeconds = Math.floor(frame / FPS);
  return [Math.floor(wholeSeconds / 3600), Math.floor(wholeSeconds / 60) % 60, wholeSeconds % 60, frame % FPS]
    .map(value => String(value).padStart(2, '0')).join(':');
}

