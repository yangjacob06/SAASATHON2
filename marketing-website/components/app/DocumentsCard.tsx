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
  return (
    <Card className="p-7">
      <h2 className="font-display text-xl text-graphite">Documents</h2>

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
        <input
          name="documents"
          type="file"
          accept="application/pdf"
          multiple
          className="block w-full rounded-[var(--radius-control)] border border-dashed border-rule-strong bg-paper-soft px-3.5 py-4 text-[12.5px] text-grey file:mr-3 file:rounded-[4px] file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-paper"
        />
        <SubmitButton pendingLabel="Uploading…" className="mt-3 !text-[12.5px]">
          Upload
        </SubmitButton>
      </form>
    </Card>
  );
}
