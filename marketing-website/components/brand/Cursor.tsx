"use client";

import { useEffect, useRef } from "react";

/**
 * The opening's cursor.
 *
 * A ring that follows with a little lag and changes state from whatever is
 * under it: `data-cursor="link"` contracts it to a point, `data-cursor="enter"`
 * expands it into a labelled disc. The native cursor is hidden only once
 * this has actually mounted and taken a position — the `data-cursor-ready`
 * flag in `globals.css` — so a failure here can never leave a visitor with
 * no cursor at all.
 *
 * Skipped entirely on coarse pointers and under reduced motion.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    let ready = false;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      // Fixed lerp: enough lag to feel like a physical object, not enough
      // to feel disconnected from the hand.
      rx += (x - rx) * 0.22;
      ry += (y - ry) * 0.22;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!ready) {
        ready = true;
        rx = x;
        ry = y;
        root.setAttribute("data-cursor-ready", "");
        ring.setAttribute("data-state", "default");
      }
      const target = (e.target as Element | null)?.closest?.("[data-cursor]");
      const state = target?.getAttribute("data-cursor") ?? "default";
      ring.setAttribute("data-state", state);
      if (labelRef.current) {
        labelRef.current.textContent = target?.getAttribute("data-cursor-label") ?? "";
      }
    };

    const onLeave = () => ring.setAttribute("data-state", "hidden");
    const onEnter = () => ready && ring.setAttribute("data-state", "default");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      root.removeAttribute("data-cursor-ready");
    };
  }, []);

  return (
    <div ref={ringRef} className="cursor-ring" data-state="hidden" aria-hidden="true">
      <span ref={labelRef} className="cursor-label" />
    </div>
  );
}
