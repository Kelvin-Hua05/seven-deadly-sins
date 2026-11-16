import type { FigureSpec } from "@/data/figures";
import type { SinSlug } from "@/types/sin";
import { createRng } from "./random";

/**
 * 一組「首頁頭像 → 臉部特寫 → 全身」的粒子資料。
 * 頭像與特寫取自同一張圖的同一批取樣點（只是縮放不同），所以第一階段是原地「向外綻開」。
 * 特寫與全身之間依「由上到下、由左到右」配對。
 */
export interface FigureData {
  count: number;
  /** 首頁頭像位置（= 特寫的縮小版） */
  p0: Float32Array;
  /** 首頁可見權重（0–1）：橢圓內為 1，往外淡出 */
  home: Float32Array;
  /** 特寫位置與顏色（頭像階段共用同一個顏色） */
  p1: Float32Array;
  c1: Float32Array;
  /** 全身位置與顏色 */
  p2: Float32Array;
  c2: Float32Array;
  seed: Float32Array;
  /** 每顆粒子兩個階段的延遲（0–1） */
  delay: Float32Array;
  body: { width: number; height: number; top: number };
}

/** 插圖粒子數 = 身體粒子數 × 這個倍率 */
const FACTOR = 2;
export const figureCount = (bodyCount: number) => bodyCount * FACTOR;

/* 取樣參數：地板值讓暗部（眼窩、陰影）仍保留一點細節 */
const FLOOR = 0.05;
const LO = 0.04;
const HI = 0.6;
const GAMMA = 0.9;
const COLOR_GAMMA = 0.75;
const COLOR_GAIN = 1.6;

interface Pixels {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

async function loadPixels(url: string, maxSide = 900): Promise<Pixels> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

/**
 * 邊界淡出：圓角矩形形狀的衰減，中心為 1，越靠近圖片邊緣越接近 0，
 * 四個角完全為 0，所以看不出矩形的邊界。start 越小，淡出範圍越大。
 */
function edgeMask(u: number, v: number, start: number): number {
  const a = Math.abs(2 * u - 1);
  const b = Math.abs(2 * v - 1);
  const d = Math.pow(a * a * a * a + b * b * b * b, 0.25);
  return 1 - smooth(start, 1, d);
}

interface Sampled {
  u: Float32Array;
  v: Float32Array;
  lum: Float32Array;
  jz: Float32Array;
  col: Float32Array;
  aspect: number;
}

/** 依亮度與邊界遮罩做重要性取樣：越亮、越靠近中央，粒子越多；顏色取自原圖 */
function sampleImage(px: Pixels, count: number, seed: number, edgeStart: number): Sampled {
  const { data, w, h } = px;
  const rng = createRng(seed);
  const u = new Float32Array(count);
  const v = new Float32Array(count);
  const lum = new Float32Array(count);
  const jz = new Float32Array(count);
  const col = new Float32Array(count * 3);
  const maxGuard = count * 160;
  let n = 0;
  let guard = 0;

  while (n < count) {
    const ix = (rng() * w) | 0;
    const iy = (rng() * h) | 0;
    const fu = (ix + 0.5) / w;
    const fv = (iy + 0.5) / h;
    const o = (iy * w + ix) * 4;
    const r = data[o] / 255;
    const g = data[o + 1] / 255;
    const b = data[o + 2] / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const m = edgeMask(fu, fv, edgeStart);
    const accept = (FLOOR + (1 - FLOOR) * Math.pow(smooth(LO, HI, L), GAMMA)) * m;
    guard++;
    // 異常的圖（幾乎全黑）永遠抽不滿：超過上限就直接收下
    if (guard < maxGuard && rng() > accept) continue;

    u[n] = (ix + rng()) / w;
    v[n] = (iy + rng()) / h;
    lum[n] = L;
    jz[n] = (rng() - 0.5) * 0.05;
    // 越靠近邊緣顏色也越暗，雙重淡出
    const dim = Math.sqrt(Math.max(m, 0.05));
    col[n * 3] = Math.min(1, Math.pow(r, COLOR_GAMMA) * COLOR_GAIN) * dim;
    col[n * 3 + 1] = Math.min(1, Math.pow(g, COLOR_GAMMA) * COLOR_GAIN) * dim;
    col[n * 3 + 2] = Math.min(1, Math.pow(b, COLOR_GAMMA) * COLOR_GAIN) * dim;
    n++;
  }
  return { u, v, lum, jz, col, aspect: w / h };
}

function project(s: Sampled, worldH: number, cy: number, cx = 0): Float32Array {
  const n = s.u.length;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (s.u[i] - 0.5) * s.aspect * worldH + cx;
    out[i * 3 + 1] = (0.5 - s.v[i]) * worldH + cy;
    out[i * 3 + 2] = (s.lum[i] - 0.35) * 0.25 + s.jz[i];
  }
  return out;
}

/** 由上到下排序，再把每一條水平帶由左到右排序，讓不同雲之間的配對有空間連貫性 */
function order(positions: Float32Array, n: number, bands = 80): Uint32Array {
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((a, b) => positions[b * 3 + 1] - positions[a * 3 + 1]);
  const per = Math.ceil(n / bands);
  for (let s = 0; s < n; s += per) {
    idx.subarray(s, Math.min(n, s + per)).sort(
      (a, b) => positions[a * 3] - positions[b * 3]
    );
  }
  return idx;
}

