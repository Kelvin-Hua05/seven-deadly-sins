import { createRng, gaussian } from "./random";

export interface HeadCloud {
  positions: Float32Array;
  /** 0–1 亮度：決定顆粒大小、亮度、暗部 */
  tones: Float32Array;
  seeds: Float32Array;
  count: number;
}

interface Variant {
  width: number;
  height: number;
  jaw: number;
  noseLen: number;
  eyeGap: number;
  mouthW: number;
  brow: number;
  cheek: number;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const gauss = (d2: number, s2: number) => Math.exp(-d2 / s2);

function variantFor(seed: number): Variant {
  const r = createRng(seed * 9973 + 17);
  return {
    width: 0.92 + r() * 0.2,
    height: 0.94 + r() * 0.16,
    jaw: 0.3 + r() * 0.22,
    noseLen: 0.1 + r() * 0.09,
    eyeGap: 0.16 + r() * 0.05,
    mouthW: 0.1 + r() * 0.06,
    brow: 0.025 + r() * 0.04,
    cheek: r() * 0.04,
  };
}

const L = (() => {
  const v = [-0.45, 0.6, 0.75];
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

const Y_OFFSET = 0.2; // 讓整顆頭（含頸）的中心接近原點

/**
 * 程序化粒子頭：臉朝 +Z。
 * 以變形橢球表面取樣，再疊加眼、鼻、嘴、眉、顴骨的位移與亮度。
 * 這是風格化的粒子頭，不是真實人臉重建。
 */
export function generateHeadCloud(count: number, seed: number): HeadCloud {
  const rng = createRng(seed * 7919 + 3);
  const v = variantFor(seed);

  const positions = new Float32Array(count * 3);
  const tones = new Float32Array(count);
  const seeds = new Float32Array(count);

  const neckCount = Math.floor(count * 0.1);
  const headCount = count - neckCount;

  let n = 0;
  while (n < headCount) {
    let x = gaussian(rng);
    let y = gaussian(rng);
    let z = gaussian(rng);
    const len = Math.hypot(x, y, z) || 1;
    x /= len;
    y /= len;
    z /= len;

    // 臉部（前側）取樣較密
    if (z < 0 && rng() > 0.5) continue;

    const jawT = y < 0.05 ? clamp((0.05 - y) / 1.05) : 0;
    const taper = 1 - v.jaw * Math.pow(jawT, 1.4);
    const sx = 0.42 * v.width * taper;
    const sz = 0.5 * (1 - 0.2 * jawT);
    const sy = (y >= 0 ? 0.58 : 0.74) * v.height;

    const px = x * sx;
    const py = y * sy;
    let pz = z * sz;

    const fw = smooth(0.1, 0.6, z); // 前臉權重

    // 基礎光照 + 輪廓亮邊
    let tone = 0.22 + 0.62 * Math.max(0, x * L[0] + y * L[1] + z * L[2]);
    tone += Math.pow(1 - Math.abs(z), 3) * 0.5;

    // 鼻
    const bump = Math.exp(-((px * px) / 0.0025 + ((py + 0.08) * (py + 0.08)) / 0.006));
    const tip = Math.exp(-((px * px) / 0.006 + ((py + 0.15) * (py + 0.15)) / 0.002));
    pz += fw * v.noseLen * (bump + 0.4 * tip);
    tone += fw * 0.45 * bump;

    // 眼
    for (const s of [-1, 1]) {
      const dx = px - s * v.eyeGap;
      const dy = (py - 0.12) * 1.6;
      const d2 = dx * dx + dy * dy;
      const socket = gauss(d2, 0.008);
      pz -= fw * 0.05 * socket;
      tone *= 1 - 0.8 * fw * socket;
      tone += fw * 1.2 * gauss(d2, 0.0006); // 瞳孔亮點
      tone += fw * 0.5 * gauss((Math.sqrt(d2) - 0.075) ** 2, 0.00015); // 眼輪廓
    }

    // 眉骨
    const browMask = smooth(0.35, 0.1, Math.abs(px));
    const browLine = gauss((py - 0.2) * (py - 0.2), 0.0015) * browMask;
    pz += fw * v.brow * browLine;
    tone += fw * 0.3 * browLine;

    // 嘴
    const my = -0.3;
    const mouthMask = smooth(v.mouthW, v.mouthW * 0.6, Math.abs(px));
    const mouthLine = gauss((py - my) * (py - my), 0.00004) * mouthMask;
    pz += fw * 0.03 * gauss((py - my) * (py - my), 0.0004) * mouthMask;
    tone *= 1 - 0.9 * fw * mouthLine;
    tone += fw * 0.4 * gauss((py - my - 0.025) ** 2, 0.00008) * mouthMask;

    // 顴骨
    const cheek = gauss((Math.abs(px) - 0.26) ** 2 + (py + 0.02) ** 2, 0.01);
    pz += fw * v.cheek * cheek;
    tone += fw * 0.15 * cheek;

    // 顆粒雜訊 + 暗點
    tone *= 0.7 + rng() * 0.6;
    if (rng() < 0.12) tone *= 0.25;

    positions[n * 3] = px;
    positions[n * 3 + 1] = py + Y_OFFSET;
    positions[n * 3 + 2] = pz;
    tones[n] = clamp(tone, 0.02, 1);
    seeds[n] = rng();
    n++;
  }

  // 頸部
  for (let k = 0; k < neckCount; k++) {
    const a = rng() * Math.PI * 2;
    const h = rng();
    const r = 0.17 + h * 0.03;
    const x = Math.cos(a) * r * v.width;
    const z = Math.sin(a) * r * 0.9;
    const y = -0.55 - h * 0.5 + Y_OFFSET;
    const lit = Math.max(0, Math.cos(a) * L[0] + Math.sin(a) * L[2]);
    const tone = (0.2 + 0.35 * lit) * (1 - h * 0.85) * (0.7 + rng() * 0.6);

    const i = n + k;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    tones[i] = clamp(tone, 0.02, 1);
    seeds[i] = rng();
  }

  return { positions, tones, seeds, count };
}