import type { EvidenceReference, LegalSource } from "@/types/domain";
import { humanizeStatus } from "@/lib/presentation";

export function Evidence({
  references,
  sources,
}: {
  references: EvidenceReference[];
  sources: LegalSource[];
}) {
  return (
    <div className="mt-3">
      {references.map((reference, i) => {
        const source = sources.find((s) => s.id === reference.sourceId);
        return (
          <details
            className="evidence-item"
            key={`${reference.sourceId}-${i}`}
          >
            <summary className="font-medium [overflow-wrap:anywhere]">
              {source?.authority ?? "Unknown source"} · {reference.sourceId}
            </summary>
            <p className="evidence-meta">
              {source?.jurisdiction} ·{" "}
              {source ? humanizeStatus(source.legalStatus) : "Status unavailable"} · {source?.date}
            </p>
            <p className="my-2 text-xs font-semibold text-[#181818]">
              {source?.provenance && <>Provenance: {humanizeStatus(source.provenance)} · </>}
              {source?.textKind === "CURATOR_SUMMARY"
                ? "Curator summary passage (not a statutory quotation)"
                : "Source excerpt"}
            </p>
            <p className="whitespace-pre-wrap leading-6 [overflow-wrap:anywhere]">
              {reference.relevantText}
            </p>
            <p className="my-2 text-[#686868]">{reference.explanation}</p>
            {source && (
              <a
                className="font-semibold underline [overflow-wrap:anywhere]"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                Open source publication
              </a>
            )}
          </details>
        );
      })}
    </div>
  );
}
