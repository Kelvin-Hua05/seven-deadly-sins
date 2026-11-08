import * as THREE from "three";

/** 單顆頭的動畫狀態。每幀讀取，不經過 React state */
export class HeadState {
  intro = 0;
  reveal = 0;
  /** 0=在首頁位置，1=在角色頁位置 */
  move = 0;
  dissolve = 0;
  opacity = 1;
  /** 身體重建 / 掃描進度 */
  build = 0;
  lookX = 0;
  lookY = 0;
  targetScale = 1;
  readonly target = new THREE.Vector3();

  reset() {
    this.intro = 0;
    this.reveal = 0;
    this.move = 0;
    this.dissolve = 0;
    this.opacity = 1;
    this.build = 0;
  }

  follow(targetReveal: number, dt: number) {
    const lambda = targetReveal > this.reveal ? 2.6 : 3.2;
    this.reveal = THREE.MathUtils.damp(this.reveal, targetReveal, lambda, dt);
  }

  look(x: number, y: number, dt: number) {
    this.lookX = THREE.MathUtils.damp(this.lookX, x, 2.5, dt);
    this.lookY = THREE.MathUtils.damp(this.lookY, y, 2.5, dt);
  }
}

export type FlowMode = "home" | "busy" | "sin";

export class SceneFlow {
  mode: FlowMode = "home";
  selected = -1;
  hasPointer = false;
  ndcX = 0;
  ndcY = 0;
  activeTouch = -1;

  setPointer(x: number, y: number) {
    this.hasPointer = true;
    this.ndcX = x;
    this.ndcY = y;
  }
  clearPointer() {
    this.hasPointer = false;
  }
}