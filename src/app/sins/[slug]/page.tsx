import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SINS, SIN_COUNT, getAdjacentSins, getSinBySlug } from "@/data/sins";

type Props = { params: Promise<{ slug: string }> };

export const instant = false;

export function generateStaticParams() {
  return SINS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sin = getSinBySlug(slug);
  if (!sin) return {};
  return {
    title: `${sin.titleEn} ${sin.titleZh} — SEVEN DEADLY SINS`,
    description: sin.supportingEn,
  };
}

export default async function SinPage({ params }: Props) {
  const { slug } = await params;
  const sin = getSinBySlug(slug);
  if (!sin) notFound();

  const { prev, next } = getAdjacentSins(sin.slug);
  const counter = `${String(sin.index).padStart(2, "0")} / ${String(SIN_COUNT).padStart(2, "0")}`;

  const themeVars = {
    "--accent": sin.palette.primary,
    "--accent-2": sin.palette.secondary,
    "--accent-glow": sin.palette.glow,
  } as React.CSSProperties;

  return (
    <main
      style={themeVars}
      className="relative min-h-screen overflow-hidden"
    >
      {/* 暫時的環境光，Phase 3 由 3D 場景取代 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 h-[60vmin] w-[60vmin] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--accent-glow)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs tracking-[0.25em] text-ink-2 transition hover:text-ink"
        >
          <ArrowLeft size={14} aria-hidden /> HOME
        </Link>
        <span className="font-mono text-xs tracking-[0.25em] text-ink-2">
          {counter}
        </span>
      </header>

      <section className="relative z-10 grid gap-12 px-6 pb-24 pt-10 sm:px-12 lg:grid-cols-2 lg:pt-24">
        <div>
          <h1 className="font-zh text-7xl font-light text-accent sm:text-8xl">
            {sin.titleZh}
          </h1>
          <p className="mt-4 font-display text-3xl tracking-[0.35em] sm:text-4xl">
            {sin.titleEn}
          </p>
          <p className="mt-10 max-w-md font-zh text-lg leading-loose text-ink">
            {sin.introduction}
          </p>
          <p className="mt-8 font-mono text-xs tracking-[0.3em] text-ink-2">
            {sin.supportingEn}
          </p>
        </div>

        {/* 暫時：四句象徵語。Phase 3 會改為環繞角色排列 */}
        <ul className="grid grid-cols-2 content-center gap-8">
          {sin.phrases.map((p) => (
            <li key={p.zh}>
              <p className="font-zh text-2xl text-accent">{p.zh}</p>
              <p className="mt-1 font-mono text-[10px] tracking-widest text-ink-2">
                {p.en}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <nav
        aria-label="Sin navigation"
        className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-6 py-6 sm:px-12"
      >
        <Link
          href={`/sins/${prev.slug}`}
          className="flex items-center gap-2 font-mono text-xs tracking-[0.25em] text-ink-2 transition hover:text-ink"
        >
          <ArrowLeft size={14} aria-hidden /> PREV
        </Link>
        <Link
          href={`/sins/${next.slug}`}
          className="flex items-center gap-2 font-mono text-xs tracking-[0.25em] text-ink-2 transition hover:text-ink"
        >
          NEXT <ArrowRight size={14} aria-hidden />
        </Link>
      </nav>
    </main>
  );
}