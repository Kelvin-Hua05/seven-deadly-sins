export interface HeadPlacement {
  position: readonly [number, number, number];
  scale: number;
  rotY: number;
}

/** 橫向螢幕：錯落的空間構圖，不排成一列。順序對應 SINS 的 index 1–7 */
export const LAYOUT_LANDSCAPE: readonly HeadPlacement[] = [
  { position: [-4.6, 0.7, -1.0], scale: 0.95, rotY: 0.35 },
  { position: [-2.7, -1.2, 0.9], scale: 1.05, rotY: 0.2 },
  { position: [-1.0, 1.55, -1.8], scale: 0.85, rotY: -0.15 },
  { position: [0.35, -0.5, 1.3], scale: 1.15, rotY: 0.05 },
  { position: [2.2, 1.35, -0.6], scale: 0.95, rotY: -0.3 },
  { position: [3.9, -1.2, 0.4], scale: 1.05, rotY: -0.2 },
  { position: [5.0, 1.3, -2.2], scale: 0.8, rotY: -0.4 },
];

/** 直向螢幕（手機） */
export const LAYOUT_PORTRAIT: readonly HeadPlacement[] = [
  { position: [-0.9, 2.7, -0.6], scale: 0.52, rotY: 0.3 },
  { position: [0.8, 1.95, 0.5], scale: 0.56, rotY: -0.2 },
  { position: [-0.8, 1.2, -0.2], scale: 0.5, rotY: 0.25 },
  { position: [0.9, 0.45, 0.7], scale: 0.58, rotY: -0.15 },
  { position: [-0.7, -0.3, -0.4], scale: 0.5, rotY: 0.2 },
  { position: [0.8, -1.05, 0.4], scale: 0.54, rotY: -0.25 },
  { position: [-0.3, -1.8, -1.0], scale: 0.48, rotY: 0.1 },
];