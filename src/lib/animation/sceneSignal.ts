/**
 * 3D 場景與 DOM 之間的小型外部 store。
 * readySlug：場景已重建到足以揭示文字的角色
 * leavingHome：首頁文字是否該淡出
 * failed：3D 場景無法使用（出錯），文字層應直接揭示
 */
export interface SceneSignalSnapshot {
  readySlug: string | null;
  leavingHome: boolean;
  failed: boolean;
}

let snap: SceneSignalSnapshot = {
  readySlug: null,
  leavingHome: false,
  failed: false,
};
const SERVER: SceneSignalSnapshot = {
  readySlug: null,
  leavingHome: false,
  failed: false,
};
const listeners = new Set<() => void>();

export const sceneSignal = {
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  getSnapshot: () => snap,
  getServerSnapshot: () => SERVER,
  set: (patch: Partial<SceneSignalSnapshot>) => {
    const next = { ...snap, ...patch };
    if (
      next.readySlug === snap.readySlug &&
      next.leavingHome === snap.leavingHome &&
      next.failed === snap.failed
    ) {
      return;
    }
    snap = next;
    listeners.forEach((l) => l());
  },
};