"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The opening.
 *
 * One word, held on an empty page, then handed to the site. The sequence is
 * a signal, the word resolving out of nothing, the period landing a beat
 * late, a hold, and a release — about 2.4 seconds end to end.
 *
 * Three things keep it from being a splash screen:
 *
 *   · it runs once per browsing session (`sessionStorage`), so the second
 *     page view is instant and nobody is made to watch it twice
 *   · it never blocks the site. The page renders underneath from the first
 *     frame; this is a cover that lifts, not a gate that opens
 *   · it removes itself from the accessibility tree entirely, and under
 *     reduced motion it does not mount at all
 *
 * The word does not fade out. It scales down and rises toward the header as
 * the cover lifts, so the brand appears to become the navigation — the
 * intro reads as the site's first frame rather than as a thing in front
 * of it.
 */

const SESSION_KEY = "mandate:intro-played";

/**
 * The decision, taken once per module load rather than once per effect run.
 *
 * Reading and writing the session flag inside the effect looks right and is
 * wrong: React re-runs effects on mount in development (and may remount a
 * component at any time), so the first pass writes the flag and the second
 * pass reads it back and concludes the intro has already played. The guard
 * eats itself and the sequence never runs. Holding the verdict in module
 * scope makes the second pass agree with the first.
 */
type Verdict = "play" | "skip";
let verdict: Verdict | null = null;

function decide(): Verdict {
  if (verdict) return verdict;
  let played = false;
  try {
    played = sessionStorage.getItem(SESSION_KEY) === "1";
    if (!played) sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Private browsing can throw on access. Play it, and play it again
    // next time — an intro shown twice beats one that never shows.
  }
  verdict = played ? "skip" : "play";
  return verdict;
}

export function Intro() {
  // Start hidden. The effect decides whether this session gets the sequence,
  // which keeps the server render and the first client render identical.
  const [phase, setPhase] = useState<"idle" | "playing" | "lifting" | "done">("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || decide() === "skip") {
      setPhase("done");
      return;
    }

    // The page must not scroll under the cover while it is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setPhase("playing");
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(1850, () => setPhase("lifting"));
    at(2600, () => {
      setPhase("done");
      document.body.style.overflow = previous;
    });

    return () => {
      timers.current.forEach(window.clearTimeout);
      document.body.style.overflow = previous;
    };
  }, []);

  if (phase === "done") return null;

  const started = phase === "playing" || phase === "lifting";
  const lifting = phase === "lifting";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[70] grid place-items-center bg-paper transition-opacity duration-[700ms] ease-[var(--ease-out-expo)] ${
        lifting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* The signal: one point, arriving before the word does. */}
      <span
        className={`absolute h-1 w-1 rounded-full bg-signal transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] ${
          started ? "scale-100 opacity-0" : "scale-50 opacity-100"
        }`}
        style={{ transitionDelay: started ? "260ms" : "0ms" }}
      />

      <span
        className={`flex items-baseline font-display text-graphite transition-[transform,opacity] ease-[var(--ease-out-expo)] ${
          lifting ? "duration-[900ms]" : "duration-[1200ms]"
        }`}
        style={{
          // Large, but composed: it holds the centre without touching the
          // edges at any width.
          fontSize: "clamp(3.25rem, 12vw, 11rem)",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          // Scales down and rises toward where the header sits, so the
          // wordmark appears to become the navigation.
          transform: lifting
            ? "translate3d(0, -38vh, 0) scale(0.14)"
            : started
              ? "none"
              : "scale(1.06)",
          opacity: started ? 1 : 0,
          transitionDelay: started && !lifting ? "220ms" : "0ms",
        }}
      >
        <span
          className="transition-[filter] duration-[1100ms] ease-[var(--ease-out-expo)]"
          style={{
            // Sharpening into focus rather than fading in.
            filter: started ? "blur(0px)" : "blur(14px)",
            transitionDelay: started ? "220ms" : "0ms",
          }}
        >
          mandate
        </span>
        {/* The period lands a beat after the word, and in the accent. */}
        <span
          className="text-signal transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)]"
          style={{
            opacity: started ? 1 : 0,
            transform: started ? "none" : "translate3d(-0.12em, 0, 0)",
            transitionDelay: started ? "980ms" : "0ms",
          }}
        >
          .
        </span>
      </span>
    </div>
  );
}
