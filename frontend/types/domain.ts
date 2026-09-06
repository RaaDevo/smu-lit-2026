// Generated from backend/domain.py by export_types.py. Do not edit by hand.

export type LegalSource = {
  id: string;
  title: string;
  authority: string;
  jurisdiction: string;
  sourceType: "LEGISLATION" | "REGULATION" | "REGULATORY_GUIDANCE" | "GOVERNMENT_PUBLICATION" | "CONSULTATION" | "COURT_DECISION";
  legalStatus: "CURRENT_LAW" | "FOREIGN_DEVELOPMENT" | "PROPOSED_LAW" | "GUIDANCE" | "CURRENT_VERIFIED_SINGAPORE_LAW" | "SINGAPORE_PRIMARY_AUTHORITY" | "SINGAPORE_SECONDARY_MATERIAL" | "FOREIGN_COMMON_LAW_AUTHORITY" | "FOREIGN_LEGISLATION" | "FOREIGN_REGULATORY_DEVELOPMENT" | "COMPARATIVE_MATERIAL" | "INFERENCE" | "HYPOTHETICAL_SCENARIO" | "LAWYER_APPROVED_WORKING_ASSUMPTION" | "AI_RECOMMENDATION";
  url: string;
  relevantText: string;
  date: string;
  textKind: "EXCERPT" | "CURATOR_SUMMARY";
};

export type EvidenceReference = {
  sourceId: string;
  jurisdiction: string;
  sourceType: string;
  authority: string;
  legalStatus: string;
  relevantText: string;
  comparativeRelevance: "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN" | "NOT_APPLICABLE";
  explanation: string;
};

export type RegulatoryDevelopment = {
  id: string;
  title: string;
  jurisdiction: string;
  status: "FOREIGN_DEVELOPMENT" | "FOREIGN_COMMON_LAW_AUTHORITY" | "FOREIGN_LEGISLATION" | "FOREIGN_REGULATORY_DEVELOPMENT";
  date: string;
  summary: string;
  sourceIds: Array<string>;
};

