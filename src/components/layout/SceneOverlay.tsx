"use client";

import Link from "next/link";
import { SINS, SITE } from "@/data/sins";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";

export function SceneOverlay() {
  const cap = useDeviceCapability();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <p className="font-mono text-[10px] tracking-[0.3em] text-ink-2">
          {SITE.meta}
        </p>

        {/* 數字導覽：不顯示罪名；同時提供鍵盤操作 */}
        <nav
          aria-label="Subjects"
          className="pointer-events-auto flex gap-3 font-mono text-[10px] tracking-[0.2em] text-ink-2/60"
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

      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-light tracking-[0.2em] sm:text-4xl">
            {SITE.name}
          </h1>
          <p className="mt-3 max-w-[22rem] font-mono text-[10px] leading-relaxed tracking-[0.25em] text-ink-2">
            {SITE.tagline}
          </p>
        </div>
        <p className="hidden font-mono text-[10px] tracking-[0.3em] text-ink-2/70 sm:block">
          {cap.isTouch ? "TAP A FACE" : "MOVE CLOSER"}
        </p>
      </div>
    </div>
  );
}