/**
 * Film grain. Inline data URI so it costs no network request and nothing
 * to block paint. `inset: -50%` oversizes it to 2x the viewport so no edge
 * can ever be revealed. Dropped entirely under `prefers-reduced-data`.
 */
export function Grain() {
  return <div aria-hidden="true" className="grain" />;
}
