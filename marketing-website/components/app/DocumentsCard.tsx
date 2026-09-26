"use client";

import { useRef, useState, type DragEvent } from "react";

import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { uploadDocumentsAction } from "@/lib/actions/applications";
import type { ApplicationDocument } from "@/lib/types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsCard({ applicationId, documents }: { applicationId: string; documents: ApplicationDocument[] }) {
  const filesRef = useRef<HTMLInputElement>(null);
  const [queuedFiles, setQueuedFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  function acceptDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files);
    if (!dropped.length || !filesRef.current) return;
    const transfer = new DataTransfer();
    dropped.forEach((file) => transfer.items.add(file));
    filesRef.current.files = transfer.files;
    setQueuedFiles(dropped.map((file) => file.name));
  }

  return (
    <Card className="p-7">
      <h2 className="font-display text-xl text-graphite">Documents</h2>
      <p className="mt-2 text-[12.5px] text-grey">
        Upload PDFs for document analysis, or use the fictional CSV examples to run the original synthetic lender comparison.
      </p>

      <details className="mt-3 text-[12.5px]">
        <summary className="cursor-pointer font-medium text-graphite-soft">Download synthetic example CSVs</summary>
        <ul className="mt-2 space-y-1 pl-4">
          {[
            ["Company overview", "kowhai-company-overview.csv"],
            ["Funding request", "kowhai-funding-request.csv"],
            ["Management accounts", "kowhai-management-accounts.csv"],
            ["Accountant summary (includes a deliberate conflict)", "kowhai-accountant-summary.csv"],
            ["Equipment quote", "kowhai-equipment-quote.csv"],
          ].map(([label, filename]) => (
            <li key={filename}>
              <a className="text-sky underline underline-offset-2" href={`/synthetic-examples/${filename}`} download>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {documents.length === 0 ? (
        <p className="mt-3 text-[14px] text-grey">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-rule px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-graphite">{d.filename}</p>
                <p className="text-[11.5px] text-grey">
                  {formatSize(d.size_bytes)}
                  {d.extracted_text ? " · text extracted" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={uploadDocumentsAction} className="mt-5">
        <input type="hidden" name="application_id" value={applicationId} />
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={acceptDrop}
          className={`rounded-[var(--radius-control)] border border-dashed px-3.5 py-4 transition-colors ${dragging ? "border-sky bg-sky-soft" : "border-rule-strong bg-paper-soft"}`}
        >
          <label className="mb-2 block text-[12.5px] font-medium text-graphite-soft" htmlFor="deal-documents">Drop files here or choose files</label>
          <input
            ref={filesRef}
            id="deal-documents"
            name="documents"
            type="file"
            accept="application/pdf,.pdf,text/csv,.csv"
            multiple
            onChange={(event) => setQueuedFiles(Array.from(event.currentTarget.files ?? []).map((file) => file.name))}
            className="block w-full text-[12.5px] text-grey file:mr-3 file:rounded-[4px] file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-paper"
          />
          {queuedFiles.length > 0 && <p className="mt-2 text-[11px] text-grey">Ready to upload: {queuedFiles.join(", ")}</p>}
        </div>
        <label className="mb-2 mt-4 block text-[12.5px] font-medium text-graphite-soft" htmlFor="deal-folder">Or choose a folder</label>
        <input
          id="deal-folder"
          name="documents"
          type="file"
          accept="application/pdf,.pdf,text/csv,.csv"
          multiple
          {...({ webkitdirectory: "", directory: "" } as any)}
          className="block w-full rounded-[var(--radius-control)] border border-dashed border-rule-strong bg-paper-soft px-3.5 py-4 text-[12.5px] text-grey file:mr-3 file:rounded-[4px] file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-paper"
        />
        <p className="mt-2 text-[11.5px] text-grey">Folder upload includes its files. Keep this demo upload under 4 MB total.</p>
        <SubmitButton pendingLabel="Uploading…" className="mt-3 !text-[12.5px]">
          Upload documents
        </SubmitButton>
      </form>
    </Card>
  );
}
