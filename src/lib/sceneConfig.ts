export const CAM_Z = 10;
export const FOV = 38;

/** 光暈平面邊長、圓環半徑比例（須與 haloFragment 一致） */
export const HALO_PLANE = 4;
export const HALO_RING = 0.62;

/** 掃描線由頭頂（local y）往下掃過身體 */
export const SCAN_TOP = 0.95;
export const SCAN_RANGE = 4.55;

export function visibleHeight(): number {
  return 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
}

export interface SinLayout {
  portrait: boolean;
  visW: number;
  visH: number;
  /** 角色頁中，主角的世界座標與縮放 */
  scale: number;
  x: number;
  y: number;
  /** 光圈中心與半徑（螢幕像素），供 DOM 排版 */
  cx: number;
  cy: number;
  ringR: number;
}

export function computeSinLayout(width: number, height: number): SinLayout {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const aspect = w / h;
  const visH = visibleHeight();
  const visW = visH * aspect;
  const portrait = aspect < 0.85;

  const scale = portrait ? Math.min(visW * 0.34, visH * 0.2) : visH * 0.275;
  const x = portrait ? 0 : visW * 0.2;
  const y = portrait ? visH * 0.22 : visH * 0.12;
  const headY = y + 0.03 * scale;

  return {
    portrait,
    visW,
    visH,
    scale,
    x,
    y,
    cx: w * (0.5 + x / visW),
    cy: h * (0.5 - headY / visH),
    ringR: (((HALO_PLANE / 2) * HALO_RING * scale) / visH) * h,
  };
}