import Link from "next/link";

import { trialState } from "@/lib/billing";
import type { User } from "@/lib/types";

export function TrialBanner({ user }: { user: User }) {
  const trial = trialState(user);
  if (!trial.onTrial) return null;

  return (
    <div className={`border-b px-6 py-2.5 text-center text-[13px] ${trial.expired ? "border-stop/20 bg-stop-soft text-stop" : "border-rule bg-paper-soft text-graphite-soft"}`}>
      {trial.expired ? (
        <>
          Your free trial has ended.{" "}
          <Link href="/app/billing" className="font-medium underline underline-offset-2">
            Choose a plan
          </Link>{" "}
          to keep working on your applications.
        </>
      ) : (
        <>
          {trial.daysLeft} {trial.daysLeft === 1 ? "day" : "days"} left on your free trial.{" "}
          <Link href="/app/billing" className="font-medium underline underline-offset-2">
            View plans
          </Link>
          .
        </>
      )}
    </div>
  );
}
