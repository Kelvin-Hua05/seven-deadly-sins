import gsap from "gsap";
import type { SceneFlow } from "./sceneState";

/** 點擊後的過場：progress 0→1，實際緩動由 HeadState 處理 */
export function playSelectTransition(
  flow: SceneFlow,
  duration: number,
  onComplete: () => void
) {
  return gsap.to(flow, {
    progress: 1,
    duration,
    ease: "none",
    onComplete,
  });
}