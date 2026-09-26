"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-linked translation, applied to the wrapper rather than the child so
 * the child keeps its own transforms.
 *
 * `speed` is a fraction of scroll distance: 0.06 moves the element 6px for
 * every 100px of page scroll. Kept deliberately small — parallax reads as
 * depth up to about 0.1 and as a glitch beyond it.
 *
 * Writes happen inside rAF and only while the element is near the viewport,
 * so an off-screen panel costs nothing. Disabled entirely under reduced
 * motion and below `minWidth`, where the screen is too short for depth to
 * register and the movement only costs battery.
 */
export function Parallax({
  children,
  speed = 0.06,
  minWidth = 1024,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  minWidth?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia(`(max-width: ${minWidth - 1}px)`).matches) return;

    let frame = 0;
    let near = true;

    const apply = () => {
      frame = 0;
      if (!near) return;
      const rect = el.getBoundingClientRect();
      // Offset from the element's resting position at the viewport centre.
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-fromCentre * speed).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) onScroll();
      },
      { rootMargin: "35% 0px" },
    );
    io.observe(el);

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.style.transform = "";
    };
  }, [speed, minWidth]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
