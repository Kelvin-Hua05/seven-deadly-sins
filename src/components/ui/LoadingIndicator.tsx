export function LoadingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex items-center justify-center"
    >
      <span className="animate-pulse font-mono text-[10px] tracking-[0.4em] text-ink-2">
        INITIALIZING SCAN
      </span>
    </div>
  );
}