export type ComparativeAssessment = {
  jurisdiction: string;
  classification: "FACT" | "FOREIGN_DEVELOPMENT" | "INFERENCE" | "CURRENT_VERIFIED_SINGAPORE_LAW" | "SINGAPORE_PRIMARY_AUTHORITY" | "SINGAPORE_SECONDARY_MATERIAL" | "FOREIGN_COMMON_LAW_AUTHORITY" | "FOREIGN_LEGISLATION" | "FOREIGN_REGULATORY_DEVELOPMENT" | "COMPARATIVE_MATERIAL" | "PROPOSED_LAW" | "HYPOTHETICAL_SCENARIO" | "LAWYER_APPROVED_WORKING_ASSUMPTION" | "AI_RECOMMENDATION";
  relevance: "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN" | "NOT_APPLICABLE";
  reasoning: string;
  evidence: Array<EvidenceReference>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type ScenarioRecommendation = {
  scenarioId: string;
  rationale: string;
  persuasiveWeight: "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN" | "NOT_APPLICABLE";
  evidence: Array<EvidenceReference>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  factorsConsidered: Array<string>;
  supportingEvidence: Array<EvidenceReference>;
  countervailingConsiderations: Array<string>;
  uncertainty: string | null;
  recommendationRationale: string;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  assumptions: Array<string>;
  evidence: Array<EvidenceReference>;
  uncertainty: "LOW" | "MEDIUM" | "HIGH";
  legalQuestions: Array<string>;
  status: "AI_GENERATED_SCENARIO" | "LAWYER_APPROVED_WORKING_ASSUMPTION" | "REJECTED";
  approvedBy: string | null;
  approvedAt: string | null;
};

export type AssetSection = {
  id: string;
  text: string;
};

export type FirmAsset = {
  id: string;
  title: string;
  type: "PLAYBOOK" | "CHECKLIST" | "TRAINING" | "ADVISORY" | "CLAUSES";
  owner: string;
  version: string;
  assumptions: Array<string>;
  sections: Array<AssetSection>;
};

export type Dependency = {
  id: string;
  upstreamAssetId: string;
  downstreamAssetId: string;
  relationship: "IMPLEMENTS" | "TEACHES" | "SUMMARISES" | "REFERENCES";
  explanation: string;
};

export type ComparativeInput = {
  development: RegulatoryDevelopment;
  sources: Array<LegalSource>;
};

export type SeedPack = {
  development: RegulatoryDevelopment;
  sources: Array<LegalSource>;
  name: string;
  evidenceNote: string;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
};

export type ComparativeResult = {
  assessments: Array<ComparativeAssessment>;
  scenarios: Array<Scenario>;
  recommendation: ScenarioRecommendation;
};

export type StressInput = {
  scenario: Scenario;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
};

export type DirectFinding = {
  id: string;
  assetId: string;
  section: string;
  status: "UNAFFECTED" | "MONITOR" | "REVIEW_REQUIRED" | "UPDATE_REQUIRED";
  severity: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  evidence: Array<EvidenceReference>;
  confidence: number;
};

export type DirectResult = {
  findings: Array<DirectFinding>;
};

export type PropagationPath = {
  rootAssetId: string;
  assetIds: Array<string>;
  dependencyIds: Array<string>;
};

export type ImpactFinding = {
  id: string;
  assetId: string;
  section: string;
  status: "UNAFFECTED" | "MONITOR" | "REVIEW_REQUIRED" | "UPDATE_REQUIRED" | "DOWNSTREAM_UPDATE";
  directStatus: "UNAFFECTED" | "MONITOR" | "REVIEW_REQUIRED" | "UPDATE_REQUIRED";
  severity: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  evidence: Array<EvidenceReference>;
  confidence: number;
  downstreamAssetIds: Array<string>;
  propagationPaths: Array<PropagationPath>;
};

export type ImpactResult = {
  contextHash: string;
  findings: Array<ImpactFinding>;
  counts: Record<"UNAFFECTED" | "MONITOR" | "REVIEW_REQUIRED" | "UPDATE_REQUIRED" | "DOWNSTREAM_UPDATE", number>;
};

export type RemediationInput = {
  scenario: Scenario;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
  impact: ImpactResult;
};

export type ProposedPatch = {
  id: string;
  impactId: string;
  assetId: string;
  section: string;
  originalText: string;
  proposedText: string;
  finalReviewedText: string | null;
  reasoning: string;
  evidence: Array<EvidenceReference>;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EDITED" | "ESCALATED";
};

export type ReviewFinding = {
  id: string;
  assetId: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  issue: string;
  recommendation: string;
  evidence: Array<EvidenceReference>;
};

export type RemediationResult = {
  patches: Array<ProposedPatch>;
  reviewFindings: Array<ReviewFinding>;
  outstandingQuestions: Array<string>;
};

export type PatchReviewInput = {
  patch: ProposedPatch;
  decision: "APPROVED" | "REJECTED" | "EDITED" | "ESCALATED";
  reviewerUid: string;
  note: string;
  finalReviewedText: string | null;
};

export type ReviewDecision = {
  id: string;
  patchId: string;
  reviewerUid: string;
  decision: "APPROVED" | "REJECTED" | "EDITED" | "ESCALATED";
  note: string;
  timestamp: string;
  finalReviewedText: string | null;
};

export type PatchReviewResult = {
  patch: ProposedPatch;
  decision: ReviewDecision;
};

export type ReportInput = {
  scenario: Scenario;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
  impact: ImpactResult;
  development: RegulatoryDevelopment;
  comparative: ComparativeResult;
  remediation: RemediationResult;
  decisions: Array<ReviewDecision>;
  twinRun: TwinRunResult | null;
};

export type ResilienceBrief = {
  title: string;
  generatedAt: string;
  development: RegulatoryDevelopment;
  scenario: Scenario;
  comparative: ComparativeResult;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
  findings: Array<ImpactFinding>;
  patches: Array<ProposedPatch>;
  decisions: Array<ReviewDecision>;
  reviewFindings: Array<ReviewFinding>;
  outstandingQuestions: Array<string>;
  requiredActions: Array<string>;
  counts: Record<"UNAFFECTED" | "MONITOR" | "REVIEW_REQUIRED" | "UPDATE_REQUIRED" | "DOWNSTREAM_UPDATE", number>;
  twinRun: TwinRunResult | null;
};

export type HealthResponse = {
  status: "ok";
  aiMode: "mock" | "live";
  requireAuth: boolean;
};

export type TriageOperationalCalibration = {
  triageCadence: string;
  informalUrgencyRule: string;
  competingWorkload: string;
  knownTriageFailure: string;
};

export type TwinCalibrationProfile = {
  id: string;
  version: string;
  label: string;
  agent: "TRIAGE" | "PRACTICE_GROUP" | "SIGN_OFF" | "CLIENT_ALERT" | "EVALUATOR";
  riskPosture: "CONSERVATIVE" | "BALANCED";
  evidenceThreshold: "SUPPLIED_SOURCE_REQUIRED" | "SIGNED_FINDING_REQUIRED";
  escalationThreshold: "LOW" | "MEDIUM" | "HIGH";
  authority: Array<string>;
  competenceBoundaries: Array<string>;
  handoffRules: Array<string>;
  operationalContext: TriageOperationalCalibration | null;
  fabricatedDataDisclaimer: string;
};

export type TriageItem = {
  assetId: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  issue: string;
  proposedOwner: string;
  evidence: Array<EvidenceReference>;
};

export type TriageAgentInput = {
  scenario: Scenario;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
  runId: string;
};

export type TriageAgentOutput = {
  items: Array<TriageItem>;
  handoffSummary: string;
  decision: string;
  latencyEstimate: string;
  latencyDriver: string;
  frictionNote: string;
  handoff: string;
  confidenceThatThisMatchesReality: "LOW" | "MEDIUM" | "HIGH";
  routedTo: string;
  urgencyLabelApplied: "LOW" | "MEDIUM" | "HIGH";
};

export type ReconsiderationRequest = {
  findingIds: Array<string>;
  reasons: Array<string>;
  requiredEvidenceOrAnalysis: Array<string>;
};

export type PracticeConflict = {
  id: string;
  assetIds: Array<string>;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidence: Array<EvidenceReference>;
};

export type PracticeGroupAgentOutput = {
  findings: Array<DirectFinding>;
  conflicts: Array<PracticeConflict>;
  ownership: Record<string, string>;
  handoffSummary: string;
};

export type PracticeGroupAgentInput = {
  scenario: Scenario;
  sources: Array<LegalSource>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
  runId: string;
  triage: TriageAgentOutput;
  reconsideration: ReconsiderationRequest | null;
};

export type SignOffAgentOutput = {
  decision: "APPROVED" | "RETURNED";
  approvedFindingIds: Array<string>;
  reconsideration: ReconsiderationRequest | null;
  unresolvedRisks: Array<string>;
  handoffSummary: string;
  formalSignOff: "COMPLETE" | "NOT_COMPLETE";
  proceduralDeviations: Array<ProceduralDeviation>;
};

export type ProceduralDeviation = {
  description: string;
  governanceRisk: string;
};

export type SignOffAgentInput = {
  runId: string;
  scenario: Scenario;
  sources: Array<LegalSource>;
  triage: TriageAgentOutput;
  practiceGroup: PracticeGroupAgentOutput;
};

export type ClientAlertAgentOutput = {
  status: "DRAFT_READY" | "HOLD_FOR_SIGN_OFF";
  headline: string;
  audience: string;
  draft: string;
  caveats: Array<string>;
  sourceFindingIds: Array<string>;
  requiresHumanPublication: true;
};

export type ClientAlertAgentInput = {
  runId: string;
  scenario: Scenario;
  signedFindings: Array<DirectFinding>;
  signOff: SignOffAgentOutput;
};

export type EvaluatorObservation = {
  id: string;
  category: "CONTRADICTION" | "UNSUPPORTED_ASSUMPTION" | "FAILED_HANDOFF" | "UNRESOLVED_RISK" | "MISSING_OWNERSHIP" | "STALE_ARTEFACT" | "DOWNSTREAM_EFFECT" | "RESILIENCE_FAILURE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  agentNames: Array<"TRIAGE" | "PRACTICE_GROUP" | "SIGN_OFF" | "CLIENT_ALERT" | "EVALUATOR">;
  assetIds: Array<string>;
  issue: string;
  recommendation: string;
  evidence: Array<EvidenceReference>;
};

export type EvaluatorAgentOutput = {
  observations: Array<EvaluatorObservation>;
  runComplete: boolean;
  summary: string;
  stageMatrix: Array<StageMatrixEntry>;
};

export type StageMatrixEntry = {
  stage: "TRIAGE" | "PRACTICE_GROUP" | "SIGN_OFF" | "CLIENT_ALERT" | "EVALUATOR";
  dimension: "TIMING" | "PROCEDURAL_COMPLIANCE" | "SUBSTANTIVE_CORRECTNESS";
  assessment: string;
  status: "NO_MATERIAL_GAP" | "MATERIAL_GAP" | "INSUFFICIENT_EVIDENCE" | "REQUIRES_LAWYER_JUDGEMENT";
  evidence: Array<EvidenceReference>;
};

export type AgentAuditRecord = {
  invocationId: string;
  sequence: number;
  agent: "TRIAGE" | "PRACTICE_GROUP" | "SIGN_OFF" | "CLIENT_ALERT" | "EVALUATOR";
  attempt: number;
  profileId: string;
  profileVersion: string;
  promptVersion: string;
  executionMode: "LIVE" | "MOCK" | "FALLBACK";
  received: Record<string, unknown>;
  produced: Record<string, unknown>;
  inputHash: string;
  outputHash: string;
  startedAt: string;
  completedAt: string;
};

export type EvaluatorAgentInput = {
  runId: string;
  scenario: Scenario;
  auditRecords: Array<AgentAuditRecord>;
  firmAssets: Array<FirmAsset>;
  dependencies: Array<Dependency>;
};

export type TwinRunResult = {
  runId: string;
  contextHash: string;
  profiles: Array<TwinCalibrationProfile>;
  triage: TriageAgentOutput;
  practiceGroupAttempts: Array<PracticeGroupAgentOutput>;
  signOffAttempts: Array<SignOffAgentOutput>;
  clientAlert: ClientAlertAgentOutput;
  evaluator: EvaluatorAgentOutput;
  impact: ImpactResult;
  auditRecords: Array<AgentAuditRecord>;
};

export type ProjectSnapshot = {
  seed: SeedPack;
  comparative: ComparativeResult | null;
  scenario: Scenario | null;
  impact: ImpactResult | null;
  remediation: RemediationResult | null;
  decisions: Array<ReviewDecision>;
  brief: ResilienceBrief | null;
  twinRun: TwinRunResult | null;
};
