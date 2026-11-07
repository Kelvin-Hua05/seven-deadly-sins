import gsap from "gsap";
import type { HeadState } from "./sceneState";

/** 七顆頭依序浮現 */
export function playIntro(states: HeadState[], reduced: boolean) {
  states.forEach((s, i) => {
    gsap.to(s, {
      intro: 1,
      duration: reduced ? 0.01 : 2.2,
      delay: reduced ? 0 : 0.15 + i * 0.16,
      ease: "power2.out",
    });
  });
  return () => {
    gsap.killTweensOf(states);
  };
}