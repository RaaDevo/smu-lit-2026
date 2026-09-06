import type { ResilienceBrief } from "@/types/domain";
import { Badge } from "./ImpactMap";
import { Evidence } from "./Evidence";

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAffectedArtefact(assetId: string, section: string) {
  const names: Record<string, string> = {
    playbook: "Playbook",
    checklist: "Checklist",
    training: "Training",
    advisory: "Advisory",
  };
  const name = names[assetId] ?? titleCase(assetId.replaceAll("_", " "));
  if (assetId === "playbook") return `${name} §${section}`;
  return `${name} · ${titleCase(section)}`;
}

function parseRequiredAction(action: string) {
  const match = action.match(
    /^(.*?):\s*([^/]+?)\s*\/\s*([^—]+?)\s*—\s*([^.]+)\.\s*(.*)$/,
  );
  if (!match) {
    return {
      owner: "Owner not specified",
      affected: "Affected artefact not specified",
      status: "Review Required",
      action,
    };
  }
  return {
    owner: match[1].trim(),
    affected: formatAffectedArtefact(match[2].trim(), match[3].trim()),
    status: titleCase(match[4].trim().replaceAll("_", " ")),
    action: match[5].trim(),
  };
}

export function Brief({ brief }: { brief: ResilienceBrief }) {
  const changeCount =
    brief.counts.UPDATE_REQUIRED + brief.counts.DOWNSTREAM_UPDATE;
  const reviewCount = brief.counts.REVIEW_REQUIRED;
  const unaffectedCount = brief.counts.UNAFFECTED;

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
    <section className="brief space-y-7">
      <div className="flex items-end justify-between border-b-2 border-[#181818] pb-5">
        <div>
          <p className="app-kicker">Decision record</p>
          <h2 className="app-title">
            Regulatory Resilience Brief
          </h2>
          <p className="metadata mt-3">Generated {new Date(brief.generatedAt).toLocaleString()}</p>
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
      <section className="brief-executive">
        <div className="executive-summary text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d7ed]">
            Executive outcome
          </p>
        </div>
        <h3 className="executive-headline legacy-headline mt-3 font-serif font-semibold tracking-[-0.025em]">
          {brief.findings.length} artefacts assessed · {changeCount} require action · {reviewCount} require legal review
        </h3>
        <h3 className="executive-headline mt-3 font-serif font-semibold tracking-[-0.025em]">
          {brief.findings.length} Artefacts Assessed · {changeCount} Require Action · {reviewCount} Requires Legal Review
        </h3>
        <p className="executive-description mx-auto mt-4 text-sm leading-6 text-[#e7e7ee]">
          {changeCount} change{changeCount === 1 ? "" : "s"} must be addressed, {reviewCount} item{reviewCount === 1 ? "" : "s"} remain subject to legal applicability review, and {unaffectedCount} artefact{unaffectedCount === 1 ? " remains" : "s remain"} unaffected under this approved hypothetical.
        </p>
        <div className="executive-actions">
          <h4 className="executive-actions-heading">Required Actions</h4>
          <ul className="executive-action-list">
            {brief.requiredActions.map((action, index) => {
              const parsed = parseRequiredAction(action);
              return (
                <li key={index} className="executive-action-row">
                  <div className="executive-action-meta">
                    <span>
                      <strong>Owner</strong>
                      {parsed.owner}
                    </span>
                    <span>
                      <strong>Affected Artefact</strong>
                      {parsed.affected}
                    </span>
                    <span>
                      <strong>Status</strong>
                      <span className="executive-status">{parsed.status}</span>
                    </span>
                  </div>
                  <p className="executive-action-copy">
                    <strong>Required Action</strong>
                    {parsed.action}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <div className="notice notice-warning mb-0">
        <h3 className="font-semibold">Human publication still required</h3>
        <p className="mt-2 text-sm leading-6">
          This brief records lawyer review and proposed remediation. Original source documents remain unchanged; publication requires a separate human action.
        </p>
      </div>
      <div className="border-y border-[#181818] py-4">
        <h3 className="font-semibold">
          Lawyer-approved working assumption · hypothetical
        </h3>
        <p className="mt-2">{brief.scenario.description}</p>
        <p className="mt-2 text-sm">
          Approved by {brief.scenario.approvedBy} · {brief.scenario.approvedAt ? new Date(brief.scenario.approvedAt).toLocaleString() : "Not recorded"}
        </p>
      </div>
      <details className="brief-appendix">
        <summary className="cursor-pointer font-semibold">Impact analysis and remediation detail</summary>
        <div className="mt-5">
          <h3 className="mb-3 font-semibold">Impact and required action</h3>
          {brief.findings.map((f) => (
            <article key={f.id} className="mb-4 border-b pb-4">
              <Badge status={f.status} />
              <p className="mt-2 font-medium">{f.assetId} · {f.section}</p>
              <p className="my-2 text-sm">{f.reasoning}</p>
              <p className="text-xs">{f.severity} severity · model confidence {Math.round(f.confidence * 100)}% (not legal certainty)</p>
              {f.propagationPaths.map((p, i) => (
                <p key={i} className="my-2 text-sm">Inherited path: {p.assetIds.join(" → ")}</p>
              ))}
              <Evidence references={f.evidence} sources={brief.sources} />
            </article>
          ))}
          <h3 className="mb-2 mt-6 font-semibold">Remediation decisions</h3>
          {brief.patches.map((p) => (
            <div key={p.id} className="mb-4 border-b pb-3">
              <p>{p.assetId} · {p.section} · {p.status}</p>
              <dl className="mt-2 space-y-2 text-sm">
                <dt className="font-semibold">Original</dt><dd>{p.originalText}</dd>
                <dt className="font-semibold">AI proposal</dt><dd>{p.proposedText}</dd>
                <dt className="font-semibold">Final reviewed text</dt><dd>{p.finalReviewedText ?? "No accepted text recorded."}</dd>
              </dl>
            </div>
          ))}
        </div>
      </details>
      <details className="brief-appendix">
        <summary className="cursor-pointer font-semibold">Legal basis and unresolved questions</summary>
        <div className="mt-5">
          <h3 className="font-semibold">Foreign development</h3>
          <p>{brief.development.title} · {brief.development.date}</p>
          <p className="mt-2 text-sm">{brief.development.summary}</p>
          <h3 className="mb-3 mt-6 font-semibold">Comparative basis</h3>
          {brief.comparative.assessments.map((a, i) => (
            <div key={i} className="mb-3">
              <p className="font-medium">{a.jurisdiction} · {a.classification}</p>
              <p className="my-2 text-sm">{a.reasoning}</p>
              <Evidence references={a.evidence} sources={brief.sources} />
            </div>
          ))}
          <h3 className="mb-2 mt-6 font-semibold">Adversarial review and unresolved legal questions</h3>
          {brief.reviewFindings.map((r) => <p className="mb-2 text-sm" key={r.id}>{r.assetId}: {r.issue} {r.recommendation}</p>)}
          <ul className="list-disc pl-5">{brief.outstandingQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        </div>
      </details>
      <details className="brief-appendix">
        <summary className="cursor-pointer font-semibold">Audit trail and source register</summary>
        <div className="mt-5">
          <h3 className="mb-2 font-semibold">Review audit trail</h3>
          {brief.decisions.length === 0 && <p className="text-sm">No lawyer remediation decisions recorded.</p>}
          {brief.decisions.map((d) => <p key={d.id} className="mb-2 text-sm">{d.patchId} · {d.decision} · {d.reviewerUid} · {d.timestamp}<br />{d.note || "No note recorded."}</p>)}
          <h3 className="mb-2 mt-6 font-semibold">Source register</h3>
          <p className="mb-3 text-sm">Dated curated evidence, not a complete statement of current law. Curator summaries are not statutory quotations.</p>
          {brief.sources.map((s) => (
            <article key={s.id} className="mb-4 border-b pb-3 text-sm">
              <h4 className="font-semibold">{s.id} · {s.title}</h4>
              <p className="my-2">{s.authority} · {s.jurisdiction} · {s.date} · {s.legalStatus} · {s.textKind}</p>
              <p className="whitespace-pre-wrap">{s.relevantText}</p>
              <a className="mt-2 block break-all underline" href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
            </article>
          ))}
        </div>
      </details>
      {brief.twinRun && (
        <details className="brief-appendix">
          <summary className="cursor-pointer font-semibold">Law Firm Twins audit and client-alert draft</summary>
          <div className="mt-5 space-y-4 text-sm">
            <p>{brief.twinRun.evaluator.summary}</p>
            <p><strong>Client Alert Twin:</strong> {brief.twinRun.clientAlert.status} — {brief.twinRun.clientAlert.draft}</p>
            <p><strong>Formal Sign-Off:</strong> {brief.twinRun.signOffAttempts.at(-1)?.formalSignOff}</p>
            {brief.twinRun.signOffAttempts.at(-1)?.proceduralDeviations.map((deviation, index) => (
              <p key={index} className="notice notice-warning">Procedural deviation: {deviation.description} Governance risk: {deviation.governanceRisk}</p>
            ))}
            <h3 className="mt-5 font-semibold">Evaluator stage matrix</h3>
            {brief.twinRun.evaluator.stageMatrix.map((entry, index) => (
              <p key={index} className="text-[#686868]">{entry.stage} · {entry.dimension.replaceAll("_", " ")} · {entry.status}: {entry.assessment}</p>
            ))}
            {brief.twinRun.evaluator.observations.map((observation) => (
              <div key={observation.id} className="border-b border-[#c9c9c5] pb-3">
                <p className="font-semibold">{observation.category.replaceAll("_", " ")} · {observation.severity}</p>
                <p className="mt-1">{observation.issue}</p>
                <p className="mt-1 text-[#686868]">{observation.recommendation}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
