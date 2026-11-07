import Link from "next/link";
import { SINS, SITE } from "@/data/sins";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-6 font-mono text-[10px] tracking-[0.35em] text-ink-2">
        {SITE.meta}
      </p>
      <h1 className="font-display text-5xl font-light tracking-[0.2em] sm:text-7xl">
        {SITE.name}
      </h1>
      <p className="mt-6 font-mono text-xs tracking-[0.3em] text-ink-2">
        {SITE.tagline}
      </p>

      {/* 開發用暫時導覽：只顯示編號，不顯示罪名。Phase 2 會被 7 顆粒子頭取代 */}
      <nav
        aria-label="Development navigation"
        className="mt-16 flex flex-wrap justify-center gap-4"
      >
        {SINS.map((s) => (
          <Link
            key={s.slug}
            href={`/sins/${s.slug}`}
            className="border border-ink-2/40 px-4 py-2 font-mono text-xs tracking-widest text-ink-2 transition hover:border-ink hover:text-ink"
          >
            {String(s.index).padStart(2, "0")}
          </Link>
        ))}
      </nav>
    </main>
  );
}