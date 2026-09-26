"use client";

import { useEffect, useRef, useState } from "react";

import type { Lattice } from "@/lib/webgl/latticeField";

/**
 * Mounts the lattice and wires it to the page.
 *
 * Three gates decide whether it runs — reduced motion, a coarse pointer, a
 * weak device — and the WebGL module is imported only *after* they pass, so
 * a phone never downloads shader code it was never going to run. Each
 * failure falls through to the static drafting grid rendered underneath
 * rather than to an empty box.
 *
 * Scroll drives resolve: warped at the top of the hero, settled by the time
 * the hero has scrolled away. That is the argument the opening makes, so it
 * belongs on the scrollbar rather than on a timer.
 */
export function LatticeField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    if (cores <= 2 || memory <= 2) return;
    const dense = cores >= 8 && memory >= 8;

    let lattice: Lattice | null = null;
    let cancelled = false;
    const teardown: Array<() => void> = [];

    void (async () => {
      let createLattice: typeof import("@/lib/webgl/latticeField").createLattice;
      try {
        ({ createLattice } = await import("@/lib/webgl/latticeField"));
      } catch {
        return;
      }
      if (cancelled) return;

      try {
        lattice = createLattice(canvas, dense ? { cols: 52, rows: 30 } : { cols: 38, rows: 22 });
      } catch {
        lattice = null;
      }
      if (!lattice || cancelled) {
        lattice?.dispose();
        return;
      }

      setLive(true);
      lattice.setRunning(true);
      wire(lattice, canvas);
    })();

    function wire(field: Lattice, el: HTMLCanvasElement) {
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const span = window.innerHeight * 1.15;
          // Already legibly a lattice on the first frame — loose at the
          // edges, settling at the centre — and scroll sharpens it the rest
          // of the way. Starting at zero would put a snowstorm on screen.
          field.setResolve(Math.min(1, 0.64 + (window.scrollY / span) * 0.36));
        });
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      const onPointerMove = (e: PointerEvent) => {
        field.setPointer(
          (e.clientX / window.innerWidth) * 2 - 1,
          -((e.clientY / window.innerHeight) * 2 - 1),
        );
      };
      const onPointerLeave = () => field.clearPointer();
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);

      // Nothing to draw when nobody can see it.
      const io = new IntersectionObserver(
        ([entry]) => field.setRunning(entry.isIntersecting && !document.hidden),
        { threshold: 0 },
      );
      io.observe(el);
      const onVisibility = () => field.setRunning(!document.hidden);
      document.addEventListener("visibilitychange", onVisibility);

      teardown.push(() => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        io.disconnect();
      });
    }

    return () => {
      cancelled = true;
      teardown.forEach((fn) => fn());
      lattice?.dispose();
      setLive(false);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`h-full w-full transition-opacity duration-[1600ms] ease-[var(--ease-out-expo)] ${
        live ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}
