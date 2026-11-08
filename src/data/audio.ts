import type { SinSlug } from "@/types/sin";

export type CueName = "enter" | "scan" | "reveal" | "leave";

/**
 * 想換成真正的音檔：
 * 1. 把檔案放進 public/audio/
 * 2. 在下面填入路徑（從 /audio/ 開始）
 * 沒填的項目會自動使用程式合成的聲音。
 *
 * 範例：
 *   ambient: "/audio/ambient.mp3",
 *   perSin: { lust: "/audio/lust.mp3" },
 *   cues: { enter: "/audio/enter.mp3" },
 */
export const AUDIO_FILES: {
  ambient: string | null;
  perSin: Partial<Record<SinSlug, string>>;
  cues: Partial<Record<CueName, string>>;
} = {
  ambient: null,
  perSin: {},
  cues: {},
};

export interface SynthVoice {
  /** 基音（Hz） */
  root: number;
  /** 最多 4 個泛音比例 */
  ratios: number[];
  /** 低通濾波頻率：越高越明亮 */
  cutoff: number;
  /** 空氣感雜訊音量 */
  noise: number;
  /** 濾波緩慢起伏的速度（Hz） */
  lfo: number;
}

export const HOME_VOICE: SynthVoice = {
  root: 55,
  ratios: [1, 1.5, 2],
  cutoff: 420,
  noise: 0.1,
  lfo: 0.05,
};

export const SIN_VOICES: Record<SinSlug, SynthVoice> = {
  lust: { root: 65.4, ratios: [1, 1.2, 1.5, 2.4], cutoff: 600, noise: 0.1, lfo: 0.07 },
  pride: { root: 73.4, ratios: [1, 1.5, 2, 3], cutoff: 900, noise: 0.06, lfo: 0.04 },
  greed: { root: 61.7, ratios: [1, 1.335, 2], cutoff: 520, noise: 0.1, lfo: 0.1 },
  gluttony: { root: 49, ratios: [1, 1.5, 1.89], cutoff: 300, noise: 0.16, lfo: 0.06 },
  sloth: { root: 55, ratios: [1, 2, 3], cutoff: 260, noise: 0.06, lfo: 0.02 },
  wrath: { root: 41.2, ratios: [1, 1.059, 1.414], cutoff: 700, noise: 0.2, lfo: 0.3 },
  envy: { root: 58.3, ratios: [1, 1.06, 1.5], cutoff: 520, noise: 0.12, lfo: 0.12 },
};