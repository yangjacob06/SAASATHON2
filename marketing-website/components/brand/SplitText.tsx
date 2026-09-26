/**
 * Splits a line into per-character spans carrying an index, which the
 * `.char` rule in `globals.css` turns into a staggered rise.
 *
 * Server-rendered rather than split on the client: the characters are in
 * the HTML, so there is no flash of unstyled line and no layout shift, and
 * the whole thing costs no JavaScript. The full line is kept available to
 * assistive technology via `aria-label`, with the pieces hidden from it.
 */
export function SplitText({
  text,
  className = "",
  delay = 0,
  start = 0,
}: {
  text: string;
  className?: string;
  /** Milliseconds before the first character moves. */
  delay?: number;
  /** Character index to start counting from, to continue a stagger across lines. */
  start?: number;
}) {
  return (
    <span
      className={className}
      aria-label={text}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {Array.from(text).map((ch, i) =>
        ch === " " ? (
          <span key={i} className="char-space" aria-hidden="true" />
        ) : (
          <span
            key={i}
            className="char"
            aria-hidden="true"
            style={{ "--i": start + i } as React.CSSProperties}
          >
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
