import type { ProposedPatch, ReviewDecision } from "../types/domain.ts";

export function reviewQueue(
  patches: ProposedPatch[],
  decisions: ReviewDecision[],
) {
  const statusByPatchId: Record<string, ReviewDecision["decision"]> = {};

  for (const decision of decisions) {
    statusByPatchId[decision.patchId] = decision.decision;
  }

  const unresolved = patches.filter((patch) => !statusByPatchId[patch.id]);

  return {
    total: patches.length,
    reviewed: patches.length - unresolved.length,
    unresolved,
    statusByPatchId,
  };
}
