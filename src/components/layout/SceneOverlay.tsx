"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SINS, SITE } from "@/data/sins";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useSceneSignal } from "@/hooks/useSceneSignal";
import { isWebGLAvailable } from "@/lib/webgl";
import { AudioController } from "@/components/ui/AudioController";

const noopSubscribe = () => () => {};

export function SceneOverlay() {
  const cap = useDeviceCapability();
  const { leavingHome, failed } = useSceneSignal();
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => true);
  const no3d = !webgl || failed;
  const interactive = leavingHome ? "pointer-events-none" : "pointer-events-auto";

  return (
    <div
      className={`fade-in pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 transition-opacity duration-700 sm:p-10 ${
        leavingHome ? "opacity-0" : "opacity-100"
      }`}
    >
      <p className="sr-only">
        Seven particle portraits float in a dark space. Move the cursor close to
        a face to reveal its color, then click to enter. The numbered links open
        each subject directly.
      </p>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-6">
        <p className="font-mono text-[10px] tracking-[0.3em] text-ink-2">
          {SITE.meta}
        </p>

        <nav
          aria-label="Subjects"
          className={`flex gap-3 font-mono tracking-[0.2em] text-ink-2/80 ${interactive} ${
            no3d ? "text-sm" : "text-[10px]"
          }`}
        >
          {SINS.map((s) => (
            <Link
              key={s.slug}
              href={`/sins/${s.slug}`}
              aria-label={`Subject ${s.index}`}
              className="transition hover:text-ink focus-visible:text-ink"
            >
              {String(s.index).padStart(2, "0")}
            </Link>
          ))}
        </nav>
      </div>

      {no3d && (
        <p className="self-center text-center font-mono text-xs tracking-[0.3em] text-ink-2">
          3D VIEW UNAVAILABLE. USE THE NUMBERED LINKS ABOVE.
        </p>
      )}

      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-light tracking-[0.2em] sm:text-4xl">
            {SITE.name}
          </h1>
          <p className="mt-3 max-w-[14rem] font-mono text-[10px] leading-relaxed tracking-[0.25em] text-ink-2 sm:max-w-[22rem]">
            {SITE.tagline}
          </p>
          {cap.isTouch && !no3d && (
            <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-ink-2/80 sm:hidden">
              TAP A FACE. TAP AGAIN TO ENTER.
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-4">
          <p className="hidden font-mono text-[10px] tracking-[0.3em] text-ink-2/70 sm:block">
            {cap.isTouch ? "TAP A FACE" : "MOVE CLOSER"}
          </p>
          <AudioController className={interactive} />
        </div>
      </div>
    </div>
  );
}