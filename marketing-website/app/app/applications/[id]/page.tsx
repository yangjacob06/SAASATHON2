import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { ApplicationHeader } from "@/components/app/ApplicationHeader";
import { DealSummaryCard } from "@/components/app/DealSummaryCard";
import { DocumentsCard } from "@/components/app/DocumentsCard";
import { LenderMatchList } from "@/components/app/LenderMatchList";
import { Timeline } from "@/components/app/Timeline";
import { requireAdviser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { listApplicationLenders } from "@/lib/lenders";
import type { Application, ApplicationDocument, ApplicationEvent, DealSummary } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await one<Application>(`SELECT id FROM applications WHERE id = $1`, [id]);
  return { title: app ? "Deal workspace" : "Application" };
}

export default async function ApplicationDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireAdviser();
  const { id } = await params;
  const { error } = await searchParams;

  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [id, user.id]);
  if (!app) notFound();

  const [summary, documents, events, lenderMatches] = await Promise.all([
    one<DealSummary>(`SELECT * FROM deal_summaries WHERE application_id = $1`, [app.id]),
    query<ApplicationDocument>(`SELECT * FROM application_documents WHERE application_id = $1 ORDER BY created_at DESC`, [app.id]),
    query<ApplicationEvent>(`SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at DESC`, [app.id]),
    listApplicationLenders(app.id),
  ]);

  return (
    <div className="space-y-8">
      {error && <Alert tone="error">{error}</Alert>}
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

    </div>
  );
}
