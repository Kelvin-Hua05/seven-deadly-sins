import type { SinSlug } from "@/types/sin";

/**
 * 有提供插圖的角色。沒列在這裡的角色仍使用程序化粒子人形。
 * 單位是「頭部局部座標」：程序化頭的高度約 1.3。
 */
export interface FigureSpec {
  /** 臉部特寫圖（放在 public/ 底下，從 / 開始） */
  headUrl: string;
  /** 全身圖 */
  bodyUrl: string;
  headHeight: number;
  /** 特寫圖中心的 y：往下調 = 特寫整體下移 */
  headCY: number;
  bodyHeight: number;
  bodyCY: number;
}

export const FIGURES: Partial<Record<SinSlug, FigureSpec>> = {
  lust: {
    headUrl: "/images/figures/lust-head.jpg",
    bodyUrl: "/images/figures/lust-body.jpg",
    headHeight: 2.9,
    headCY: -0.35,
    bodyHeight: 3.1,
    bodyCY: -0.45,
  },
};