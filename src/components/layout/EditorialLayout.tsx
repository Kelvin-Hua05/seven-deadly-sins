"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Sin } from "@/types/sin";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSceneSignal } from "@/hooks/useSceneSignal";
import { isWebGLAvailable } from "@/lib/webgl";

interface NavSin {
  slug: string;
  titleZh: string;
}

interface Props {
  sin: Sin;
  prev: NavSin;
  next: NavSin;
  total: number;
}

const noopSubscribe = () => () => {};

/** 四句象徵語環繞光圈：landscape 用 (px,py)，portrait 用 (pxp,pyp) */
const PHRASES = [
  { px: "calc(var(--fx) - var(--fr) * 0.92)", py: "calc(var(--fy) - var(--fr) * 0.72)", pxp: "1.5rem", pyp: "calc(var(--fy) - var(--fr) * 1.05)", side: "right", dur: "7s", delay: "0s" },
  { px: "calc(var(--fx) + var(--fr) * 0.92)", py: "calc(var(--fy) - var(--fr) * 0.78)", pxp: "58%", pyp: "calc(var(--fy) - var(--fr) * 1.05)", side: "left", dur: "8.5s", delay: "-2s" },
  { px: "calc(var(--fx) - var(--fr) * 1.0)", py: "calc(var(--fy) + var(--fr) * 0.45)", pxp: "1.5rem", pyp: "calc(var(--fy) + var(--fr) * 0.3)", side: "right", dur: "9s", delay: "-4s" },
  { px: "calc(var(--fx) + var(--fr) * 1.0)", py: "calc(var(--fy) + var(--fr) * 0.5)", pxp: "58%", pyp: "calc(var(--fy) + var(--fr) * 0.4)", side: "left", dur: "7.5s", delay: "-1s" },
] as const;

/** 四句依序、各自獨立進場 */
const PHRASE_DELAYS = [1.1, 0.9, 1.75, 1.45];

