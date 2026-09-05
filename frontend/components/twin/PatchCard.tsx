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
    <article className="panel border-t-2 border-[#181818] pt-0">
      <div className="mb-5 flex items-center justify-between border-b border-[#c9c9c5] py-4">
        <h3 className="text-lg font-semibold tracking-[-0.015em]">
          {patch.assetId} · {patch.section}
        </h3>
        <Badge status={latest?.decision ?? patch.status} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#686868]">
            Original — preserved
          </h4>
          <p className="comparison">
            {patch.originalText}
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#686868]">
            AI proposal — pending publication
          </h4>
          <p className="comparison comparison-proposal">
            {patch.proposedText}
          </p>
        </div>
      </div>
      <p className="my-4 border-l-2 border-[#06054d] pl-3 text-sm leading-6 text-[#686868]">{patch.reasoning}</p>
      <Evidence references={patch.evidence} sources={sources} />
      <label className="mt-4 block text-sm font-semibold">
        Edit proposed wording
        <textarea
          aria-label={`Reviewed wording for ${patch.assetId}`}
          className="field-control min-h-24"
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="mt-2 block text-sm font-semibold">
        Reviewer note
        <input
          aria-label={`Reviewer note for ${patch.assetId}`}
          className="field-control p-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#c9c9c5] pt-4">
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
        <div className="mt-5 border-t border-[#181818] pt-4">
          <h4 className="text-sm font-semibold">Final reviewed text</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {latest.finalReviewedText}
          </p>
        </div>
      )}
      {history.length > 0 && (
        <details className="mt-4 border-t border-[#c9c9c5] pt-3 text-xs text-[#686868]">
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
