import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { ENTER_LABEL, SOFTWARE_URL, softwareAnchor } from "@/lib/config";

/**
 * The opening's footer: an index, not a sitemap. Every product link is
 * built from `SOFTWARE_URL`, so moving the platform moves them all.
 */
export function BrandFooter() {

  const columns = [
    {
      title: "Platform",
      links: [
        { href: SOFTWARE_URL, label: ENTER_LABEL },
        { href: softwareAnchor("product"), label: "What it does" },
        { href: softwareAnchor("pricing"), label: "Pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/privacy", label: "Privacy" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/signup", label: "Start free trial" },
      ],
    },
  ];

  return (
    <footer className="stratum-3 border-t border-rule">
      <div className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-grey-light">
              Deal preparation, lender matching and pipeline tracking for New Zealand commercial
              finance advisers.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="tech">{col.title}</p>
                <ul className="mt-5 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.href}`}>
                      <Link
                        href={l.href}
                        data-cursor="link"
                        className="rule-link text-[14px] text-grey transition-colors duration-300 hover:text-graphite"
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
          <p>© {new Date().getFullYear()} Mandate · Christchurch, New Zealand</p>
        </div>
      </div>
    </footer>
  );
}
