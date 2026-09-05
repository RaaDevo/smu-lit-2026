import type { EvidenceReference, LegalSource } from "@/types/domain";

export function Evidence({
  references,
  sources,
}: {
  references: EvidenceReference[];
  sources: LegalSource[];
}) {
  return (
    <div className="space-y-2">
      {references.map((reference, i) => {
        const source = sources.find((s) => s.id === reference.sourceId);
        return (
          <details
            className="rounded border border-slate-200 p-3 text-sm"
            key={`${reference.sourceId}-${i}`}
          >
            <summary className="cursor-pointer font-medium">
              {source?.authority ?? "Unknown source"} · {reference.sourceId}
            </summary>
            <p className="mt-2 text-xs uppercase text-slate-500">
              {source?.jurisdiction} ·{" "}
              {source?.legalStatus.replaceAll("_", " ")} · {source?.date}
            </p>
            <p className="my-2 text-xs font-semibold">
              {source?.textKind === "CURATOR_SUMMARY"
                ? "Curator summary passage (not a statutory quotation)"
                : "Source excerpt"}
            </p>
            <p className="whitespace-pre-wrap leading-6">
              {reference.relevantText}
            </p>
            <p className="my-2 text-slate-600">{reference.explanation}</p>
            {source && (
              <a
                className="text-blue-800 underline"
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
