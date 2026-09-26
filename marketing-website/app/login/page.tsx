import { redirect } from "next/navigation";

import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { logInAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  const { error } = await searchParams;

  return (
    <AuthShell
      title="Choose your workspace."
      subtitle="Start with a clean account or explore six months of sample deal activity."
      footer={
        <>
          Have your own account? <AuthLink href="#account-sign-in">Sign in</AuthLink> · <AuthLink href="/signup">Create an account</AuthLink>.
        </>
      }
    >
      {error && (
        <div className="mt-6">
          <Alert tone="error" id="form-error">
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-7 space-y-3">
        <form action={logInAction}>
          <input type="hidden" name="email" value="fresh@mandate.test" />
          <input type="hidden" name="password" value="demo1234" />
          <button type="submit" className="group flex w-full items-center justify-between rounded-[var(--radius-card)] border border-rule bg-paper-lift p-4 text-left transition hover:border-rule-strong hover:bg-paper-soft">
            <span>
              <span className="block text-[14px] font-semibold text-graphite">Start with a clean workspace</span>
              <span className="mt-1 block text-[12px] text-grey">See Mandate as if you have just signed in. No prior deals.</span>
            </span>
            <span className="ml-4 text-lg text-signal transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </button>
        </form>
        <form action={logInAction}>
          <input type="hidden" name="email" value="demo@mandate.test" />
          <input type="hidden" name="password" value="demo1234" />
          <button type="submit" className="group flex w-full items-center justify-between rounded-[var(--radius-card)] border border-rule bg-paper-lift p-4 text-left transition hover:border-rule-strong hover:bg-paper-soft">
            <span>
              <span className="block text-[14px] font-semibold text-graphite">Open the six-month demo</span>
              <span className="mt-1 block text-[12px] text-grey">Explore prior deals, lender responses and workspace history.</span>
            </span>
            <span className="ml-4 text-lg text-signal transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-[var(--radius-control)] border border-rule bg-paper-soft p-3 text-[11px] leading-relaxed text-grey">
        All sample companies, deals, lender criteria and response data are fictional.
      </div>

      <details id="account-sign-in" className="mt-6 border-t border-rule pt-5">
        <summary className="cursor-pointer text-[12.5px] font-medium text-graphite-soft">Sign in with another account</summary>
        <form action={logInAction} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <SubmitButton pendingLabel="Signing in…" className="w-full">Sign in</SubmitButton>
        </form>
      </details>
    </AuthShell>
  );
}
