/**
 * 背景旋律：每小節 16 個十六分音符（60 BPM 時一小節 4 秒）。
 * null = 休止。兩小節循環。可直接改音符，其他程式不用動。
 * 音名格式：字母 + 可選的 # + 八度，例如 "A4"、"C#5"。
 */
export const MELODY: { bpm: number; bars: (string | null)[][] } = {
  bpm: 60,
  bars: [
    ["A4", "A3", "B4", "A4", "E4", "A4", "A4", "C5", "D4", "A4", "B4", "A4", "E4", "B4", "B4", "D5"],
    ["A4", "A3", "B4", "A4", "E4", "B4", "A4", "A4", "B4", "B4", "B4", "A4", "E4", "A4", "B4", "B4"],
  ],
};

const SEMI: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

export function noteFreq(name: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const midi = 12 * (Number(m[2]) + 1) + SEMI[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}