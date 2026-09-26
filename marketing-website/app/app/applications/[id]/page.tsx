import { notFound } from "next/navigation";

import { ApplicationHeader } from "@/components/app/ApplicationHeader";
import { DealSummaryCard } from "@/components/app/DealSummaryCard";
import { DocumentsCard } from "@/components/app/DocumentsCard";
import { LenderMatchList } from "@/components/app/LenderMatchList";
import { SyntheticReviewPanel } from "@/components/app/SyntheticReviewPanel";
import { Timeline } from "@/components/app/Timeline";
import { requireUser } from "@/lib/auth";
import { planFor } from "@/lib/billing";
import { one, query } from "@/lib/db";
import { listApplicationLenders } from "@/lib/lenders";
import { reviewSyntheticSources } from "@/lib/synthetic/engine";
import type { Application, ApplicationDocument, ApplicationEvent, DealSummary } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await one<Application>(`SELECT client_name FROM applications WHERE id = $1`, [id]);
  return { title: app?.client_name ?? "Application" };
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [id, user.id]);
  if (!app) notFound();

  const [summary, documents, events, lenderMatches] = await Promise.all([
    one<DealSummary>(`SELECT * FROM deal_summaries WHERE application_id = $1`, [app.id]),
    query<ApplicationDocument>(`SELECT * FROM application_documents WHERE application_id = $1 ORDER BY created_at DESC`, [app.id]),
    query<ApplicationEvent>(`SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at DESC`, [app.id]),
    listApplicationLenders(app.id),
  ]);

  const plan = planFor(user);
  const canExportWithLogo = plan?.id === "pro";
  const sourceReviewRows = reviewSyntheticSources(app, documents);

  return (
    <div className="space-y-8">
      <ApplicationHeader app={app} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <DealSummaryCard applicationId={app.id} summary={summary} canExport={Boolean(summary)} />
          <LenderMatchList applicationId={app.id} matches={lenderMatches} />
        </div>
        <div className="space-y-8">
          <DocumentsCard applicationId={app.id} documents={documents} />
          <Timeline applicationId={app.id} events={events} />
        </div>
      </div>

      <SyntheticReviewPanel app={app} documents={documents} rows={sourceReviewRows} />

      {canExportWithLogo === false && summary && (
        <p className="text-center text-[12.5px] text-grey">
          PDF exports carry your firm name. Upgrade to Pro to include your logo too.
        </p>
      )}
    </div>
  );
}