export function EditorialLayout({ sin, prev, next, total }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const signal = useSceneSignal();
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => true);
  const rootRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [live, setLive] = useState(false);

  // 沒有 WebGL 時不等場景，直接揭示
  const ready = !webgl || signal.readySlug === sin.slug;

  const counter = `${String(sin.index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const themeVars = {
    "--accent": sin.palette.primary,
    "--accent-2": sin.palette.secondary,
    "--accent-glow": sin.palette.glow,
  } as React.CSSProperties;

  // Phase D：編輯式揭示（各元素獨立時間）
  useEffect(() => {
    if (!ready || !rootRef.current) return;
    const k = reduced ? 0.01 : 1;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo("[data-zh]", { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6 * k }, 0);
      tl.fromTo("[data-en]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2 * k }, 0.35 * k);
      tl.fromTo("[data-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.0 * k, ease: "power2.inOut" }, 0.6 * k);
      tl.fromTo("[data-intro]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.4 * k }, 0.85 * k);
      tl.fromTo("[data-sub]", { opacity: 0 }, { opacity: 1, duration: 1.2 * k }, 1.25 * k);
      PHRASE_DELAYS.forEach((delay, i) => {
        tl.fromTo(`[data-phrase="${i}"]`, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.5 * k }, delay * k);
      });
      tl.fromTo("[data-fade]", { opacity: 0 }, { opacity: 1, duration: 1.2 * k }, 1.4 * k);
      tl.call(() => setLive(true), undefined, 1.7 * k);
    }, rootRef);
    return () => ctx.revert();
  }, [ready, reduced]);

  // 離場：文字先淡出，再換網址（同時避免連點）
  const go = useCallback(
    (href: string) => {
      if (leaving.current) return;
      leaving.current = true;
      const nodes = rootRef.current?.querySelectorAll(
        "[data-zh],[data-en],[data-line],[data-intro],[data-sub],[data-phrase],[data-fade]"
      );
      gsap.to(nodes ?? [], {
        opacity: 0,
        duration: reduced ? 0.01 : 0.5,
        ease: "power2.in",
        onComplete: () => router.push(href),
      });
    },
    [router, reduced]
  );

  // 鍵盤：← → 切換、Esc 回首頁
  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(`/sins/${prev.slug}`);
      else if (e.key === "ArrowRight") go(`/sins/${next.slug}`);
      else if (e.key === "Escape") go("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, go, prev.slug, next.slug]);

  const linkClass =
    "flex items-center gap-2 font-mono text-xs tracking-[0.25em] text-ink-2 transition hover:text-ink";
  const interactive = live ? "pointer-events-auto" : "pointer-events-none";

  const navLink = (href: string, children: React.ReactNode, label: string) => (
    <Link
      href={href}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        go(href);
      }}
      className={`${linkClass} ${interactive}`}
    >
      {children}
    </Link>
  );

  return (
    <div
      ref={rootRef}
      style={themeVars}
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      <header
        data-fade
        className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6 opacity-0 sm:px-12"
      >
        {navLink("/", <><ArrowLeft size={14} aria-hidden /> HOME</>, "Return to home")}
        <span className="font-mono text-xs tracking-[0.25em] text-ink-2">{counter}</span>
      </header>

      {/* 左側：標題與簡介 */}
      <section className="edit-left absolute">
        <h1
          data-zh
          className="font-zh text-[clamp(4.5rem,11vw,10rem)] font-light leading-none text-accent opacity-0"
          style={{ textShadow: "0 0 60px color-mix(in srgb, var(--accent-glow) 55%, transparent)" }}
        >
          {sin.titleZh}
        </h1>
        <p
          data-en
          className="mt-5 font-display text-2xl tracking-[0.45em] opacity-0 sm:text-4xl"
        >
          {sin.titleEn}
        </p>
        <div data-line className="mt-8 h-px w-24 origin-left bg-accent opacity-80" style={{ transform: "scaleX(0)" }} />
        <p
          data-intro
          className="mt-8 max-w-[26rem] font-zh text-base leading-loose text-ink opacity-0 sm:text-lg"
        >
          {sin.introduction}
        </p>
        <p data-sub className="mt-8 font-mono text-[11px] tracking-[0.3em] text-ink-2 opacity-0">
          {sin.supportingEn}
        </p>
      </section>

      {/* 環繞角色的四句象徵語 */}
      {sin.phrases.map((p, i) => {
        const c = PHRASES[i];
        return (
          <div
            key={p.zh}
            className="phrase-anchor absolute"
            style={
              { "--px": c.px, "--py": c.py, "--pxp": c.pxp, "--pyp": c.pyp } as React.CSSProperties
            }
          >
            <div className={c.side === "right" ? "phrase-right" : ""}>
              <div data-phrase={i} className="opacity-0">
                <div
                  className="phrase-drift"
                  style={{ "--dur": c.dur, "--delay": c.delay } as React.CSSProperties}
                >
                  <p className="mb-1 font-mono text-[9px] tracking-[0.3em] text-accent/70">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p
                    className="whitespace-nowrap font-zh text-xl text-ink sm:text-[1.7rem]"
                    style={{ textShadow: "0 0 24px color-mix(in srgb, var(--accent-glow) 45%, transparent)" }}
                  >
                    {p.zh}
                  </p>
                  <p className="mt-1 whitespace-nowrap font-mono text-[9px] tracking-[0.2em] text-ink-2">
                    {p.en.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <nav
        data-fade
        aria-label="Sin navigation"
        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-6 opacity-0 sm:px-12"
      >
        {navLink(`/sins/${prev.slug}`, <><ArrowLeft size={14} aria-hidden /> PREV</>, "Previous sin")}
        {navLink(`/sins/${next.slug}`, <>NEXT <ArrowRight size={14} aria-hidden /></>, "Next sin")}
      </nav>
    </div>
  );
}