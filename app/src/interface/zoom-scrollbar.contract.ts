/** Preserve a content point at a viewport edge while changing display scale. All positions are pixels at initialZoom. */
export interface ZoomScrollChange {
  zoom: number;
  initialZoom: number;
  anchor: number;
  viewportAnchor: 0 | 1;
}
