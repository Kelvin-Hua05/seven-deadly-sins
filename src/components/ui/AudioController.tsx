"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudioEnabled } from "@/hooks/useAudioEnabled";
import { audio } from "@/lib/audio/audioEngine";

export function AudioController({ className = "" }: { className?: string }) {
  const on = useAudioEnabled();

  return (
    <button
      type="button"
      onClick={() => (on ? audio.disable() : audio.enable())}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      className={`flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-ink-2 transition hover:text-ink ${className}`}
    >
      {on ? (
        <Volume2 size={14} aria-hidden />
      ) : (
        <VolumeX size={14} aria-hidden />
      )}
      <span className="hidden sm:inline">{on ? "SOUND ON" : "SOUND OFF"}</span>
    </button>
  );
}