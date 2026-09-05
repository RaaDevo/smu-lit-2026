import type { EvidenceReference, LegalSource } from "@/types/domain";

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
            <summary className="cursor-pointer font-medium">
              {source?.authority ?? "Unknown source"} · {reference.sourceId}
            </summary>
            <p className="evidence-meta">
              {source?.jurisdiction} ·{" "}
              {source?.legalStatus.replaceAll("_", " ")} · {source?.date}
            </p>
            <p className="my-2 text-xs font-semibold text-[#181818]">
              {source?.textKind === "CURATOR_SUMMARY"
                ? "Curator summary passage (not a statutory quotation)"
                : "Source excerpt"}
            </p>
            <p className="whitespace-pre-wrap leading-6">
              {reference.relevantText}
            </p>
            <p className="my-2 text-[#686868]">{reference.explanation}</p>
            {source && (
              <a
                className="font-semibold underline"
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
