import { createRng, gaussian } from "./random";

export interface HeadCloud {
  positions: Float32Array;
  /** 0–1 亮度 */
  tones: Float32Array;
  seeds: Float32Array;
  /** 0 皮膚、1 亮線（輪廓/五官）、2 眼睛 */
  kinds: Float32Array;
  count: number;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const gauss = (d2: number, s2: number) => Math.exp(-d2 / s2);

const SX = 0.43;
const SZ = 0.5;
const HALF_H = 0.67;
const YC = 0.03;
const SIDES = [-1, 1] as const;

const _l = Math.hypot(-0.45, 0.6, 0.75);
const LX = -0.45 / _l;
const LY = 0.6 / _l;
const LZ = 0.75 / _l;

interface Variant {
  width: number;
  height: number;
  jaw: number;
  eyeGap: number;
  mouthW: number;
  noseW: number;
  brow: number;
}

function variantFor(seed: number): Variant {
  const r = createRng(seed * 9973 + 17);
  return {
    width: 0.95 + r() * 0.12,
    height: 0.97 + r() * 0.1,
    jaw: 0.3 + r() * 0.2,
    eyeGap: 0.15 + r() * 0.03,
    mouthW: 0.1 + r() * 0.04,
    noseW: 0.055 + r() * 0.02,
    brow: 0.2 + r() * 0.03,
  };
}

/** t∈[-1,1]（下巴→頭頂）對應的半寬比例 */
function profile(t: number, jaw: number): number {
  if (t >= 0) return Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.3)));
  const u = -t;
  const base = Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.6)));
  return base * (1 - jaw * 0.55 * Math.pow(smooth(0.1, 1, u), 1.3));
}

type Curve = {
  w: number;
  tone: number;
  kind: number;
  fn: (s: number) => [number, number];
};

/**
 * 程序化粒子頭（臉朝 +Z）。
 * 皮膚雜訊 + 亮輪廓線 + 五官亮線 + 耳朵 + 頸部。
 * 這是風格化的粒子頭，不是真實人臉重建。
 */
