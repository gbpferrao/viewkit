import type { ProjectSnapshot } from '../timeline/project-timeline.state';
import type { MediaSource } from '../timeline/timeline.model';
export type RenderSource = Omit<MediaSource, 'url'>;
export interface RenderRequest { snapshot: ProjectSnapshot; sources: RenderSource[] }
export type RenderProgress = (progress: number, label: string, currentFrame?: number, estimated?: boolean) => void;
export type RenderReply = { type: 'progress'; progress: number; label: string; currentFrame?: number }
  | { type: 'complete'; buffer: ArrayBuffer; compositor: 'webgpu' | 'canvas2d' }
  | { type: 'error'; message: string };
