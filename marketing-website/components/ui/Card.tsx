import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-rule bg-paper-lift shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
}
