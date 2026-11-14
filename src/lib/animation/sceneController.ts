import gsap from "gsap";
import { SINS } from "@/data/sins";
import { TRANSITIONS } from "@/data/sinVisuals";
import type { CueName } from "@/data/audio";
import { audio } from "@/lib/audio/audioEngine";
import { sceneSignal } from "./sceneSignal";
import type { HeadState, SceneFlow } from "./sceneState";

const UNSET = -2;

/**
 * 場景時間軸：依目前路由對應的角色索引（-1 = 首頁）切換狀態。
 * sync() 可重複呼叫（冪等），點擊與路由變更都會呼叫它。
 * 各角色的重建時長在 data/sinVisuals.ts 的 TRANSITIONS。
 */
export class SceneController {
  private states: HeadState[];
  private flow: SceneFlow;
  private current = UNSET;
  private tl: gsap.core.Timeline | null = null;
  private reduced = false;
  private onBodyIndex: (i: number) => void = () => {};

  constructor(states: HeadState[], flow: SceneFlow) {
    this.states = states;
    this.flow = flow;
  }

  bind(onBodyIndex: (i: number) => void, reduced: boolean) {
    this.onBodyIndex = onBodyIndex;
    this.reduced = reduced;
  }

  private d(s: number) {
    return this.reduced ? 0.01 : s;
  }

  private spec(i: number) {
    return TRANSITIONS[SINS[i].slug];
  }

  /** 提示音：減少動態模式下只保留 reveal，避免多個音疊在同一瞬間 */
  private cueAt(tl: gsap.core.Timeline, name: CueName, at: number) {
    if (this.reduced && name !== "reveal") return;
    tl.call(() => audio.cue(name), [], this.d(at));
  }

  private kill() {
    this.tl?.kill();
    this.tl = null;
    gsap.killTweensOf(this.states);
  }

  dispose() {
    this.kill();
    this.current = UNSET;
  }

  /** 首頁點擊：回傳是否真的開始進入（手機第一次點擊只顯色） */
  requestEnter(i: number, touch: boolean): boolean {
    if (this.flow.mode !== "home") return false;
    if (touch && this.flow.activeTouch !== i) {
      this.flow.activeTouch = i;
      return false;
    }
    sceneSignal.set({ leavingHome: true });
    this.sync(i);
    return true;
  }

  sync(target: number) {
    if (target === this.current) return;
    const from = this.current;
    this.current = target;
    this.kill();
    sceneSignal.set({ readySlug: null });

    if (from === UNSET) this.init(target);
    else if (from === -1) this.homeToSin(target);
    else if (target === -1) this.sinToHome(from);
    else this.sinToSin(from, target);
  }

  private ready(i: number) {
    sceneSignal.set({ readySlug: SINS[i].slug });
    audio.cue("reveal");
  }

  /** 第一次載入（可能直接開在 /sins/xxx） */
  private init(target: number) {
    const { states: s, flow: f } = this;
    s.forEach((st) => st.reset());
    f.activeTouch = -1;
    const tl = gsap.timeline();
    this.tl = tl;

    if (target === -1) {
      f.mode = "home";
      f.selected = -1;
      this.onBodyIndex(-1);
      sceneSignal.set({ leavingHome: false });
      s.forEach((st, i) => {
        tl.to(st, { intro: 1, duration: this.d(2.2), ease: "power2.out" }, this.d(0.15 + i * 0.16));
      });
      return;
    }

    f.mode = "busy";
    f.selected = target;
    s.forEach((st, i) => {
      st.intro = 1;
      if (i !== target) {
        st.dissolve = 1;
        st.opacity = 0;
      }
    });
    const sel = s[target];
    sel.intro = 0;
    sel.move = 1;
    sel.reveal = 1;
    this.onBodyIndex(target);

    const sp = this.spec(target);
    const t0 = 0.8;
    tl.to(sel, { intro: 1, duration: this.d(1.4), ease: "power2.out" }, 0);
    tl.to(sel, { build: 1, duration: this.d(sp.build), ease: "none" }, this.d(t0));
    this.cueAt(tl, "scan", t0);
    tl.call(() => this.ready(target), [], this.d(t0 + sp.ready));
    tl.call(() => { f.mode = "sin"; }, [], this.d(t0 + sp.build + 0.1));
  }

