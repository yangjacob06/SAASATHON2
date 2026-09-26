/**
 * The Mandate mark: a graphite monogram tile beside the wordmark.
 *
 * The tile is drawn rather than set in type so it keeps its exact optical
 * weight at every size, and the trailing dot gives the wordmark a terminal —
 * the small detail that stops a serif logotype reading as body copy.
 */
export function Logo({
  className = "",
  dark = false,
  size = "md",
}: {
  className?: string;
  dark?: boolean;
  size?: "sm" | "md";
}) {
  const tile = size === "sm" ? 26 : 32;
  const word = size === "sm" ? "text-[17px]" : "text-[20px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={tile}
        height={tile}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="9"
          fill={dark ? "var(--color-paper)" : "var(--color-graphite)"}
        />
        {/* Two arches: the "m", and a quiet nod to two lenders under one deal. */}
        <path
          d="M9 22.5V13.2c0-1.9 1.4-3.2 3.1-3.2 1.7 0 2.9 1.3 2.9 3.2v9.3M15 13.2c0-1.9 1.3-3.2 3-3.2s3 1.3 3 3.2v9.3"
          stroke={dark ? "var(--color-graphite)" : "var(--color-paper)"}
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-display ${word} leading-none tracking-[-0.02em] ${
          dark ? "text-paper" : "text-graphite"
        }`}
      >
        mandate
        <span className="text-signal">.</span>
      </span>
    </span>
  );
}
