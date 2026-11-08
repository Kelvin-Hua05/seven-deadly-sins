"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { SINS } from "@/data/sins";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSceneSignal } from "@/hooks/useSceneSignal";
import { audio } from "@/lib/audio/audioEngine";
import { isWebGLAvailable } from "@/lib/webgl";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

const MainScene = dynamic(() => import("./MainScene"), {
  ssr: false,
  loading: () => <LoadingIndicator />,
});

const noopSubscribe = () => () => {};

/** 放在 layout：整站共用同一個 Canvas，頭才能在換頁時留在畫面上 */
export function PersistentScene() {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const cap = useDeviceCapability();
  const signal = useSceneSignal();
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => true);

  const slug = pathname.startsWith("/sins/") ? (pathname.split("/")[2] ?? "") : "";
  const slugIndex = SINS.findIndex((s) => s.slug === slug);
  const sin = slugIndex >= 0 ? SINS[slugIndex] : null;
  const sinSlug = sin?.slug ?? null;

  // 只有首頁與七個角色頁才顯示 3D 場景；其他網址（例如 404）不繪製
  const onKnownRoute = pathname === "/" || slugIndex >= 0;

  // 把目前角色的色彩寫入全站 CSS 變數
  useEffect(() => {
    if (!sin) return;
    const r = document.documentElement.style;
    r.setProperty("--accent", sin.palette.primary);
    r.setProperty("--accent-2", sin.palette.secondary);
    r.setProperty("--accent-glow", sin.palette.glow);
    return () => {
      r.removeProperty("--accent");
      r.removeProperty("--accent-2");
      r.removeProperty("--accent-glow");
    };
  }, [sin]);

  // 環境音跟著場景切換（音效未開啟時不會有任何動作）
  useEffect(() => {
    audio.setScene(sinSlug);
  }, [sinSlug]);

  // 點擊後稍等一下再換網址，讓頭先開始移動
  const onEnter = useCallback(
    (target: string) => {
      window.setTimeout(
        () => router.push(`/sins/${target}`),
        reduced ? 100 : 550
      );
    },
    [router, reduced]
  );

  if (!webgl || !onKnownRoute) return null;
  
  const ambientOn = sin !== null && signal.readySlug === sin.slug;

  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <SceneErrorBoundary>
        <MainScene
          slugIndex={slugIndex}
          cap={cap}
          reducedMotion={reduced}
          onEnter={onEnter}
        />
      </SceneErrorBoundary>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(8,7,8,0.85) 100%)",
        }}
      />
      <div
        className="ambient-glow pointer-events-none absolute inset-0"
        data-on={ambientOn ? "1" : "0"}
      />
    </div>
  );
}