  /** A→B→C→D：點擊後右移、其餘溶解、重建身體、揭示文字 */
  private homeToSin(i: number) {
    const { states: s, flow: f } = this;
    f.mode = "busy";
    f.selected = i;
    f.activeTouch = -1;
    this.onBodyIndex(i);
    const sel = s[i];
    const tl = gsap.timeline();
    this.tl = tl;

    const sp = this.spec(i);
    const t0 = 1.1;
    this.cueAt(tl, "enter", 0);
    s.forEach((st, k) => {
      if (k === i) return;
      st.build = 0;
      tl.to(st, { dissolve: 1, duration: this.d(1.3), ease: "power2.in" }, 0);
      tl.to(st, { opacity: 0, duration: this.d(1.0), ease: "power1.in" }, 0);
    });
    tl.to(sel, { move: 1, reveal: 1, duration: this.d(1.8), ease: "power3.inOut" }, 0);
    tl.to(sel, { build: 1, duration: this.d(sp.build), ease: "none" }, this.d(t0));
    this.cueAt(tl, "scan", t0);
    tl.call(() => this.ready(i), [], this.d(t0 + sp.ready));
    tl.call(() => { f.mode = "sin"; }, [], this.d(t0 + sp.build + 0.1));
  }

  private sinToHome(from: number) {
    const { states: s, flow: f } = this;
    f.mode = "busy";
    f.selected = from;
    sceneSignal.set({ leavingHome: false });
    const sel = s[from];
    const tl = gsap.timeline();
    this.tl = tl;

    this.cueAt(tl, "leave", 0);
    s.forEach((st, k) => {
      if (k === from) return;
      st.move = 0;
      st.build = 0;
      tl.to(st, { dissolve: 0, duration: this.d(1.6), ease: "power2.out" }, this.d(1.0));
      tl.to(st, { opacity: 1, duration: this.d(1.4), ease: "power1.out" }, this.d(1.0));
    });
    tl.to(sel, { build: 0, duration: this.d(1.1), ease: "power2.in" }, 0);
    tl.to(sel, { move: 0, duration: this.d(1.7), ease: "power3.inOut" }, this.d(0.6));
    tl.to(sel, { reveal: 0, duration: this.d(1.4), ease: "power2.out" }, this.d(1.0));
    tl.call(() => {
      f.mode = "home";
      f.selected = -1;
      this.onBodyIndex(-1);
    }, [], this.d(2.8));
  }

  /** 上一個 / 下一個角色 */
  private sinToSin(a: number, b: number) {
    const { states: s, flow: f } = this;
    f.mode = "busy";
    f.selected = b;
    const A = s[a];
    const B = s[b];
    const tl = gsap.timeline();
    this.tl = tl;

    const sp = this.spec(b);
    const t0 = 2.1;
    this.cueAt(tl, "leave", 0);
    s.forEach((st, k) => {
      if (k !== a && k !== b) st.build = 0;
    });
    tl.to(A, { build: 0, duration: this.d(0.9), ease: "power2.in" }, 0);
    tl.to(A, { dissolve: 1, duration: this.d(1.0), ease: "power2.in" }, this.d(0.3));
    tl.to(A, { opacity: 0, duration: this.d(0.8), ease: "power1.in" }, this.d(0.4));
    tl.call(() => {
      A.move = 0;
      A.reveal = 0;
      A.build = 0;
      B.move = 1;
      B.reveal = 1;
      B.build = 0;
      B.intro = 1;
      B.dissolve = 1;
      B.opacity = 0;
      this.onBodyIndex(b);
    }, [], this.d(1.3));
    tl.to(B, { dissolve: 0, duration: this.d(1.2), ease: "power2.out" }, this.d(1.3));
    tl.to(B, { opacity: 1, duration: this.d(1.0), ease: "power1.out" }, this.d(1.3));
    tl.to(B, { build: 1, duration: this.d(sp.build), ease: "none" }, this.d(t0));
    this.cueAt(tl, "scan", t0);
    tl.call(() => this.ready(b), [], this.d(t0 + sp.ready));
    tl.call(() => { f.mode = "sin"; }, [], this.d(t0 + sp.build + 0.1));
  }
}