import { redirect } from "next/navigation";

import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signUpAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  const { error } = await searchParams;

  return (
    <AuthShell
      title="Create your Mandate account."
      subtitle="Free to join and use. A success fee applies only when a deal settles."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>.
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

      <form action={signUpAction} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="name">
            Your name
          </label>
          <Input id="name" name="name" type="text" autoComplete="name" required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-graphite-soft" htmlFor="firm_name">
            Firm or trading name
          </label>
          <Input id="firm_name" name="firm_name" type="text" required />
        </div>
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
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <p className="mt-1.5 text-xs text-grey">At least 8 characters.</p>
        </div>
        <SubmitButton pendingLabel="Creating your account…" className="w-full">
          Create free account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
