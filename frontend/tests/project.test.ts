import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectScenario,
  editScenario,
  approveScenario,
  initialProject,
  applyComparativeResult,
  createLawyerAssumption,
} from "../lib/project-state.ts";
import type { ComparativeResult, Scenario } from "../types/domain.ts";

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

test("comparative analysis preselects the AI recommendation", () => {
  const comparative = { assessments: [], scenarios: [scenario], recommendation: {
    scenarioId: "one", rationale: "Supported", persuasiveWeight: "HIGH", evidence: [], confidence: "MEDIUM",
    factorsConsidered: ["Supplied evidence"], supportingEvidence: [], countervailingConsiderations: ["Uncertainty"], uncertainty: "Uncertain", recommendationRationale: "Stress-test first.",
  }} as ComparativeResult;
  assert.equal(applyComparativeResult(initialProject(), comparative).scenario?.id, "one");
});

test("legacy comparative state without a recommendation remains selectable without crashing", () => {
  const legacyComparative = { assessments: [], scenarios: [scenario] } as unknown as ComparativeResult;
  const project = applyComparativeResult(initialProject(), legacyComparative);
  assert.equal(project.comparative?.scenarios[0]?.id, "one");
  assert.equal(project.scenario, null);
});

test("lawyer-authored assumption clears agent and review state", () => {
  const comparative = { assessments: [], scenarios: [scenario], recommendation: {
    scenarioId: "one", rationale: "Supported", persuasiveWeight: "HIGH", evidence: [], confidence: "MEDIUM",
    factorsConsidered: ["Supplied evidence"], supportingEvidence: [], countervailingConsiderations: ["Uncertainty"], uncertainty: "Uncertain", recommendationRationale: "Stress-test first.",
  }} as ComparativeResult;
  const project = { ...applyComparativeResult(initialProject(), comparative), twinRun: {} as never,
    impact: {} as never, remediation: {} as never, decisions: [{}] as never, brief: {} as never };
  const updated = createLawyerAssumption(project, "A narrower hypothetical");
  assert.equal(updated.scenario?.id, "lawyer-assumption");
  assert.equal(updated.twinRun, null);
  assert.equal(updated.impact, null);
  assert.equal(updated.remediation, null);
  assert.deepEqual(updated.decisions, []);
});
