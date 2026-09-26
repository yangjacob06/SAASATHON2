import { STATUS_LABEL, statusTone } from "@/lib/status";
import type { ApplicationStatus } from "@/lib/types";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-paper-soft text-graphite-soft",
  progress: "bg-sky-soft text-sky",
  success: "bg-go-soft text-go",
  danger: "bg-stop-soft text-stop",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
