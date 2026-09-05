// Generated from backend/domain.py by export_types.py. Do not edit by hand.

export type LegalSource = {
  id: string;
  title: string;
  authority: string;
  jurisdiction: "Singapore" | "United Kingdom";
  sourceType: "LEGISLATION" | "REGULATION" | "REGULATORY_GUIDANCE" | "GOVERNMENT_PUBLICATION" | "CONSULTATION" | "COURT_DECISION";
  legalStatus: "CURRENT_LAW" | "FOREIGN_DEVELOPMENT" | "PROPOSED_LAW" | "GUIDANCE";
  url: string;
  relevantText: string;
  date: string;
  textKind: "EXCERPT" | "CURATOR_SUMMARY";
};

export type EvidenceReference = {
  sourceId: string;
  relevantText: string;
  explanation: string;
};

export type RegulatoryDevelopment = {
  id: string;
  title: string;
  jurisdiction: "United Kingdom";
  status: "FOREIGN_DEVELOPMENT";
  date: string;
  summary: string;
  sourceIds: Array<string>;
};

export type ComparativeAssessment = {
  jurisdiction: "Singapore" | "United Kingdom";
  classification: "FACT" | "FOREIGN_DEVELOPMENT" | "INFERENCE";
  relevance: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  evidence: Array<EvidenceReference>;
  confidence: number;
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
};

export type HealthResponse = {
  status: "ok";
  aiMode: "mock" | "live";
  requireAuth: boolean;
};

export type ProjectSnapshot = {
  seed: SeedPack;
  comparative: ComparativeResult | null;
  scenario: Scenario | null;
  impact: ImpactResult | null;
  remediation: RemediationResult | null;
  decisions: Array<ReviewDecision>;
  brief: ResilienceBrief | null;
};
