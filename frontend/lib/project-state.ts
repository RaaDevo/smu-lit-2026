import type {
  ComparativeResult,
  ImpactResult,
  RemediationResult,
  ResilienceBrief,
  ReviewDecision,
  Scenario,
  SeedPack,
} from "../types/domain.ts";

export type ProjectState = {
  seed: SeedPack | null;
  comparative: ComparativeResult | null;
  scenario: Scenario | null;
  impact: ImpactResult | null;
  remediation: RemediationResult | null;
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
    remediation: null,
    decisions: [],
    brief: null,
  };
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