export function generateHeadCloud(count: number, seed: number): HeadCloud {
  const rng = createRng(seed * 7919 + 3);
  const v = variantFor(seed);

  const positions = new Float32Array(count * 3);
  const tones = new Float32Array(count);
  const seeds = new Float32Array(count);
  const kinds = new Float32Array(count);
  let n = 0;

  const push = (x: number, y: number, z: number, tone: number, kind: number) => {
    if (n >= count) return;
    positions[n * 3] = x;
    positions[n * 3 + 1] = y;
    positions[n * 3 + 2] = z;
    tones[n] = clamp(tone, 0.02, 1);
    seeds[n] = rng();
    kinds[n] = kind;
    n++;
  };

  const halfW = (y: number) => {
    const t = (y - YC) / (HALF_H * v.height);
    if (Math.abs(t) >= 1) return 0;
    return profile(t, v.jaw) * SX * v.width;
  };
  const frontZ = (x: number, y: number) => {
    const hw = halfW(y);
    if (hw < 1e-4) return 0;
    const k = x / hw;
    if (Math.abs(k) >= 1) return 0;
    return SZ * (hw / (SX * v.width)) * 0.95 * Math.sqrt(1 - k * k);
  };
  const noseBump = (x: number, y: number) => {
    const w = 0.0022 + 0.004 * smooth(-0.02, -0.15, y);
    return (
      Math.exp(-(x * x) / w) * smooth(0.13, 0.02, y) * smooth(-0.2, -0.14, y)
    );
  };

  const nOutline = Math.floor(count * 0.07);
  const nEars = Math.floor(count * 0.025);
  const nFeat = Math.floor(count * 0.1);
  const nNeck = Math.floor(count * 0.07);
  const nSkin = count - nOutline - nEars - nFeat - nNeck;

  // 1. 皮膚
  let k = 0;
  while (k < nSkin) {
    const t = rng() * 2 - 1;
    const th = rng() * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    if (s < 0 && rng() > 0.4) continue;

    const R = profile(t, v.jaw);
    const px = c * R * SX * v.width;
    const py = YC + t * HALF_H * v.height;
    const fw = smooth(0.1, 0.55, s);
    const pz = s * R * SZ * (s > 0 ? 0.95 : 1) + fw * 0.12 * noseBump(px, py);

    const ny = 0.5 * t;
    const nl = Math.hypot(c, ny, s) || 1;
    let tone = 0.14 + 0.42 * Math.max(0, (c * LX + ny * LY + s * LZ) / nl);
    tone += Math.pow(1 - Math.abs(s), 4) * 0.2;

    for (const e of SIDES) {
      const dx = px - e * v.eyeGap;
      const dy = (py - 0.09) * 1.7;
      tone *= 1 - 0.55 * fw * gauss(dx * dx + dy * dy, 0.006);
    }
    tone *= 1 - 0.4 * fw * gauss(px * px + (py + 0.2) * (py + 0.2) * 4, 0.004);
    tone *=
      1 -
      0.5 *
        fw *
        gauss((py + 0.335) * (py + 0.335), 0.0006) *
        smooth(v.mouthW * 1.4, v.mouthW * 0.6, Math.abs(px));
    tone +=
      fw * 0.12 * gauss((Math.abs(px) - 0.24) ** 2 + (py + 0.05) ** 2, 0.012);

    tone *= 0.55 + rng() * 0.9;
    if (rng() < 0.1) tone *= 0.3;
    if (s < 0) tone *= 0.6;
    push(px, py, pz, tone, 0);
    k++;
  }

  // 2. 輪廓亮線（頭的剪影）
  for (let j = 0; j < nOutline; j++) {
    const t = Math.sin((rng() * 2 - 1) * (Math.PI / 2)); // 兩端較密
    const side = rng() < 0.5 ? -1 : 1;
    const x = side * profile(t, v.jaw) * SX * v.width + gaussian(rng) * 0.003;
    const y = YC + t * HALF_H * v.height + gaussian(rng) * 0.003;
    push(x, y, gaussian(rng) * 0.02, 0.8 + rng() * 0.2, 1);
  }

  // 3. 五官亮線
  const curves: Curve[] = [];
  for (const e of SIDES) {
    curves.push({
      w: 0.15,
      tone: 0.95,
      kind: 2,
      fn: (s) => [
        e * v.eyeGap + (s - 0.5) * 0.15,
        0.09 - 0.011 * Math.sin(s * Math.PI),
      ],
    });
    curves.push({
      w: 0.07,
      tone: 0.55,
      kind: 1,
      fn: (s) => [
        e * (0.06 + s * 0.2),
        v.brow + 0.02 * Math.sin(s * Math.PI * 0.9) - 0.03 * s,
      ],
    });
    curves.push({
      w: 0.07,
      tone: 0.8,
      kind: 1,
      fn: (s) => [
        e * (0.03 + (v.noseW - 0.03) * Math.pow(s, 1.5)),
        0.1 - 0.23 * s,
      ],
    });
    curves.push({
      w: 0.02,
      tone: 1,
      kind: 1,
      fn: () => [
        e * v.noseW * 0.55 + gaussian(rng) * 0.006,
        -0.158 + gaussian(rng) * 0.004,
      ],
    });
  }
  curves.push({
    w: 0.12,
    tone: 0.85,
    kind: 1,
    fn: (s) => [(2 * s - 1) * v.noseW * 1.15, -0.17 + 0.03 * (2 * s - 1) ** 2],
  });
  curves.push({
    w: 0.2,
    tone: 0.85,
    kind: 1,
    fn: (s) => [(2 * s - 1) * v.mouthW, -0.335 + 0.02 * (2 * s - 1) ** 2],
  });
  curves.push({
    w: 0.06,
    tone: 0.5,
    kind: 1,
    fn: (s) => [(2 * s - 1) * 0.07, -0.47 + 0.01 * (2 * s - 1) ** 2],
  });

  for (const c of curves) {
    const m = Math.floor(nFeat * c.w);
    for (let j = 0; j < m; j++) {
      const [x, y] = c.fn(rng());
      const z = frontZ(x, y) + 0.12 * noseBump(x, y) + 0.012;
      push(
        x + gaussian(rng) * 0.002,
        y + gaussian(rng) * 0.002,
        z,
        c.tone * (0.85 + rng() * 0.15),
        c.kind
      );
    }
  }

  // 4. 耳朵
  const per = Math.floor(nEars / 2);
  for (const e of SIDES) {
    const cx = e * (halfW(-0.04) + 0.03);
    const cy = -0.03;
    const rx = 0.04;
    const ry = 0.115;
    for (let j = 0; j < per; j++) {
      if (rng() < 0.65) {
        const a = (rng() * 2 - 1) * 2.3;
        push(
          cx + e * Math.cos(a) * rx,
          cy + Math.sin(a) * ry,
          -0.03,
          0.7 + rng() * 0.25,
          1
        );
      } else {
        const r = Math.sqrt(rng());
        const a = rng() * Math.PI * 2;
        push(
          cx + e * Math.cos(a) * rx * r,
          cy + Math.sin(a) * ry * r,
          -0.03,
          0.25 + rng() * 0.15,
          0
        );
      }
    }
  }

  // 5. 頸部（補足剩餘數量）
  while (n < count) {
    const a = rng() * Math.PI * 2;
    const h = rng();
    const r = 0.17 + h * 0.03;
    const x = Math.cos(a) * r * v.width;
    const z = Math.sin(a) * r * 0.9 - 0.02;
    const y = -0.55 - h * 0.3;
    const lit = Math.max(0, Math.cos(a) * LX + Math.sin(a) * LZ);
    push(x, y, z, (0.16 + 0.3 * lit) * (1 - 0.5 * h) * (0.6 + rng() * 0.8), 0);
  }

  return { positions, tones, seeds, kinds, count };
}