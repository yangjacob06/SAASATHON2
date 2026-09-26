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
      title="Welcome back."
      subtitle="Sign in to your applications."
      footer={
        <>
          New to Mandate? <AuthLink href="/signup">Start a 14-day free trial</AuthLink>.
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

      <form action={logInAction} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton pendingLabel="Signing in…" className="w-full">
          Sign in
        </SubmitButton>
      </form>

      <div className="mt-6 space-y-2 rounded-[var(--radius-control)] border border-rule bg-paper-soft p-4 text-xs text-grey">
        <p className="font-medium text-graphite-soft">Demo accounts</p>
        <p>New account — empty dashboard: <span className="font-medium text-graphite-soft">fresh@mandate.test</span> / demo1234</p>
        <p>Six months of sample history: <span className="font-medium text-graphite-soft">demo@mandate.test</span> / demo1234</p>
        <p className="pt-1 text-[11px]">All deal and lender records are fictional demonstration data.</p>
      </div>
    </AuthShell>
  );
}
