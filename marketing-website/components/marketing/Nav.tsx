"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArrowUpRight } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { softwareAnchor } from "@/lib/config";

const LINKS = [
  { href: softwareAnchor("product"), label: "Product" },
  { href: softwareAnchor("how-it-works"), label: "How it works" },
  { href: softwareAnchor("pricing"), label: "Pricing" },
];

/**
 * The header.
 *
 * It starts weightless over the hero and earns its surface on scroll: a
 * blurred bone panel and a hairline appear, and the bar itself shortens.
 * Both states are the same element, so the transition is a property change
 * rather than a swap, and nothing reflows underneath.
 *
 * Interior pages have no hero to float over, so they pass `floating={false}`
 * and start in the settled state.
 */
export function Nav({ floating = false }: { floating?: boolean }) {
  const [scrolled, setScrolled] = useState(!floating);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!floating) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [floating]);

  // The overlay menu owns the viewport while it is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-out-quint)] ${
          scrolled
            ? "border-b border-rule/80 bg-paper/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`shell flex items-center justify-between transition-[padding] duration-500 ease-[var(--ease-out-quint)] ${
            scrolled ? "py-3.5" : "py-5"
          }`}
        >
          <Link href="/" aria-label="Mandate — home" className="relative z-10">
            <Logo size={scrolled ? "sm" : "md"} />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rule-link text-[13.5px] font-medium text-graphite-soft transition-colors hover:text-graphite"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rule-link hidden text-[13.5px] font-medium text-graphite-soft transition-colors hover:text-graphite sm:inline-block sm:mr-4"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="nudge hidden items-center gap-2 rounded-[var(--radius-control)] bg-graphite px-4 py-2.5 text-[13.5px] font-medium text-paper transition-colors duration-200 hover:bg-graphite sm:inline-flex"
            >
              Start free trial
              <ArrowUpRight />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-10 -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
            >
              {/*
                Two rules that cross into an X. Rotating in place beats
                swapping a hamburger icon for a close icon — the gesture is
                continuous and reads as one object.
              */}
              <span className="relative block h-[11px] w-[22px]">
                <span
                  className={`absolute left-0 block h-px w-full bg-graphite transition-transform duration-400 ease-[var(--ease-out-quint)] ${
                    open ? "top-[5px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-full bg-graphite transition-transform duration-400 ease-[var(--ease-out-quint)] ${
                    open ? "top-[5px] -rotate-45" : "top-[10px]"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu — an editorial index page, not a dropdown. */}
      <div
        className={`fixed inset-0 z-30 flex flex-col bg-paper transition-[opacity,visibility] duration-500 ease-[var(--ease-out-quint)] lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="shell flex flex-1 flex-col justify-center pb-16 pt-24">
          <nav className="flex flex-col">
            {[...LINKS, { href: "/login", label: "Sign in" }].map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="group overflow-hidden border-b border-rule py-5"
              >
                <span
                  className="flex items-baseline justify-between transition-transform duration-700 ease-[var(--ease-out-expo)]"
                  style={{
                    transform: open ? "none" : "translateY(120%)",
                    transitionDelay: open ? `${90 + i * 65}ms` : "0ms",
                  }}
                >
                  <span className="headline text-[2rem] text-graphite">{l.label}</span>
                  <span className="eyebrow-quiet nums">0{i + 1}</span>
                </span>
              </a>
            ))}
          </nav>

          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="nudge mt-10 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-graphite px-6 py-4 text-[14px] font-medium text-paper"
          >
            Start your 14-day free trial
            <ArrowUpRight />
          </Link>
          <p className="mt-6 text-[13px] text-grey">
            Built in Christchurch for New Zealand commercial finance advisers.
          </p>
        </div>
      </div>
    </>
  );
}
