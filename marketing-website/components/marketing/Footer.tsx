import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { softwareAnchor } from "@/lib/config";

/**
 * The footer, on the deep bone ground so the page closes a shade darker
 * than it opened. The photography credit is a licence obligation, not a
 * flourish — it stays.
 */

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: softwareAnchor("product"), label: "What it does" },
      { href: softwareAnchor("how-it-works"), label: "How it works" },
      { href: softwareAnchor("pricing"), label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Start free trial" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "Mandate" },
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {

  return (
    <footer className="border-t border-rule bg-paper-soft">
      <div className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-grey">
              Deal preparation, lender matching and pipeline tracking for New Zealand commercial
              finance advisers.
            </p>
            <p className="mt-6 text-[13px] text-grey-light">Built in Christchurch, New Zealand.</p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="eyebrow-quiet">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="rule-link text-[14px] text-graphite-soft transition-colors hover:text-graphite"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-rule pt-7 text-[12px] text-grey-light sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mandate.</p>
        </div>
      </div>
    </footer>
  );
}
