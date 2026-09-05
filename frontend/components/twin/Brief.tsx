import type { ResilienceBrief } from "@/types/domain";
import { Badge } from "./ImpactMap";
import { Evidence } from "./Evidence";

export function Brief({ brief }: { brief: ResilienceBrief }) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "regulatory-resilience-brief.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="brief space-y-6">
      <div className="flex justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Regulatory Resilience Brief
          </h2>
          <p className="text-sm text-slate-500">{brief.generatedAt}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button className="button-secondary" onClick={download}>
            Export JSON
          </button>
          <button className="button-primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <div className="rounded border border-amber-300 bg-amber-50 p-4">
        <h3 className="font-semibold">
          Lawyer-approved working assumption · hypothetical
        </h3>
        <p className="mt-2">{brief.scenario.description}</p>
        <p className="mt-2 text-sm">
          Approved by {brief.scenario.approvedBy} · {brief.scenario.approvedAt}
        </p>
      </div>
      <div>
        <h3 className="font-semibold">Foreign development</h3>
        <p>
          {brief.development.title} · {brief.development.date}
        </p>
        <p className="mt-2 text-sm">{brief.development.summary}</p>
      </div>
      <div>
        <h3 className="mb-3 font-semibold">Comparative basis</h3>
        {brief.comparative.assessments.map((a, i) => (
          <div key={i} className="mb-3">
            <p className="font-medium">
              {a.jurisdiction} · {a.classification}
            </p>
            <p className="my-2 text-sm">{a.reasoning}</p>
            <Evidence references={a.evidence} sources={brief.sources} />
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-3 font-semibold">Impact and required action</h3>
        {brief.findings.map((f) => (
          <article key={f.id} className="mb-4 border-b pb-4">
            <Badge status={f.status} />
            <p className="mt-2 font-medium">
              {f.assetId} · {f.section}
            </p>
            <p className="my-2 text-sm">{f.reasoning}</p>
            <p className="text-xs">
              {f.severity} severity · model confidence{" "}
              {Math.round(f.confidence * 100)}% (not legal certainty)
            </p>
            {f.propagationPaths.map((p, i) => (
              <p key={i} className="my-2 text-sm">
                Inherited path: {p.assetIds.join(" → ")}
              </p>
            ))}
            <Evidence references={f.evidence} sources={brief.sources} />
          </article>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Remediation decisions</h3>
        {brief.patches.map((p) => (
          <div key={p.id} className="mb-4 border-b pb-3">
            <p>
              {p.assetId} · {p.section} · {p.status}
            </p>
            <dl className="mt-2 space-y-2 text-sm">
              <dt className="font-semibold">Original</dt>
              <dd>{p.originalText}</dd>
              <dt className="font-semibold">AI proposal</dt>
              <dd>{p.proposedText}</dd>
              <dt className="font-semibold">Final reviewed text</dt>
              <dd>{p.finalReviewedText ?? "No accepted text recorded."}</dd>
            </dl>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-semibold">
          Adversarial review and unresolved legal questions
        </h3>
        {brief.reviewFindings.map((r) => (
          <p className="mb-2 text-sm" key={r.id}>
            {r.assetId}: {r.issue} {r.recommendation}
          </p>
        ))}
        <ul className="list-disc pl-5">
          {brief.outstandingQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Required actions</h3>
        <ul className="list-disc space-y-2 pl-5">
          {brief.requiredActions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Review audit trail</h3>
        {brief.decisions.length === 0 && (
          <p className="text-sm">No lawyer remediation decisions recorded.</p>
        )}
        {brief.decisions.map((d) => (
          <p key={d.id} className="mb-2 text-sm">
            {d.patchId} · {d.decision} · {d.reviewerUid} · {d.timestamp}
            <br />
            {d.note || "No note recorded."}
          </p>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Source register</h3>
        <p className="mb-3 text-sm">
          Dated curated evidence, not a complete statement of current law.
          Curator summaries are not statutory quotations.
        </p>
        {brief.sources.map((s) => (
          <article key={s.id} className="mb-4 border-b pb-3 text-sm">
            <h4 className="font-semibold">
              {s.id} · {s.title}
            </h4>
            <p className="my-2">
              {s.authority} · {s.jurisdiction} · {s.date} · {s.legalStatus} ·{" "}
              {s.textKind}
            </p>
            <p className="whitespace-pre-wrap">{s.relevantText}</p>
            <a
              className="mt-2 block break-all underline"
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.url}
            </a>
          </article>
        ))}
      </div>
      <p className="text-sm font-medium">
        Approval records proposed remediation. Original source documents remain
        unchanged; publication requires a separate human action.
      </p>
    </section>
  );
}
