import type {
  ComparativeResult,
  ImpactResult,
  RemediationResult,
  ResilienceBrief,
  ReviewDecision,
  Scenario,
  SeedPack,
  TwinRunResult,
} from "../types/domain.ts";

export type ProjectState = {
  seed: SeedPack | null;
  comparative: ComparativeResult | null;
  scenario: Scenario | null;
  impact: ImpactResult | null;
  remediation: RemediationResult | null;
  twinRun: TwinRunResult | null;
  decisions: ReviewDecision[];
  brief: ResilienceBrief | null;
};

export function initialProject(): ProjectState {
  return {
    seed: null,
    comparative: null,
    scenario: null,
    impact: null,
    remediation: null,
    twinRun: null,
    decisions: [],
    brief: null,
  };
}

export function selectScenario(
  project: ProjectState,
  scenario: Scenario,
): ProjectState {
  return {
    ...project,
    scenario: {
      ...scenario,
      status: "AI_GENERATED_SCENARIO",
      approvedBy: null,
      approvedAt: null,
    },
    impact: null,
    twinRun: null,
    remediation: null,
    decisions: [],
    brief: null,
  };
}

export function applyComparativeResult(
  project: ProjectState,
  comparative: ComparativeResult,
): ProjectState {
  const base = { ...initialProject(), seed: project.seed, comparative };
  // A deployed frontend can receive a response from an older backend or an older
  // persisted payload. Keep those scenarios available, but do not fabricate a recommendation.
  if (!comparative.recommendation) return base;
  const recommended = comparative.scenarios.find(
    (scenario) => scenario.id === comparative.recommendation.scenarioId,
  );
  return recommended ? selectScenario(base, recommended) : base;
}

export function createLawyerAssumption(
  project: ProjectState,
  description = "",
): ProjectState {
  if (!project.comparative) throw new Error("Analyse comparative evidence first.");
  const evidence = project.comparative.recommendation?.evidence
    ?? project.comparative.scenarios[0]?.evidence
    ?? [];
  return selectScenario(project, {
    id: "lawyer-assumption",
    title: "Lawyer-authored working assumption",
    description,
    assumptions: ["Lawyer-authored hypothetical; scope and commencement require legal review."],
    evidence,
    uncertainty: "HIGH",
    legalQuestions: project.comparative.scenarios[0]?.legalQuestions ?? [],
    status: "AI_GENERATED_SCENARIO",
    approvedBy: null,
    approvedAt: null,
  });
}

export function editScenario(
  project: ProjectState,
  description: string,
): ProjectState {
  if (!project.scenario) return project;
  return selectScenario(project, { ...project.scenario, description });
}

export function approveScenario(
  project: ProjectState,
  reviewer: string,
): ProjectState {
  if (!project.scenario?.description.trim() || !reviewer.trim())
    throw new Error("Select a scenario and identify the reviewer.");
  return {
    ...project,
    scenario: {
      ...project.scenario,
      description: project.scenario.description.trim(),
      status: "LAWYER_APPROVED_WORKING_ASSUMPTION",
      approvedBy: reviewer,
      approvedAt: new Date().toISOString(),
    },
  };
}
