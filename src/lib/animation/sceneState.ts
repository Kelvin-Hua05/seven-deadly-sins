import * as THREE from "three";

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** 單顆頭的動畫狀態。每幀由 FloatingHeads 更新、ParticleHead 讀取，不經過 React state。 */
export class HeadState {
  reveal = 0;
  dissolve = 0;
  opacity = 1;
  intro = 0;
  move = 0;
  lookX = 0;
  lookY = 0;
  readonly target = new THREE.Vector3();

  follow(targetReveal: number, dt: number) {
    const lambda = targetReveal > this.reveal ? 2.6 : 3.2;
    this.reveal = THREE.MathUtils.damp(this.reveal, targetReveal, lambda, dt);
  }

  look(x: number, y: number, dt: number) {
    this.lookX = THREE.MathUtils.damp(this.lookX, x, 2.5, dt);
    this.lookY = THREE.MathUtils.damp(this.lookY, y, 2.5, dt);
  }

  applyTransition(isSelected: boolean, p: number, dt: number) {
    if (isSelected) {
      this.move = ease(p);
      this.reveal = THREE.MathUtils.damp(this.reveal, 1, 4, dt);
      this.dissolve = 0;
      this.opacity = 1;
    } else {
      this.dissolve = ease(p);
      this.opacity = 1 - Math.min(1, p * 1.15);
      this.reveal = THREE.MathUtils.damp(this.reveal, 0, 6, dt);
    }
  }
}

/** 整個場景的互動流程狀態 */
export class SceneFlow {
  hasPointer = false;
  ndcX = 0;
  ndcY = 0;
  selected = -1;
  progress = 0;
  activeTouch = -1;
  locked = false;

  setPointer(x: number, y: number) {
    this.hasPointer = true;
    this.ndcX = x;
    this.ndcY = y;
  }
  clearPointer() {
    this.hasPointer = false;
  }
  setActiveTouch(i: number) {
    this.activeTouch = i;
  }
  lock(i: number) {
    this.locked = true;
    this.selected = i;
  }
}