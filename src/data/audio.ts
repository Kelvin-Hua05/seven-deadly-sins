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
  /** 首頁（封面）專用；沒填就用 ambient */
  home: string | null;
  /** 所有場景共用；角色沒有專屬檔案時使用 */
  ambient: string | null;
  perSin: Partial<Record<SinSlug, string>>;
  cues: Partial<Record<CueName, string>>;
} = {
  home: "/audio/home.mp3",
  ambient: "/audio/ambient.mp3",
  perSin: {
    envy: "/audio/envy.mp3",
    wrath: "/audio/wrath.mp3",
    greed: "/audio/greed.mp3",
    lust: "/audio/lust.mp3",
    pride: "/audio/pride.mp3",
  },
  cues: {},
};

/**
 * 「開場 + 循環」的檔案：開場播一次，之後只循環 [start, end]（單位：秒）。
 * 沒有列在這裡的檔案，則整段循環。
 */
export const LOOP_POINTS: Record<string, { start: number; end: number }> = {
  "/audio/home.mp3": { start: 5.0, end: 11.92 },
  "/audio/envy.mp3": { start: 4.28, end: 20.183 },
  "/audio/wrath.mp3": { start: 3.01, end: 16.495 },
  "/audio/greed.mp3": { start: 4.63, end: 17.34 },
  "/audio/lust.mp3": { start: 2.78, end: 13.555 },
  "/audio/pride.mp3": { start: 4.4, end: 14.6 },
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