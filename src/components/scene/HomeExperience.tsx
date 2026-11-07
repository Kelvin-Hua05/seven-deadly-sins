"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { SINS } from "@/data/sins";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isWebGLAvailable } from "@/lib/webgl";
import { SceneOverlay } from "@/components/layout/SceneOverlay";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

const MainScene = dynamic(() => import("./MainScene"), {
  ssr: false,
  loading: () => <LoadingIndicator />,
});

const noopSubscribe = () => () => {};

export function HomeExperience() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const cap = useDeviceCapability();
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => true);

  const onEnter = useCallback(
    (slug: string) => router.push(`/sins/${slug}`),
    [router]
  );

  return (
    <div className="relative h-full w-full">
      {webgl ? (
        <MainScene cap={cap} reducedMotion={reduced} onEnter={onEnter} />
      ) : (
        <WebGLFallback />
      )}

      {/* 暗角 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(8,7,8,0.85) 100%)",
        }}
      />

      <SceneOverlay />
    </div>
  );
}

function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-ink-2">
        WEBGL IS NOT AVAILABLE ON THIS DEVICE
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {SINS.map((s) => (
          <Link
            key={s.slug}
            href={`/sins/${s.slug}`}
            aria-label={`Subject ${s.index}`}
            className="border border-ink-2/40 px-4 py-2 font-mono text-xs tracking-widest text-ink-2 transition hover:border-ink hover:text-ink"
          >
            {String(s.index).padStart(2, "0")}
          </Link>
        ))}
      </div>
    </div>
  );
}