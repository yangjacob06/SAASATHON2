import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

/*
  Buttons carry the site's micro-interaction: colour settles over 200ms, the
  surface lifts a hair on hover and returns flat on press. Nothing bounces —
  the motion should read as weight, not as bounce.
*/
const base =
  "group inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-quint)] " +
  "hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-graphite text-paper hover:bg-graphite shadow-[0_1px_2px_rgb(22_21_15/0.10)] hover:shadow-[0_8px_20px_-8px_rgb(23_80_58/0.55)]",
  secondary: "bg-paper-lift text-graphite border border-rule-strong hover:border-graphite hover:shadow-[var(--shadow-card)]",
  ghost: "text-graphite hover:bg-paper-soft",
  onDark: "bg-signal text-graphite hover:bg-[#e6f2cc] shadow-[0_10px_30px_-14px_rgb(0_0_0/0.6)]",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-3.5 py-1.5",
  md: "text-[14px] px-5 py-2.5",
  lg: "text-[14px] px-6 py-3.5",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