function permute(src: Float32Array, idx: Uint32Array, stride: number) {
  const out = new Float32Array(src.length);
  for (let i = 0; i < idx.length; i++) {
    for (let k = 0; k < stride; k++) {
      out[i * stride + k] = src[idx[i] * stride + k];
    }
  }
  return out;
}

async function buildFigureData(
  spec: FigureSpec,
  count: number,
  headSeed: number
): Promise<FigureData> {
  const [hp, bp] = await Promise.all([
    loadPixels(spec.headUrl),
    loadPixels(spec.bodyUrl),
  ]);

  const head = sampleImage(hp, count, 101 + headSeed, spec.headEdge);
  const body = sampleImage(bp, count, 202 + headSeed, spec.bodyEdge);

  // 首頁頭像：同一批取樣點縮放後，讓橢圓中心落在頭部局部座標的 (0, 0.03)
  const [cu, cv] = spec.homeCenter;
  const [rh, rv] = spec.homeRadius;
  const cx0 = -(cu - 0.5) * head.aspect * spec.homeHeight;
  const cy0 = 0.03 - (0.5 - cv) * spec.homeHeight;
  const p0raw = project(head, spec.homeHeight, cy0, cx0);
  const p1raw = project(head, spec.headHeight, spec.headCY);
  const p2raw = project(body, spec.bodyHeight, spec.bodyCY);

  const homeRaw = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const dx = ((head.u[i] - cu) * head.aspect) / rh;
    const dy = (head.v[i] - cv) / rv;
    homeRaw[i] = 1 - smooth(0.5, 1, Math.hypot(dx, dy));
  }

  const o1 = order(p1raw, count);
  const o2 = order(p2raw, count);

  const p0 = permute(p0raw, o1, 3);
  const p1 = permute(p1raw, o1, 3);
  const home = permute(homeRaw, o1, 1);
  const c1 = permute(head.col, o1, 3);
  const p2 = permute(p2raw, o2, 3);
  const c2 = permute(body.col, o2, 3);

  const rng = createRng(7 + headSeed);
  const seed = new Float32Array(count);
  const delay = new Float32Array(count * 2);
  const top = spec.bodyCY + spec.bodyHeight / 2;
  const faceX = (cu - 0.5) * head.aspect * spec.headHeight;
  const faceY = (0.5 - cv) * spec.headHeight + spec.headCY;
  const faceR = spec.headHeight * 0.6;

  // 昇華版（傲慢）：特寫由中軸線向左右對稱展開；全身由腳下往上撐起
  const ascend = spec.variant === "ascend";
  const gather = spec.variant === "gather";
  const bottom = spec.bodyCY - spec.bodyHeight / 2;
  const headTop = spec.headCY + spec.headHeight / 2;
  const halfW = (head.aspect * spec.headHeight) / 2;

  for (let i = 0; i < count; i++) {
    const sd = rng();
    seed[i] = sd;
    const dx = p1[i * 3] - faceX;
    const dy = p1[i * 3 + 1] - faceY;
    if (ascend) {
      delay[i * 2] =
        clamp(Math.abs(dx) / halfW) * 0.75 +
        clamp((headTop - p1[i * 3 + 1]) / spec.headHeight) * 0.15 +
        sd * 0.1;
      delay[i * 2 + 1] =
        clamp((p2[i * 3 + 1] - bottom) / spec.bodyHeight) * 0.88 + sd * 0.12;
    } else if (gather) {
      // 吸附版（貪婪）：各處的粒子幾乎隨機地先後被吸進來
      delay[i * 2] = sd * 0.85 + clamp(Math.hypot(dx, dy) / faceR) * 0.15;
      delay[i * 2 + 1] =
        sd * 0.85 + clamp((top - p2[i * 3 + 1]) / spec.bodyHeight) * 0.15;
    } else {
      // 第一階段：從臉中心向外綻開
      delay[i * 2] = clamp(Math.hypot(dx, dy) / faceR) * 0.8 + sd * 0.2;
      // 第二階段：由頭頂往腳下掃描
      delay[i * 2 + 1] =
        clamp((top - p2[i * 3 + 1]) / spec.bodyHeight) * 0.88 + sd * 0.12;
    }
  }

  return {
    count,
    p0,
    home,
    p1,
    c1,
    p2,
    c2,
    seed,
    delay,
    body: { width: body.aspect * spec.bodyHeight, height: spec.bodyHeight, top },
  };
}

const cache = new Map<string, Promise<FigureData | null>>();

/** 同一組參數只會建立一次；失敗時回傳 null，下次呼叫會重試 */
export function getFigureData(
  slug: SinSlug,
  spec: FigureSpec,
  count: number,
  headSeed: number
): Promise<FigureData | null> {
  const key = `${slug}:${count}`;
  let p = cache.get(key);
  if (!p) {
    p = buildFigureData(spec, count, headSeed).catch(() => {
      cache.delete(key);
      return null;
    });
    cache.set(key, p);
  }
  return p;
}