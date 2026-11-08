import { CAM_Z } from "@/lib/sceneConfig";

export interface HeadPlacement {
  position: readonly [number, number, number];
  scale: number;
  rotY: number;
}

/** 依深度補償縮放：位置錯落、景深不同，但畫面上的頭大小一致 */
const place = (
  x: number,
  y: number,
  z: number,
  rotY: number,
  base: number
): HeadPlacement => ({
  position: [x, y, z],
  scale: (base * (CAM_Z - z)) / CAM_Z,
  rotY,
});

export const LAYOUT_LANDSCAPE: readonly HeadPlacement[] = [
  place(-5.0, 0.9, -1.2, 0.3, 1.1),
  place(-3.1, -1.3, 0.8, 0.2, 1.1),
  place(-1.2, 1.55, -0.6, -0.15, 1.1),
  place(0.2, -0.9, 1.1, 0.05, 1.1),
  place(1.9, 1.4, -1.0, -0.3, 1.1),
  place(3.5, -1.5, 0.5, -0.2, 1.1),
  place(5.0, 0.7, -1.3, -0.4, 1.1),
];

export const LAYOUT_PORTRAIT: readonly HeadPlacement[] = [
  place(-0.8, 2.35, -0.5, 0.3, 0.6),
  place(0.8, 1.65, 0.5, -0.2, 0.6),
  place(-0.8, 0.95, -0.3, 0.25, 0.6),
  place(0.8, 0.25, 0.6, -0.15, 0.6),
  place(-0.8, -0.45, -0.4, 0.2, 0.6),
  place(0.8, -1.15, 0.5, -0.25, 0.6),
  place(-0.3, -1.85, -0.2, 0.1, 0.6),
];