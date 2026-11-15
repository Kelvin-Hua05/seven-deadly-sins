import type { SinSlug } from "@/types/sin";

/**
 * 有提供插圖的角色。沒列在這裡的角色仍使用程序化粒子人形。
 * 單位是「頭部局部座標」：程序化頭的高度約 1.3。
 * 圖片座標 (u, v) 皆為 0–1：左上角 = (0, 0)。
 */
export interface FigureSpec {
  /** 臉部特寫圖（放在 public/ 底下，從 / 開始） */
  headUrl: string;
  /** 全身圖 */
  bodyUrl: string;

  /** 首頁頭像：特寫圖縮放後的高度 */
  homeHeight: number;
  /** 首頁頭像：取樣橢圓中心（圖片座標）。橢圓以外不顯示，邊緣淡出 */
  homeCenter: [u: number, v: number];
  /** 首頁頭像：橢圓半徑（以圖片高度為 1 計） */
  homeRadius: [horizontal: number, vertical: number];

  /** 角色頁的特寫：高度與中心 y（往下調 = 整體下移） */
  headHeight: number;
  headCY: number;
  /** 角色頁的全身 */
  bodyHeight: number;
  bodyCY: number;

  /** 邊界淡出起點（0–1）：越小，淡出範圍越大、邊界越不明顯 */
  headEdge: number;
  bodyEdge: number;

  /**
   * 切換動畫的類型：
   *   flow     粒子流動、向外綻開、掃描成形（預設）
   *   shatter  粒子爆開成碎片，再被拉回、咔地拼合，伴隨衝擊波與震動
   *   mist     粒子失焦成霧、緩慢下垂搖曳，再慢慢對焦成形，成形後仍緩緩下沉
   *   ascend   由中軸線向左右對稱展開、向上升騰；全身由腳下往上撐起，落點閃金光
   */
  variant?: "flow" | "shatter" | "mist" | "ascend";
}

export const FIGURES: Partial<Record<SinSlug, FigureSpec>> = {
  lust: {
    headUrl: "/images/figures/lust-head.jpg",
    bodyUrl: "/images/figures/lust-body.jpg",
    homeHeight: 2.7,
    homeCenter: [0.5, 0.33],
    homeRadius: [0.31, 0.3],
    headHeight: 2.9,
    headCY: -0.35,
    bodyHeight: 3.1,
    bodyCY: -0.45,
    headEdge: 0.5,
    bodyEdge: 0.55,
  },

  wrath: {
    headUrl: "/images/figures/wrath-head.jpg",
    bodyUrl: "/images/figures/wrath-body.jpg",
    homeHeight: 2.7,
    homeCenter: [0.47, 0.3],
    homeRadius: [0.3, 0.3],
    headHeight: 2.9,
    headCY: -0.35,
    bodyHeight: 3.1,
    bodyCY: -0.45,
    headEdge: 0.5,
    bodyEdge: 0.55,
    variant: "shatter",
  },

  sloth: {
    headUrl: "/images/figures/sloth-head.jpg",
    bodyUrl: "/images/figures/sloth-body.jpg",
    homeHeight: 2.7,
    homeCenter: [0.55, 0.33],
    homeRadius: [0.3, 0.3],
    headHeight: 2.9,
    headCY: -0.35,
    bodyHeight: 3.1,
    bodyCY: -0.45,
    headEdge: 0.5,
    bodyEdge: 0.55,
    variant: "mist",
  },

  pride: {
    headUrl: "/images/figures/pride-head.jpg",
    bodyUrl: "/images/figures/pride-body.jpg",
    homeHeight: 2.7,
    homeCenter: [0.55, 0.36],
    homeRadius: [0.34, 0.32],
    headHeight: 2.9,
    headCY: -0.35,
    bodyHeight: 3.1,
    bodyCY: -0.45,
    headEdge: 0.5,
    bodyEdge: 0.55,
    variant: "ascend",
  },
};