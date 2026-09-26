import { Card } from "@/components/ui/Card";
import { FieldShell, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateProfileAction, uploadLogoAction } from "@/lib/actions/settings";
import { requireUser } from "@/lib/auth";
import { planFor } from "@/lib/billing";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = planFor(user);
  const isPro = plan?.id === "pro" && user.subscription_status === "active";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-graphite">Settings</h1>
        <p className="mt-1 text-[14px] text-grey">Your profile and firm details.</p>
      </div>

      <Card className="p-7">
        <h2 className="font-display text-lg text-graphite">Profile</h2>
        <form action={updateProfileAction} className="mt-5 space-y-4">
          <FieldShell label="Your name">
            <Input name="name" type="text" defaultValue={user.name} required />
          </FieldShell>
          <FieldShell label="Firm or trading name">
            <Input name="firm_name" type="text" defaultValue={user.firm_name} required />
          </FieldShell>
          <FieldShell label="Email">
            <Input type="email" defaultValue={user.email} disabled className="opacity-60" />
          </FieldShell>
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </form>
      </Card>

      <Card className="p-7">
        <h2 className="font-display text-lg text-graphite">Firm logo</h2>
        <p className="mt-1 text-[13.5px] text-grey">
          Included on exported deal summary PDFs.
          {!isPro && " Available on the Pro plan."}
        </p>
        {isPro ? (
          <form action={uploadLogoAction} className="mt-4">
            <input
              name="logo"
              type="file"
              accept="image/png"
              required
              className="block w-full rounded-[var(--radius-control)] border border-dashed border-rule-strong bg-paper-soft px-3.5 py-4 text-[12.5px] text-grey file:mr-3 file:rounded-[4px] file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-paper"
            />
            <p className="mt-1.5 text-xs text-grey">PNG, ideally on a transparent background.</p>
            <SubmitButton pendingLabel="Uploading…" className="mt-3 !text-[12.5px]">
              Upload logo
            </SubmitButton>
            {user.logo_url && <p className="mt-3 text-[12.5px] text-go">Logo on file.</p>}
          </form>
        ) : (
          <a href="/app/billing" className="mt-4 inline-block text-[13px] font-medium text-graphite underline underline-offset-2">
            Upgrade to Pro
          </a>
        )}
      </Card>
    </div>
  );
}
