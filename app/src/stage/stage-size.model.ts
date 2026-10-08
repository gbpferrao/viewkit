export interface StageSize { width: number; height: number }
export interface StageTransform { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
export const defaultStage = (): StageSize => ({ width: 1280, height: 720 });
export const defaultTransform = (): StageTransform => ({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
/** Bound a proportional resize before rounding to whole output pixels. */
export function resizeStageDimension(stage: StageSize, key: 'width' | 'height', value: number, ratio: number | null): StageSize {
  if (ratio === null) return { ...stage, [key]: value };
  const minimumWidth = Math.max(320, 240 * ratio);
  const maximumWidth = Math.min(3840, 2160 * ratio);
  const requestedWidth = key === 'width' ? value : value * ratio;
  const width = Math.max(minimumWidth, Math.min(maximumWidth, requestedWidth));
  return { width: Math.round(width), height: Math.round(width / ratio) };
}
export function validateStage(stage: StageSize) {
  if (!Number.isInteger(stage.width) || !Number.isInteger(stage.height) ||
      stage.width < 320 || stage.width > 3840 || stage.height < 240 || stage.height > 2160) {
    throw new Error('stage size must be 320–3840 × 240–2160 whole pixels');
  }
}
export function validateTransform(transform: StageTransform) {
  if (!Object.values(transform).every(Number.isFinite)) throw new Error('transform values must be numbers');
  if (transform.scaleX < 0.05 || transform.scaleX > 10 || transform.scaleY < 0.05 || transform.scaleY > 10) {
    throw new Error('scale must be between 0.05 and 10');
  }
  return { ...transform, rotation: ((transform.rotation + 180) % 360 + 360) % 360 - 180 };
}
/** Stable world dimensions: initial 720p fitting does not depend on the current output crop. */
export function videoWorldSize(source: { width: number; height: number }) {
  const reference = defaultStage();
  const fit = Math.min(reference.width / source.width, reference.height / source.height);
  return { width: source.width * fit, height: source.height * fit };
}

