import { AppNav } from "@/components/app/AppNav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-paper">
      <AppNav user={user} isMarketplaceAdmin={process.env.MANDATE_ADMIN_EMAIL?.trim().toLowerCase() === user.email.toLowerCase()} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
