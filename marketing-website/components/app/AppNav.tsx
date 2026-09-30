"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/Logo";
import { logOutAction } from "@/lib/actions/auth";
import type { User } from "@/lib/types";

export function AppNav({ user, isMarketplaceAdmin }: { user: User; isMarketplaceAdmin: boolean }) {
  const pathname = usePathname();
  const links = user.account_type === "lender"
    ? [
        { href: "/app/inbox", label: "Deal inbox" },
        { href: "/app/criteria", label: "Lending criteria" },
        { href: "/app/billing", label: "Fees" },
        { href: "/app/settings", label: "Settings" },
      ]
    : [
        { href: "/app", label: "Applications" },
        { href: "/app/lenders", label: "Lenders" },
        { href: "/app/billing", label: "Fees" },
        { href: "/app/settings", label: "Settings" },
        ...(isMarketplaceAdmin ? [{ href: "/app/lenders/review", label: "Lender review" }] : []),
      ];

  return (
    <header className="border-b border-rule bg-paper-lift">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/app">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => {
              const isActive = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-[13.5px] font-medium transition-colors ${
                    isActive ? "text-graphite" : "text-grey hover:text-graphite-soft"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-grey sm:inline">{user.firm_name}</span>
          <form action={logOutAction}>
            <button type="submit" className="text-[13px] font-medium text-grey hover:text-graphite">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav aria-label="Workspace navigation" className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-6 pb-3 md:hidden">
        {links.map((l) => {
          const isActive = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
          return <Link key={`mobile-${l.href}`} href={l.href} className={`shrink-0 text-[12.5px] font-medium ${isActive ? "text-graphite" : "text-grey"}`}>{l.label}</Link>;
        })}
      </nav>
    </header>
  );
}
