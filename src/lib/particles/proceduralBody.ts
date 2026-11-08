import { createRng, gaussian } from "./random";
import type { BodyStyle } from "@/data/sinVisuals";

export interface BodyCloud {
  positions: Float32Array;
  tones: Float32Array;
  seeds: Float32Array;
  /** 0 外套、1 亮線、3 強調色物件（背心/領帶/胸針） */
  kinds: Float32Array;
  count: number;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const SIDES = [-1, 1] as const;

const Y_TOP = -0.8;
const Y_BOT = -3.0;
const NECK_W = 0.2;

function halfWidth(y: number, st: BodyStyle): number {
  if (y >= Y_TOP) return NECK_W;
  if (y > -1.22) {
    const t = clamp((Y_TOP - y) / 0.42);
    return NECK_W + (st.shoulder - NECK_W) * Math.sin((t * Math.PI) / 2);
  }
  const k = smooth(-1.22, Y_BOT, y);
  return st.shoulder - (st.shoulder - st.waist) * k;
}

function frontZ(x: number, y: number, st: BodyStyle): number {
  const hw = halfWidth(y, st);
  const k = x / hw;
  if (Math.abs(k) >= 1) return 0;
  const d = 0.17 + (st.depth - 0.17) * smooth(Y_TOP, -1.25, y);
  return d * Math.sqrt(1 - k * k);
}

/** 背心 / 襯衫 V 區半寬 */
function vHalf(y: number): number {
  if (y > -2.1) return 0.09 + 0.18 * clamp((-0.88 - y) / 1.22);
  return 0.27 - 0.1 * clamp((-2.1 - y) / 0.9);
}

function tieHalf(y: number): number {
  if (y > -1.02 || y < -2.6) return 0;
  if (y > -1.16) return 0.045;
  const t = clamp((-1.16 - y) / 1.44);
  return t < 0.55 ? 0.06 + 0.05 * (t / 0.55) : 0.11 * (1 - (t - 0.55) / 0.45);
}

type Curve = {
  w: number;
  tone: number;
  kind: number;
  fn: (s: number) => [number, number];
};

/** 程序化上半身（頭部局部座標，頸部以下）：外套、背心、領帶、胸針、懷錶鍊 */
export function generateBodyCloud(
  count: number,
  seed: number,
  st: BodyStyle
): BodyCloud {
  const rng = createRng(seed * 104729 + 11);
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

  const skin = () => {
    const y = Y_TOP + (Y_BOT - Y_TOP) * Math.pow(rng(), 1.25);
    const hw = halfWidth(y, st);
    const u = rng() * 2 - 1;
    const x = u * hw;
    const front = rng() < 0.88;
    const zf = frontZ(x, y, st);
    const z = front ? zf : -zf * 0.9;

    const nx = u * 0.7;
    const nz = front ? 0.8 : -0.8;
    const nl = Math.hypot(nx, 0.1, nz);
    const lit = Math.max(0, (nx * -0.45 + 0.06 + nz * 0.75) / nl);
    let tone = 0.1 + 0.34 * lit;
    let kind = 0;

    if (front) {
      if (st.tie && Math.abs(x) < tieHalf(y)) {
        tone = 0.08 + 0.06 * rng();
      } else if (st.vest && y < -0.9 && Math.abs(x) < vHalf(y)) {
        tone = 0.5 + 0.35 * rng();
        kind = 3;
      }
    } else {
      tone *= 0.5;
    }
    tone *= 0.6 + rng() * 0.8;
    push(x, y, z, tone, kind);
  };

  const nSkin = Math.floor(count * 0.6);
  const nOutline = Math.floor(count * 0.09);
  const nBrooch = st.brooch ? Math.floor(count * 0.012) : 0;

  for (let k = 0; k < nSkin; k++) skin();

  // 外輪廓
  for (let k = 0; k < nOutline; k++) {
    const y = Y_TOP + (Y_BOT - Y_TOP) * rng();
    const side = rng() < 0.5 ? -1 : 1;
    push(
      side * halfWidth(y, st) + gaussian(rng) * 0.004,
      y,
      gaussian(rng) * 0.02,
      0.75 + rng() * 0.2,
      1
    );
  }

  // 胸針中心
  for (let k = 0; k < nBrooch; k++) {
    const r = 0.06 * Math.sqrt(rng());
    const a = rng() * Math.PI * 2;
    const x = 0.42 + Math.cos(a) * r;
    const y = -1.6 + Math.sin(a) * r;
    push(x, y, frontZ(x, y, st) + 0.02, 0.85 + rng() * 0.15, 3);
  }

  // 亮線
  const curves: Curve[] = [];
  for (const e of SIDES) {
    if (st.lapel) {
      curves.push({
        w: 0.1,
        tone: 0.7,
        kind: 1,
        fn: (s) => {
          const y = -0.9 - 1.2 * s;
          return [e * vHalf(y), y];
        },
      });
      curves.push({
        w: 0.08,
        tone: 0.6,
        kind: 1,
        fn: (s) => {
          const y = -0.95 - 1.0 * s;
          return [e * (vHalf(y) + 0.15), y];
        },
      });
      curves.push({
        w: 0.07,
        tone: 0.6,
        kind: 1,
        fn: (s) => [e * (0.27 - 0.13 * s), -2.1 - 0.9 * s],
      });
    }
    curves.push({
      w: 0.06,
      tone: 0.4,
      kind: 1,
      fn: (s) => [e * 0.5, -1.55 - 1.45 * s],
    });
    if (st.tie) {
      curves.push({
        w: 0.08,
        tone: 0.55,
        kind: 1,
        fn: (s) => {
          const y = -1.02 - 1.58 * s;
          return [e * tieHalf(y), y];
        },
      });
    }
    curves.push({
      w: 0.03,
      tone: 0.7,
      kind: 1,
      fn: (s) => [e * (0.1 + 0.1 * s), -0.84 - 0.09 * s],
    });
  }
  if (st.brooch) {
    curves.push({
      w: 0.04,
      tone: 0.95,
      kind: 3,
      fn: (s) => {
        const a = s * Math.PI * 2;
        return [0.42 + Math.cos(a) * 0.09, -1.6 + Math.sin(a) * 0.09];
      },
    });
  }
  if (st.chain) {
    curves.push({
      w: 0.08,
      tone: 0.8,
      kind: 1,
      fn: (s) => [
        -0.17 - 0.23 * s,
        -2.15 - 0.04 * s - 0.14 * Math.sin(Math.PI * s),
      ],
    });
    curves.push({
      w: 0.03,
      tone: 1,
      kind: 3,
      fn: (s) => {
        const a = s * Math.PI * 2;
        return [-0.4 + Math.cos(a) * 0.05, -2.26 + Math.sin(a) * 0.05];
      },
    });
  }

  const remaining = count - n;
  const totalW = curves.reduce((a, c) => a + c.w, 0);
  for (const c of curves) {
    const m = Math.floor((remaining * 0.9 * c.w) / totalW);
    for (let j = 0; j < m; j++) {
      const [x, y] = c.fn(rng());
      push(
        x + gaussian(rng) * 0.003,
        y + gaussian(rng) * 0.003,
        frontZ(x, y, st) + 0.015,
        c.tone * (0.85 + rng() * 0.15),
        c.kind
      );
    }
  }

  while (n < count) skin();

  return { positions, tones, seeds, kinds, count };
}