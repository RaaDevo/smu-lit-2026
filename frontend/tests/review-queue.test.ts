import test from "node:test";
import assert from "node:assert/strict";
import { reviewQueue } from "../lib/review-queue.ts";
import type { ProposedPatch, ReviewDecision } from "../types/domain.ts";

const patches = ["playbook", "checklist", "training"].map(
  (id) => ({ id }) as ProposedPatch,
);
const decisions = [
  { patchId: "playbook", decision: "APPROVED" },
  { patchId: "checklist", decision: "ESCALATED" },
  { patchId: "playbook", decision: "EDITED" },
] as ReviewDecision[];

test("review queue uses the latest decision and keeps unresolved patches in order", () => {
  const queue = reviewQueue(patches, decisions);

  assert.equal(queue.reviewed, 2);
  assert.equal(queue.total, 3);
  assert.deepEqual(queue.unresolved.map((patch) => patch.id), ["training"]);
  assert.equal(queue.statusByPatchId.playbook, "EDITED");
  assert.equal(queue.statusByPatchId.checklist, "ESCALATED");
});
