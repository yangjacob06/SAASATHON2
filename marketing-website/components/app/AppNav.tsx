"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/Logo";
import { logOutAction } from "@/lib/actions/auth";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/app", label: "Applications" },
  { href: "/app/lenders", label: "Lenders" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-rule bg-paper-lift">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/app">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((l) => {
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
    </header>
  );
}
