"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  ...props
}: { children: ReactNode; pendingLabel?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-graphite px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-graphite disabled:opacity-60 ${className}`}
      {...props}
    >
      {pending ? pendingLabel ?? "Working…" : children}
    </button>
  );
}
