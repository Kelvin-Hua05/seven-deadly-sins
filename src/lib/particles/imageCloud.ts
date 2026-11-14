import type { FigureSpec } from "@/data/figures";
import type { SinSlug } from "@/types/sin";
import { generateHeadCloud } from "./proceduralHead";
import { createRng } from "./random";

/** 一組「頭 → 特寫 → 全身」的粒子資料。三組粒子依「由上到下、由左到右」配對 */
export interface FigureData {
  count: number;
  /** 起點：程序化頭 */
  p0: Float32Array;
  tone0: Float32Array;
  kind0: Float32Array;
  seed: Float32Array;
  /** 特寫圖 */
  p1: Float32Array;
  c1: Float32Array;
  /** 全身圖 */
  p2: Float32Array;
  c2: Float32Array;
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

/** 依亮度做重要性取樣：越亮的地方粒子越多，顏色取自原圖 */
function sampleImage(
  px: Pixels,
  count: number,
  seed: number,
  worldH: number,
  cy: number
) {
  const { data, w, h } = px;
  const rng = createRng(seed);
  const aspect = w / h;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const maxGuard = count * 120;
  let n = 0;
  let guard = 0;

  while (n < count) {
    const ix = (rng() * w) | 0;
    const iy = (rng() * h) | 0;
    const o = (iy * w + ix) * 4;
    const r = data[o] / 255;
    const g = data[o + 1] / 255;
    const b = data[o + 2] / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const accept = FLOOR + (1 - FLOOR) * Math.pow(smooth(LO, HI, L), GAMMA);
    guard++;
    // 全黑的圖永遠抽不滿：超過上限就直接收下
    if (guard < maxGuard && rng() > accept) continue;

    const i = n * 3;
    pos[i] = ((ix + rng()) / w - 0.5) * aspect * worldH;
    pos[i + 1] = (0.5 - (iy + rng()) / h) * worldH + cy;
    pos[i + 2] = (L - 0.35) * 0.25 + (rng() - 0.5) * 0.05;
    col[i] = Math.min(1, Math.pow(r, COLOR_GAMMA) * COLOR_GAIN);
    col[i + 1] = Math.min(1, Math.pow(g, COLOR_GAMMA) * COLOR_GAIN);
    col[i + 2] = Math.min(1, Math.pow(b, COLOR_GAMMA) * COLOR_GAIN);
    n++;
  }
  return { pos, col, aspect };
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

  const head = generateHeadCloud(count, headSeed);
  const s1 = sampleImage(hp, count, 101 + headSeed, spec.headHeight, spec.headCY);
  const s2 = sampleImage(bp, count, 202 + headSeed, spec.bodyHeight, spec.bodyCY);

  const o0 = order(head.positions, count);
  const o1 = order(s1.pos, count);
  const o2 = order(s2.pos, count);

  const p0 = permute(head.positions, o0, 3);
  const tone0 = permute(head.tones, o0, 1);
  const kind0 = permute(head.kinds, o0, 1);
  const p1 = permute(s1.pos, o1, 3);
  const c1 = permute(s1.col, o1, 3);
  const p2 = permute(s2.pos, o2, 3);
  const c2 = permute(s2.col, o2, 3);

  const rng = createRng(7 + headSeed);
  const seed = new Float32Array(count);
  const delay = new Float32Array(count * 2);
  const top = spec.bodyCY + spec.bodyHeight / 2;
  const faceR = spec.headHeight * 0.6;

  for (let i = 0; i < count; i++) {
    const sd = rng();
    seed[i] = sd;
    // 第一階段：從臉中心向外綻開
    const dx = p1[i * 3];
    const dy = p1[i * 3 + 1] - spec.headCY;
    delay[i * 2] = clamp(Math.hypot(dx, dy) / faceR) * 0.8 + sd * 0.2;
    // 第二階段：由頭頂往腳下掃描
    delay[i * 2 + 1] =
      clamp((top - p2[i * 3 + 1]) / spec.bodyHeight) * 0.88 + sd * 0.12;
  }

  return {
    count,
    p0,
    tone0,
    kind0,
    seed,
    p1,
    c1,
    p2,
    c2,
    delay,
    body: { width: s2.aspect * spec.bodyHeight, height: spec.bodyHeight, top },
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