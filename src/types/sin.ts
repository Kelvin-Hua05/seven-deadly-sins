export type SinSlug =
  | "lust"
  | "pride"
  | "greed"
  | "gluttony"
  | "sloth"
  | "wrath"
  | "envy";

export interface SinPalette {
  /** 主色：hover 揭示、標題強調 */
  primary: string;
  /** 輔色：陰影、光暈、漸層 */
  secondary: string;
  /** 光暈色（halo / 環境光） */
  glow: string;
}

export interface SymbolicPhrase {
  zh: string;
  en: string;
}

export interface SinCharacterDirection {
  /** 角色造型描述（Phase 3/4 製作粒子人形時參考） */
  look: string;
  /** 粒子行為關鍵字 */
  particleBehavior: string;
  /** 象徵物件 */
  motifs: string[];
}

export interface Sin {
  slug: SinSlug;
  /** 1–7，用於 01 / 07 顯示 */
  index: number;
  titleZh: string;
  titleEn: string;
  introduction: string;
  supportingEn: string;
  /** 恰好四句，環繞角色排列 */
  phrases: [SymbolicPhrase, SymbolicPhrase, SymbolicPhrase, SymbolicPhrase];
  palette: SinPalette;
  character: SinCharacterDirection;
}