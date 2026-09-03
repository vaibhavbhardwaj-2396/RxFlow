import { FileText } from "lucide-react";

/**
 * Renders an uploaded prescription for reference, always from the authenticated
 * stream route — never a public path.
 */
export function PrescriptionViewer({
  prescriptionId,
  sourceType,
  originalName,
}: {
  prescriptionId: string;
  sourceType: string;
  originalName: string | null;
}) {
  const src = `/api/prescriptions/${prescriptionId}/file`;

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface-sunken">
      {sourceType === "pdf" ? (
        <object
          data={src}
          type="application/pdf"
          className="h-[28rem] w-full"
          aria-label={originalName ?? "Prescription PDF"}
        >
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-ink-muted">
            <FileText className="size-6" aria-hidden />
            <a href={src} className="text-accent hover:underline">
              Open {originalName ?? "the PDF"}
            </a>
          </div>
        </object>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- authed, non-optimisable stream
        <img
          src={src}
          alt={originalName ?? "Uploaded prescription"}
          className="max-h-[28rem] w-full object-contain"
        />
      )}
      <figcaption className="border-t border-line px-3 py-2 text-xs text-ink-faint">
        {originalName ?? "Prescription"} · reference only — Regimen never reads
        this for you
      </figcaption>
    </figure>
  );
}
