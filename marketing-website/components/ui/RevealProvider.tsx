"use client";

import { useEffect } from "react";

/**
 * The site's one scroll-reveal engine.
 *
 * Rather than wrapping every animated element in a client component, a single
 * observer mounted at the root watches for the `data-reveal` attribute and
 * stamps `data-shown` on each element the first time it enters view. The CSS
 * in `globals.css` owns what "revealed" looks like; this owns only *when*.
 * Sections therefore stay server components with no JS of their own.
 *
 * Reveals are one-way: nothing re-hides on scroll up, which is what makes a
 * long page feel settled rather than twitchy.
 */
export function RevealProvider() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      // Fire a little before the element's top edge clears the fold, and once
      // ~12% of it is visible, so tall sections don't wait for their own end.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => observer.observe(el));
    };

    observe(document);

    // Client navigation swaps subtrees in; pick up whatever arrives later.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;
          if (el.matches("[data-reveal]:not([data-shown])")) observer.observe(el);
          observe(el);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
