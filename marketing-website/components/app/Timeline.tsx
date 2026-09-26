import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { addNoteAction, addReminderAction, completeReminderAction } from "@/lib/actions/applications";
import { STATUS_LABEL } from "@/lib/status";
import type { ApplicationEvent, ApplicationStatus } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function Timeline({ applicationId, events }: { applicationId: string; events: ApplicationEvent[] }) {
  const upcoming = events.filter((e) => e.type === "reminder" && !e.done_at);
  const history = [...events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <Card className="p-7">
      <h2 className="font-display text-xl text-graphite">Progress</h2>

      {upcoming.length > 0 && (
        <div className="mt-4 space-y-2">
          {upcoming.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-amber-soft px-3.5 py-2.5">
              <div>
                <p className="text-[13.5px] font-medium text-amber">{e.message}</p>
                {e.due_at && <p className="text-[11.5px] text-amber/80">Due {formatDate(e.due_at)}</p>}
              </div>
              <form action={completeReminderAction}>
                <input type="hidden" name="application_id" value={applicationId} />
                <input type="hidden" name="event_id" value={e.id} />
                <button type="submit" className="shrink-0 text-[12px] font-medium text-amber underline underline-offset-2">
                  Done
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form action={addNoteAction} className="flex flex-1 gap-2">
          <input type="hidden" name="application_id" value={applicationId} />
          <Input name="message" type="text" placeholder="Add a note…" className="!py-2 text-[13.5px]" />
          <SubmitButton pendingLabel="…" className="!px-3.5 !py-2 !text-[12.5px]">
            Add
          </SubmitButton>
        </form>
        <form action={addReminderAction} className="flex gap-2">
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="days" value="3" />
          <Input name="message" type="text" placeholder="Remind me in 3 days to…" className="!py-2 text-[13.5px]" />
          <SubmitButton pendingLabel="…" className="!bg-amber !px-3.5 !py-2 !text-[12.5px]">
            Remind
          </SubmitButton>
        </form>
      </div>

      <ol className="mt-7 space-y-4 border-l border-rule pl-5">
        {history.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-rule-strong" />
            <p className="text-[13.5px] text-graphite-soft">
              {e.type === "status_change" && e.to_status ? (
                <>
                  Status changed to <span className="font-medium text-graphite">{STATUS_LABEL[e.to_status as ApplicationStatus]}</span>
                </>
              ) : (
                e.message
              )}
            </p>
            <p className="text-[11.5px] text-grey">
              {formatDate(e.created_at)}
              {e.type === "reminder" && e.done_at ? " · done" : ""}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
