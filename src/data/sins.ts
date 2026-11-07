import type { Sin, SinSlug } from "@/types/sin";

/**
 * 所有角色內容集中於此。
 * 文案為初版編輯內容（虛構詮釋，非歷史或宗教定論），可直接修改而不影響元件。
 */
export const SINS: readonly Sin[] = [
  {
    slug: "lust",
    index: 1,
    titleZh: "色慾",
    titleEn: "LUST",
    introduction:
      "「慾望，是對美好事物的渴求；當渴望凌駕於理智，便可能成為束縛靈魂的枷鎖。」",
    supportingEn: "THE DESIRE THAT CONSUMES.",
    phrases: [
      { zh: "眼起妄念", en: "Desire born of sight" },
      { zh: "困於表象", en: "Trapped by appearances" },
      { zh: "為相著迷", en: "Enthralled by form" },
      { zh: "幻象勾心", en: "Illusion seizes the heart" },
    ],
    palette: { primary: "#FF5C93", secondary: "#8E1B3A", glow: "#FF3D7F" },
    character: {
      look: "優雅的人形，正式服裝，神秘而誘惑的神情",
      particleBehavior: "柔和流動，輕微呼吸感",
      motifs: ["圓形光暈", "漂浮的抽象符號", "玫瑰粉與酒紅光線"],
    },
  },
  {
    slug: "pride",
    index: 2,
    titleZh: "傲慢",
    titleEn: "PRIDE",
    introduction:
      "「當自我凌駕於一切，優越感便成為牢籠，使人無法看見自身的局限。」",
    supportingEn: "THE CROWN THAT BLINDS.",
    phrases: [
      { zh: "自視為王", en: "Crowned by oneself" },
      { zh: "俯瞰眾生", en: "Looking down on all" },
      { zh: "拒絕平凡", en: "Refusing the ordinary" },
      { zh: "迷失於己", en: "Lost in the self" },
    ],
    palette: { primary: "#D9B24C", secondary: "#2A2108", glow: "#F2CB5E" },
    character: {
      look: "威嚴的統治者姿態，挺拔，嚴格對稱構圖",
      particleBehavior: "穩定、對稱，向上緩升",
      motifs: ["皇冠意象", "對稱光環", "金與黑"],
    },
  },
  {
    slug: "greed",
    index: 3,
    titleZh: "貪婪",
    titleEn: "GREED",
    introduction:
      "「擁有從來不是終點。當渴望不斷膨脹，再多的財富也無法填滿內心。」",
    supportingEn: "THE HUNGER THAT NEVER ENDS.",
    phrases: [
      { zh: "欲壑難填", en: "A hunger without end" },
      { zh: "囤積所有", en: "Hoarding everything" },
      { zh: "得而不滿", en: "Never satisfied by gain" },
      { zh: "困於佔有", en: "Bound by possession" },
    ],
    palette: { primary: "#2FD08A", secondary: "#C9A24A", glow: "#3BE39A" },
    character: {
      look: "精於算計、具佔有慾的人形",
      particleBehavior: "粒子向角色聚攏、被吸附",
      motifs: ["錢幣與財富意象", "祖母綠與金屬金"],
    },
  },
  {
    slug: "gluttony",
    index: 4,
    titleZh: "暴食",
    titleEn: "GLUTTONY",
    introduction:
      "「當享受成為唯一追求，滿足便逐漸消失，留下的只有不斷擴大的空虛。」",
    supportingEn: "THE EMPTINESS THAT FEEDS.",
    phrases: [
      { zh: "貪求無度", en: "Craving without measure" },
      { zh: "吞噬空虛", en: "Devouring the void" },
      { zh: "沉溺享樂", en: "Drowned in pleasure" },
      { zh: "永不知足", en: "Never enough" },
    ],
    palette: { primary: "#9B5CFF", secondary: "#5A1630", glow: "#8A45F0" },
    character: {
      look: "奢華過度、沉溺享樂的人形",
      particleBehavior: "粒子持續流向中心",
      motifs: ["盛宴與消耗意象", "深紫與酒紅"],
    },
  },
  {
    slug: "sloth",
    index: 5,
    titleZh: "怠惰",
    titleEn: "SLOTH",
    introduction:
      "「真正的停滯不一定來自無能，而可能是明知可以前進，卻選擇永遠停留。」",
    supportingEn: "THE STILLNESS THAT STAYS.",
    phrases: [
      { zh: "躊躇不前", en: "Hesitating in place" },
      { zh: "沉睡於夢", en: "Sleeping in dreams" },
      { zh: "逃避現實", en: "Escaping reality" },
      { zh: "荒廢時光", en: "Time left to waste" },
    ],
    palette: { primary: "#9ED8F2", secondary: "#A9B0B8", glow: "#7CC4E8" },
    character: {
      look: "情感疏離、彷彿懸浮的人形",
      particleBehavior: "極緩慢，輪廓逐漸淡化、消散",
      motifs: ["夢境般的懸浮感", "冰藍與銀灰"],
    },
  },
  {
    slug: "wrath",
    index: 6,
    titleZh: "暴怒",
    titleEn: "WRATH",
    introduction:
      "「當憤怒奪走理智，原本想要摧毀他人的力量，最終也可能吞噬自己。」",
    supportingEn: "THE FIRE THAT TURNS INWARD.",
    phrases: [
      { zh: "怒火焚心", en: "Fire burning the heart" },
      { zh: "理智崩解", en: "Reason breaking apart" },
      { zh: "仇恨滋長", en: "Hatred taking root" },
      { zh: "毀於一瞬", en: "Ruin in an instant" },
    ],
    palette: { primary: "#E5322A", secondary: "#E0741F", glow: "#FF4A2E" },
    character: {
      look: "具攻擊性與壓迫感的人形",
      particleBehavior: "輪廓破碎、爆發式移動、強烈扭曲",
      motifs: ["迸裂的粒子", "血紅與焦橙"],
    },
  },
  {
    slug: "envy",
    index: 7,
    titleZh: "嫉妒",
    titleEn: "ENVY",
    introduction:
      "「當目光始終停留在別人的擁有，自身的價值便逐漸被比較所吞噬。」",
    supportingEn: "THE GAZE THAT COMPARES.",
    phrases: [
      { zh: "視他人所有", en: "Eyes on what others own" },
      { zh: "恨己之不足", en: "Hating one's own lack" },
      { zh: "渴望取代", en: "Longing to replace" },
      { zh: "困於比較", en: "Caught in comparison" },
    ],
    palette: { primary: "#8BE04E", secondary: "#0E5A55", glow: "#6BD13A" },
    character: {
      look: "神秘而令人不安的人形",
      particleBehavior: "重影、錯位的粒子結構",
      motifs: ["重複的臉部輪廓", "倒影與影子", "毒綠與暗青"],
    },
  },
] as const;

export const SIN_COUNT = SINS.length;

export function getSinBySlug(slug: string): Sin | undefined {
  return SINS.find((s) => s.slug === slug);
}

export function getAdjacentSins(slug: SinSlug): { prev: Sin; next: Sin } {
  const i = SINS.findIndex((s) => s.slug === slug);
  return {
    prev: SINS[(i - 1 + SINS.length) % SINS.length],
    next: SINS[(i + 1) % SINS.length],
  };
}

export const SITE = {
  name: "SEVEN DEADLY SINS",
  tagline: "SEVEN FACES. SEVEN DESIRES. ONE HUMAN NATURE.",
  meta: "DIGITAL ARCHIVE / HUMAN NATURE / 07 SUBJECTS",
  closing: "SEVEN SINS. SEVEN FACES. ONE HUMAN SOUL.",
} as const;