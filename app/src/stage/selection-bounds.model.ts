import { videoWorldSize } from './stage-size.model';
import type { StageSize, StageTransform } from './stage-size.model';
export interface Point { x: number; y: number }
export function objectCorners(source: { width: number; height: number }, stage: StageSize, transform: StageTransform): Point[] {
  const size = videoWorldSize(source), radians = transform.rotation * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => {
    const dx = x * size.width * transform.scaleX / 2, dy = y * size.height * transform.scaleY / 2;
    return { x: stage.width / 2 + transform.x + dx * cos - dy * sin, y: stage.height / 2 + transform.y + dx * sin + dy * cos };
  });
}
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
function inside(point: Point, polygon: Point[]) {
  return polygon.every((a, index) => cross(subtract(polygon[(index + 1) % polygon.length], a), subtract(point, a)) >= -1e-7);
}
/** Split only at geometric intersections, so covered portions have exact dashed boundaries. */
export function outlineSegments(corners: Point[], occluders: Point[][]) {
  return corners.flatMap((start, index) => {
    const end = corners[(index + 1) % corners.length], direction = subtract(end, start);
    const at = (t: number): Point => ({ x: start.x + direction.x * t, y: start.y + direction.y * t });
    const cuts = [0, 1];
    for (const polygon of occluders) for (let edge = 0; edge < polygon.length; edge++) {
      const a = polygon[edge], b = polygon[(edge + 1) % polygon.length], segment = subtract(b, a);
      const denominator = cross(direction, segment); if (Math.abs(denominator) < 1e-9) continue;
      const offset = subtract(a, start), t = cross(offset, segment) / denominator, u = cross(offset, direction) / denominator;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t);
    }
    cuts.sort((a, b) => a - b);
    return cuts.slice(1).flatMap((t, part) => t - cuts[part] < 1e-7 ? [] : [{
      start: at(cuts[part]), end: at(t), covered: occluders.some(polygon => inside(at((cuts[part] + t) / 2), polygon))
    }]);
  });
}
