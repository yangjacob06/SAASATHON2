"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Pulls its child toward the pointer while the pointer is near.
 *
 * Reserved for the opening's primary action. A magnetic effect on every
 * button is a tic; on the one element the whole page exists to get you to
 * press, it reads as the page reaching back.
 *
 * `strength` is the fraction of the pointer's offset the element travels,
 * and the pull is capped so the element never leaves its own hit area.
 */
export function Magnetic({
  children,
  strength = 0.32,
  radius = 120,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pulling = false;

    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        const reach = Math.max(rect.width, rect.height) / 2 + radius;

        if (distance > reach) {
          if (pulling) {
            pulling = false;
            el.removeAttribute("data-pulling");
            el.style.transform = "";
          }
          return;
        }

        if (!pulling) {
          pulling = true;
          el.setAttribute("data-pulling", "");
        }
        // Falls off toward the edge of reach, so the pull has no seam.
        const falloff = 1 - distance / reach;
        el.style.transform = `translate3d(${dx * strength * falloff}px, ${
          dy * strength * falloff
        }px, 0)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.style.transform = "";
    };
  }, [strength, radius]);

  return (
    <span ref={ref} className={`magnetic inline-block ${className}`}>
      {children}
    </span>
  );
}
