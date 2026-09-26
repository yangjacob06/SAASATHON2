/**
 * The Mandate mark: a linked-deal symbol beside the wordmark.
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
        {/* The linked path represents a deal connecting advisers and lenders. */}
        <path
          d="M9 10h6a5 5 0 0 1 0 10h-1m9 2h-6a5 5 0 0 1 0-10h1"
          stroke={dark ? "var(--color-graphite)" : "var(--color-paper)"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8.7" cy="10.7" r="2" fill="var(--color-signal)" />
        <circle cx="23.3" cy="21.3" r="2" fill="var(--color-signal)" />
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
