import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/Logo";

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-graphite underline underline-offset-2 hover:opacity-70">
      {children}
    </Link>
  );
}

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/">
            <Logo />
          </Link>
          <h1 className="mt-10 font-display text-3xl text-graphite">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-grey">{subtitle}</p>}

          {children}

          <p className="mt-8 text-[13.5px] text-grey">{footer}</p>
        </div>
      </div>

      {/* The one graphite surface on an otherwise paper screen. */}
      <div className="relative hidden bg-graphite lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(243 242 238 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(243 242 238 / 0.07) 1px, transparent 1px)",
            backgroundSize: "4.5rem 4.5rem",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-2xl leading-snug text-paper">
            Prepare and place private-credit deals in minutes, not days
            <span className="text-signal">.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
