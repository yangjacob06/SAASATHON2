import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { planFor } from "@/lib/billing";
import { one } from "@/lib/db";
import { renderSummaryPdf } from "@/lib/pdf-export";
import { readFile } from "@/lib/storage";
import type { Application, DealSummary } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const app = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [id, user.id]);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const summary = await one<DealSummary>(`SELECT * FROM deal_summaries WHERE application_id = $1`, [app.id]);
  if (!summary) return NextResponse.json({ error: "No summary yet" }, { status: 404 });

  const plan = planFor(user);
  let logoPngBytes: Buffer | null = null;
  if (plan?.id === "pro" && user.logo_url) {
    try {
      logoPngBytes = await readFile(user.logo_url);
    } catch {
      logoPngBytes = null;
    }
  }

  const pdf = await renderSummaryPdf({
    markdown: summary.content,
    firmName: user.firm_name || "Mandate",
    clientName: app.client_name,
    logoPngBytes,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${app.client_name.replace(/[^a-z0-9]+/gi, "-")}-deal-summary.pdf"`,
    },
  });
}
