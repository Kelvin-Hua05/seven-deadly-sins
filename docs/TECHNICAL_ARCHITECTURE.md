# Technical Architecture

- 內容與渲染分離：`src/data/sins.ts` + `src/types/sin.ts`
- 路由：`/` 與 `/sins/[slug]`（靜態生成，`dynamicParams = false`）
- 3D 元件放 `src/components/scene/`，以 dynamic import 載入（Phase 2）
- 動畫邏輯放 `src/lib/animation/`，不寫在 UI 元件內
- 粒子系統：BufferGeometry + 自訂 ShaderMaterial（Phase 2）
- 降級：prefers-reduced-motion、WebGL 不可用的 fallback
- 資源釋放：unmount 時 dispose geometry / material / texture

## Particle character strategy
程序化粒子頭 → 以相容的座標映射插值為全身粒子雲（Hybrid）。
素材替換流程將於 Phase 2/3 補充。