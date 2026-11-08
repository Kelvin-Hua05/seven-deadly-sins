import type { SinSlug } from "@/types/sin";

/** 角色身體的程序化造型。Phase 4 會逐一替其他角色客製 */
export interface BodyStyle {
  shoulder: number;
  waist: number;
  depth: number;
  lapel: boolean;
  vest: boolean;
  tie: boolean;
  brooch: boolean;
  chain: boolean;
}

const SUIT: BodyStyle = {
  shoulder: 0.74,
  waist: 0.62,
  depth: 0.3,
  lapel: true,
  vest: true,
  tie: true,
  brooch: false,
  chain: false,
};

export const BODY_STYLES: Record<SinSlug, BodyStyle> = {
  lust: { ...SUIT, brooch: true, chain: true },
  pride: SUIT,
  greed: SUIT,
  gluttony: SUIT,
  sloth: SUIT,
  wrath: SUIT,
  envy: SUIT,
};

/** 漂浮符號形狀：0 唇形、1 菱形、2 十字 */
export const SYMBOL_SHAPE: Record<SinSlug, number> = {
  lust: 0,
  pride: 1,
  greed: 2,
  gluttony: 0,
  sloth: 1,
  wrath: 2,
  envy: 1,
};

/** 粒子行為：0 柔和擺動 / 1 對稱升騰 / 2 向內吸附 / 3 旋渦吞噬 / 4 緩慢下垂 / 5 破碎爆發 / 6 重影錯位 */
export const PARTICLE_STYLE: Record<SinSlug, number> = {
  lust: 0,
  pride: 1,
  greed: 2,
  gluttony: 3,
  sloth: 4,
  wrath: 5,
  envy: 6,
};