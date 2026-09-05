import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectScenario,
  editScenario,
  approveScenario,
  initialProject,
} from "../lib/project-state.ts";
import type { Scenario } from "../types/domain.ts";

const scenario: Scenario = {
  id: "one",
  title: "Example",
  description: "IF an assessment were required",
  assumptions: ["hypothetical"],
  evidence: [],
  uncertainty: "HIGH",
  legalQuestions: [],
  status: "AI_GENERATED_SCENARIO",
  approvedBy: null,
  approvedAt: null,
};

test("editing approved assumption clears dependent findings and restores the gate", () => {
  const selected = selectScenario(initialProject(), scenario);
  const approved = approveScenario(selected, "lawyer");
  assert.equal(approved.scenario?.status, "LAWYER_APPROVED_WORKING_ASSUMPTION");
  // Deliberately populate downstream state: removing invalidation must fail this test.
  const dirty = {
    ...approved,
    impact: { contextHash: "old" } as never,
    remediation: { patches: [] } as never,
    decisions: [{ id: "old-review" }] as never,
    brief: { title: "old brief" } as never,
  };
  const edited = editScenario(dirty, "IF a narrower duty applied");
  assert.equal(edited.scenario?.status, "AI_GENERATED_SCENARIO");
  assert.equal(edited.scenario?.approvedBy, null);
  assert.equal(edited.impact, null);
  assert.equal(edited.remediation, null);
  assert.deepEqual(edited.decisions, []);
  assert.equal(edited.brief, null);
  assert.equal(approved.scenario?.description, scenario.description);
});

test("approval requires a selected nonempty scenario", () => {
  assert.throws(() => approveScenario(initialProject(), "lawyer"));
  assert.throws(() =>
    approveScenario(
      selectScenario(initialProject(), { ...scenario, description: " " }),
      "lawyer",
    ),
  );
});
