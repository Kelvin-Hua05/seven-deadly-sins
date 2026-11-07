# SEVEN DEADLY SINS

SEVEN FACES. SEVEN DESIRES. ONE HUMAN NATURE.

互動式數位藝術網站：七顆粒子人頭、hover 色彩揭示、點擊後重建為完整人形，並展開編輯式的罪名介紹。

## Tech Stack
Next.js (App Router) · TypeScript · Tailwind CSS · Three.js · React Three Fiber · Drei · GSAP · Lucide

## Development
```cmd
npm install
npm run dev
```

## Checks
```cmd
npm run lint
npm run build
```

## Routes
`/` · `/sins/lust` · `/sins/pride` · `/sins/greed` · `/sins/gluttony` · `/sins/sloth` · `/sins/wrath` · `/sins/envy`

## Content
所有角色文案與配色集中在 `src/data/sins.ts`。

## Deployment
推送至 GitHub，於 Vercel 匯入此 repo，框架自動偵測為 Next.js，無需額外設定。

## Docs
見 `docs/` 資料夾。

## Roadmap
見 `docs/DEVELOPMENT_ROADMAP.md`。