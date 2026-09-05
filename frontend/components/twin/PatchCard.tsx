"use client";
import { useState } from "react";
import type {
  LegalSource,
  ProposedPatch,
  ReviewDecision,
} from "@/types/domain";
import { Evidence } from "./Evidence";
import { Badge } from "./ImpactMap";

export function PatchCard({
  patch,
  decisions,
  sources,
  busy,
  onReview,
}: {
  patch: ProposedPatch;
  decisions: ReviewDecision[];
  sources: LegalSource[];
  busy: boolean;
  onReview: (
    patch: ProposedPatch,
    decision: ReviewDecision["decision"],
    note: string,
    edited: string,
  ) => void;
}) {
  const history = decisions.filter((d) => d.patchId === patch.id);
  const latest = history.at(-1);
  const [note, setNote] = useState("");
  const [edited, setEdited] = useState(
    latest?.finalReviewedText ?? patch.proposedText,
  );
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          {patch.assetId} · {patch.section}
        </h3>
        <Badge status={latest?.decision ?? patch.status} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase text-slate-500">
            Original — preserved
          </h4>
          <p className="min-h-28 whitespace-pre-wrap border-l-4 border-red-200 bg-red-50 p-3 text-sm leading-6">
            {patch.originalText}
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase text-slate-500">
            AI proposal — pending publication
          </h4>
          <p className="min-h-28 whitespace-pre-wrap border-l-4 border-emerald-200 bg-emerald-50 p-3 text-sm leading-6">
            {patch.proposedText}
          </p>
        </div>
      </div>
      <p className="my-3 text-sm text-slate-600">{patch.reasoning}</p>
      <Evidence references={patch.evidence} sources={sources} />
      <label className="mt-4 block text-sm font-semibold">
        Edit proposed wording
        <textarea
          aria-label={`Reviewed wording for ${patch.assetId}`}
          className="mt-1 min-h-24 w-full rounded border border-slate-300 p-3 font-normal"
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="mt-2 block text-sm font-semibold">
        Reviewer note
        <input
          aria-label={`Reviewer note for ${patch.assetId}`}
          className="mt-1 w-full rounded border border-slate-300 p-2 font-normal"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="mt-3 flex gap-2">
        {(["APPROVED", "REJECTED", "EDITED", "ESCALATED"] as const).map(
          (decision) => (
            <button
              key={decision}
              className={
                decision === "APPROVED" ? "button-primary" : "button-secondary"
              }
              disabled={busy || (decision === "EDITED" && !edited.trim())}
              onClick={() => onReview(patch, decision, note, edited)}
            >
              {
                {
                  APPROVED: "Accept proposal",
                  REJECTED: "Reject",
                  EDITED: "Accept edited wording",
                  ESCALATED: "Escalate",
                }[decision]
              }
            </button>
          ),
        )}
      </div>
      {latest?.finalReviewedText && (
        <div className="mt-4 border-t pt-3">
          <h4 className="text-sm font-semibold">Final reviewed text</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {latest.finalReviewedText}
          </p>
        </div>
      )}
      {history.length > 0 && (
        <details className="mt-3 text-xs text-slate-600">
          <summary>Review history ({history.length})</summary>
          {history.map((d) => (
            <p key={d.id} className="my-2">
              {d.decision} · {d.reviewerUid} · {d.timestamp}
              <br />
              {d.note || "No note recorded."}
            </p>
          ))}
        </details>
      )}
    </article>
  );
}
