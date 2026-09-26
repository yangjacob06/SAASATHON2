"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ENTER_LABEL, SOFTWARE_URL } from "@/lib/config";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";

/**
 * The opening's header.
 *
 * Almost nothing: the mark, one index link, and the crossing into the
 * product. A brand world with a five-item navigation is a website; a brand
 * world with one destination is a statement about where you are meant to go.
 *
 * It recedes on scroll rather than growing a surface — the opposite of the
 * product page's header, because here the visual is the point and the
 * chrome should get out of its way.
 */
export function BrandNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,padding] duration-700 ease-[var(--ease-out-expo)] ${
        scrolled ? "bg-stratum-1/75 py-3 backdrop-blur-xl" : "bg-transparent py-6"
      }`}
    >
      <div className="shell flex items-center justify-between gap-6">
        <Link href="/" data-cursor="link" aria-label="Mandate — home">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-6 sm:gap-9">
          <Link
            href="/about"
            data-cursor="link"
            className="tech transition-colors duration-300 hover:text-graphite"
          >
            About
          </Link>
          <Link
            href={SOFTWARE_URL}
            data-cursor="link"
            className="nudge group inline-flex items-center gap-2 border-b border-rule pb-1 text-[13px] font-medium text-graphite transition-colors duration-300 hover:border-signal hover:text-signal"
          >
            <span className="hidden sm:inline">{ENTER_LABEL}</span>
            <span className="sm:hidden">Platform</span>
            <ArrowUpRight />
          </Link>
        </div>
      </div>
    </header>
  );
}
