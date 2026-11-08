"use client";

import { useSyncExternalStore } from "react";
import { audio } from "@/lib/audio/audioEngine";

export function useAudioEnabled(): boolean {
  return useSyncExternalStore(
    audio.subscribe,
    audio.getSnapshot,
    audio.getServerSnapshot
  );
}