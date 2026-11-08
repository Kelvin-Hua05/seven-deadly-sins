import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-[10px] tracking-[0.4em] text-ink-2">
        ERROR 404 / SUBJECT NOT FOUND
      </p>
      <h1 className="font-display text-4xl font-light tracking-[0.2em] sm:text-6xl">
        NO SUCH FACE
      </h1>
      <p className="font-zh text-sm text-ink-2">找不到這個頁面</p>
      <Link
        href="/"
        className="pointer-events-auto mt-4 border border-ink-2/40 px-5 py-2 font-mono text-xs tracking-[0.3em] text-ink-2 transition hover:border-ink hover:text-ink"
      >
        RETURN HOME
      </Link>
    </main>
  );
}