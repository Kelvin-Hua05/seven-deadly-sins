"use client";

import { useSyncExternalStore } from "react";
import { sceneSignal } from "@/lib/animation/sceneSignal";

export function useSceneSignal() {
  return useSyncExternalStore(
    sceneSignal.subscribe,
    sceneSignal.getSnapshot,
    sceneSignal.getServerSnapshot
  );
}