import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  error: "bg-stop-soft text-stop border-stop/20",
  success: "bg-go-soft text-go border-go/20",
  info: "bg-sky-soft text-sky border-sky/20",
};

export function Alert({ tone = "info", children, id }: { tone?: "error" | "success" | "info"; children: ReactNode; id?: string }) {
  return (
    <div id={id} role={tone === "error" ? "alert" : undefined} className={`rounded-[var(--radius-control)] border px-4 py-3 text-[13.5px] ${TONE[tone]}`}>
      {children}
    </div>
  );
}
