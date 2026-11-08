# SEVEN DEADLY SINS

SEVEN FACES. SEVEN DESIRES. ONE HUMAN NATURE.

互動式數位藝術網站：七顆粒子人頭懸浮於暗色空間，靠近時揭示專屬色彩，
點擊後頭部右移、重建為完整人形，並展開編輯式的罪名介紹。

## Tech Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Three.js ·
React Three Fiber · Drei · GSAP · Lucide · Web Audio API

## Requirements
- Node.js 20.9 或以上
- 支援 WebGL 的瀏覽器（不支援時會降級為文字導覽）

## Development
```cmd
npm install
npm run dev
```

## Checks
```cmd
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

## Routes
`/` · `/sins/lust` · `/sins/pride` · `/sins/greed` · `/sins/gluttony` · `/sins/sloth` · `/sins/wrath` · `/sins/envy`

## Content
所有角色文案、配色與英文翻譯集中在 `src/data/sins.ts`。
角色造型參數在 `src/data/sinVisuals.ts`，首頁頭部位置在 `src/data/headLayout.ts`。

## Audio
音效預設關閉，需使用者點擊 Sound 按鈕。預設為程式即時合成。
替換為真實音檔的方式見 `docs/AUDIO.md`。

## Deployment (Vercel)
1. 將專案推送到 GitHub
2. 登入 vercel.com → Add New → Project → 匯入此 repo
3. Framework 自動偵測為 Next.js，其餘設定不需更動，按 Deploy
4. 之後每次 `git push` 到 `main` 會自動重新部署，其他分支會產生預覽網址

## Known limitations
- 角色為程序化生成的風格化粒子人形，不是真實人臉重建
- 七個角色目前共用同一套西裝身體造型，僅顏色、胸針、符號與粒子行為各自不同
  （各自造型見 `docs/DEVELOPMENT_ROADMAP.md` 的 Phase 4）

## Docs
`docs/` 資料夾：專案概述、設計系統、技術架構、動畫規格、音效、開發路線。