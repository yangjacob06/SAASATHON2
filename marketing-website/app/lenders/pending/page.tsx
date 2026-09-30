import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Lender access review" };

export default async function LenderPendingPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="shell py-20"><Card className="mx-auto max-w-xl p-8"><h1 className="font-display text-2xl text-graphite">Lender access is under review</h1><p className="mt-3 text-[14px] text-grey">Sign in with the work email used for your request to check your access.</p><Link className="mt-5 inline-block underline" href="/login">Sign in</Link></Card></main>;
  if (user.account_status === "active") return <main className="shell py-20"><Card className="mx-auto max-w-xl p-8"><h1 className="font-display text-2xl text-graphite">Your lender account is active</h1><Link className="mt-5 inline-block underline" href="/app">Open your inbox</Link></Card></main>;
  return <main className="shell py-20"><Card className="mx-auto max-w-xl p-8"><p className="eyebrow">Lender onboarding</p><h1 className="mt-3 font-display text-2xl text-graphite">We’re reviewing your fund profile.</h1><p className="mt-3 text-[14px] leading-relaxed text-grey">Your account is pending review. We’ll enable the private deal inbox after verifying your organisation and lending appetite. No borrower deal data is available while access is pending.</p><p className="mt-5 text-[13px] text-grey">Signed in as {user.email}</p></Card></main>;
}
