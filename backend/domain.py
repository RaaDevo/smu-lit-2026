"""Frozen domain contract: camelCase JSON, snake_case Python."""
from datetime import datetime
from typing import Annotated, Literal
from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints, model_validator
from pydantic.alias_generators import to_camel

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30000)]
def nonblank(value: str) -> str:
    if not value.strip():
        raise ValueError('Text cannot be blank.')
    return value

Content = Annotated[str, StringConstraints(min_length=1, max_length=30000), AfterValidator(nonblank)]
Confidence = Annotated[float, Field(ge=0, le=1)]
Severity = Literal['LOW', 'MEDIUM', 'HIGH']
ImpactStatus = Literal['UNAFFECTED', 'MONITOR', 'REVIEW_REQUIRED', 'UPDATE_REQUIRED', 'DOWNSTREAM_UPDATE']
DirectStatus = Literal['UNAFFECTED', 'MONITOR', 'REVIEW_REQUIRED', 'UPDATE_REQUIRED']
ScenarioStatus = Literal['AI_GENERATED_SCENARIO', 'LAWYER_APPROVED_WORKING_ASSUMPTION', 'REJECTED']
PatchStatus = Literal['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EDITED', 'ESCALATED']
DecisionStatus = Literal['APPROVED', 'REJECTED', 'EDITED', 'ESCALATED']

class Model(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True,
        extra='forbid', strict=True, allow_inf_nan=False)

class LegalSource(Model):
    id: Text
    title: Text
    authority: Text
    jurisdiction: Literal['Singapore', 'United Kingdom']
    source_type: Literal['LEGISLATION', 'REGULATION', 'REGULATORY_GUIDANCE', 'GOVERNMENT_PUBLICATION', 'CONSULTATION', 'COURT_DECISION']
    legal_status: Literal['CURRENT_LAW', 'FOREIGN_DEVELOPMENT', 'PROPOSED_LAW', 'GUIDANCE']
    url: Annotated[str, StringConstraints(pattern=r'^https://')]
    relevant_text: Text
    date: Text
    text_kind: Literal['EXCERPT', 'CURATOR_SUMMARY']

class EvidenceReference(Model):
    source_id: Text
    relevant_text: Text
    explanation: Text

class RegulatoryDevelopment(Model):
    id: Text
    title: Text
    jurisdiction: Literal['United Kingdom']
    status: Literal['FOREIGN_DEVELOPMENT']
    date: Text
    summary: Text
    source_ids: list[Text] = Field(min_length=1)

class ComparativeAssessment(Model):
    jurisdiction: Literal['Singapore', 'United Kingdom']
    classification: Literal['FACT', 'FOREIGN_DEVELOPMENT', 'INFERENCE']
    relevance: Severity
    reasoning: Text
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: Confidence

class ScenarioRecommendation(Model):
    scenario_id: Text
    rationale: Text
    persuasive_weight: Severity
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: Confidence

class Scenario(Model):
    id: Text
    title: Text
    description: Text
    assumptions: list[Text] = Field(min_length=1)
    evidence: list[EvidenceReference] = Field(min_length=1)
    uncertainty: Severity
    legal_questions: list[Text]
    status: ScenarioStatus
    approved_by: Text | None
    approved_at: Text | None

    @model_validator(mode='after')
    def approval_metadata(self):
        if self.status == 'LAWYER_APPROVED_WORKING_ASSUMPTION':
            if not self.approved_by or not self.approved_at:
                raise ValueError('Approval requires a reviewer and timestamp.')
            datetime.fromisoformat(self.approved_at.replace('Z', '+00:00'))
        elif self.approved_by is not None or self.approved_at is not None:
            raise ValueError('Unapproved scenarios cannot carry approval metadata.')
        return self

class AssetSection(Model):
    id: Text
    text: Content

class FirmAsset(Model):
    id: Text
    title: Text
    type: Literal['PLAYBOOK', 'CHECKLIST', 'TRAINING', 'ADVISORY', 'CLAUSES']
    owner: Text
    version: Text
    assumptions: list[Text]
    sections: list[AssetSection] = Field(min_length=1, max_length=10)

class Dependency(Model):
    id: Text
    upstream_asset_id: Text
    downstream_asset_id: Text
    relationship: Literal['IMPLEMENTS', 'TEACHES', 'SUMMARISES', 'REFERENCES']
    explanation: Text

class ComparativeInput(Model):
    development: RegulatoryDevelopment
    sources: list[LegalSource] = Field(min_length=2, max_length=20)

class SeedPack(ComparativeInput):
    name: Text
    evidence_note: Text
    firm_assets: list[FirmAsset] = Field(min_length=5, max_length=5)
    dependencies: list[Dependency] = Field(max_length=25)

class ComparativeResult(Model):
    assessments: list[ComparativeAssessment] = Field(min_length=2, max_length=4)
    scenarios: list[Scenario] = Field(min_length=1, max_length=3)
    recommendation: ScenarioRecommendation

class StressInput(Model):
    scenario: Scenario
    sources: list[LegalSource] = Field(min_length=2, max_length=20)
    firm_assets: list[FirmAsset] = Field(min_length=5, max_length=5)
    dependencies: list[Dependency] = Field(max_length=25)

class DirectFinding(Model):
    id: Text
    asset_id: Text
    section: Text
    status: DirectStatus
    severity: Severity
    reasoning: Text
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: Confidence

class DirectResult(Model):
    findings: list[DirectFinding] = Field(min_length=5, max_length=5)

class PropagationPath(Model):
    root_asset_id: Text
    asset_ids: list[Text]
    dependency_ids: list[Text]

class ImpactFinding(Model):
    id: Text
    asset_id: Text
    section: Text
    status: ImpactStatus
    direct_status: DirectStatus
    severity: Severity
    reasoning: Text
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: Confidence
    downstream_asset_ids: list[Text]
    propagation_paths: list[PropagationPath]

class ImpactResult(Model):
    context_hash: Text
    findings: list[ImpactFinding] = Field(min_length=5, max_length=5)
    counts: dict[ImpactStatus, int]

class RemediationInput(StressInput):
    impact: ImpactResult

class ProposedPatch(Model):
    id: Text
    impact_id: Text
    asset_id: Text
    section: Text
    original_text: Content
    proposed_text: Content
    final_reviewed_text: Content | None
    reasoning: Text
    evidence: list[EvidenceReference] = Field(min_length=1)
    status: PatchStatus

class ReviewFinding(Model):
    id: Text
    asset_id: Text
    severity: Severity
    issue: Text
    recommendation: Text
    evidence: list[EvidenceReference] = Field(min_length=1)

class RemediationResult(Model):
    patches: list[ProposedPatch] = Field(max_length=5)
    review_findings: list[ReviewFinding]
    outstanding_questions: list[Text]

class PatchReviewInput(Model):
    patch: ProposedPatch
    decision: DecisionStatus
    reviewer_uid: Text
    note: str = Field(max_length=10000)
    final_reviewed_text: Content | None

class ReviewDecision(Model):
    id: Text
    patch_id: Text
    reviewer_uid: Text
    decision: DecisionStatus
    note: str
    timestamp: Text
    final_reviewed_text: Content | None

class PatchReviewResult(Model):
    patch: ProposedPatch
    decision: ReviewDecision

class ReportInput(RemediationInput):
    development: RegulatoryDevelopment
    comparative: ComparativeResult
    remediation: RemediationResult
    decisions: list[ReviewDecision] = Field(max_length=100)
    twin_run: 'TwinRunResult | None' = None

class ResilienceBrief(Model):
    title: Text
    generated_at: Text
    development: RegulatoryDevelopment
    scenario: Scenario
    comparative: ComparativeResult
    sources: list[LegalSource]
    firm_assets: list[FirmAsset]
    dependencies: list[Dependency]
    findings: list[ImpactFinding]
    patches: list[ProposedPatch]
    decisions: list[ReviewDecision]
    review_findings: list[ReviewFinding]
    outstanding_questions: list[Text]
    required_actions: list[Text]
    counts: dict[ImpactStatus, int]
    twin_run: 'TwinRunResult | None' = None

class HealthResponse(Model):
    status: Literal['ok'] = 'ok'
    ai_mode: Literal['mock', 'live']
    require_auth: bool

AgentName = Literal['TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR']


class TriageOperationalCalibration(Model):
    triage_cadence: Text
    informal_urgency_rule: Text
    competing_workload: Text
    known_triage_failure: Text


class TwinCalibrationProfile(Model):
    id: Text
    version: Text
    label: Text
    agent: AgentName
    risk_posture: Literal['CONSERVATIVE', 'BALANCED']
    evidence_threshold: Literal['SUPPLIED_SOURCE_REQUIRED', 'SIGNED_FINDING_REQUIRED']
    escalation_threshold: Severity
    authority: list[Text] = Field(min_length=1)
    competence_boundaries: list[Text] = Field(min_length=1)
    handoff_rules: list[Text] = Field(min_length=1)
    operational_context: TriageOperationalCalibration | None = None

    @model_validator(mode='after')
    def operational_context_matches_agent(self):
        if self.agent == 'TRIAGE' and self.operational_context is None:
            raise ValueError('Triage requires operational calibration configuration.')
        if self.agent != 'TRIAGE' and self.operational_context is not None:
            raise ValueError('Operational calibration is currently defined only for Triage.')
        return self

class TriageItem(Model):
    asset_id: Text
    priority: Severity
    issue: Text
    proposed_owner: Text
    evidence: list[EvidenceReference] = Field(min_length=1)

class TriageAgentInput(StressInput):
    run_id: Text

class TriageAgentOutput(Model):
    items: list[TriageItem] = Field(min_length=1)
    handoff_summary: Text
    decision: Text
    latency_estimate: Text
    latency_driver: Text
    friction_note: Text
    handoff: Text
    confidence_that_this_matches_reality: Literal['LOW', 'MEDIUM', 'HIGH']
    routed_to: Text
    urgency_label_applied: Severity

class ReconsiderationRequest(Model):
    finding_ids: list[Text] = Field(min_length=1)
    reasons: list[Text] = Field(min_length=1)
    required_evidence_or_analysis: list[Text] = Field(min_length=1)

class PracticeConflict(Model):
    id: Text
    asset_ids: list[Text] = Field(min_length=1)
    issue: Text
    severity: Severity
    evidence: list[EvidenceReference] = Field(min_length=1)

class PracticeGroupAgentOutput(Model):
    findings: list[DirectFinding] = Field(min_length=5, max_length=5)
    conflicts: list[PracticeConflict]
    ownership: dict[str, Text]
    handoff_summary: Text

class PracticeGroupAgentInput(StressInput):
    run_id: Text
    triage: TriageAgentOutput
    reconsideration: ReconsiderationRequest | None = None

class SignOffAgentOutput(Model):
    decision: Literal['APPROVED', 'RETURNED']
    approved_finding_ids: list[Text]
    reconsideration: ReconsiderationRequest | None
    unresolved_risks: list[Text]
    handoff_summary: Text

class SignOffAgentInput(Model):
    run_id: Text
    scenario: Scenario
    sources: list[LegalSource] = Field(min_length=2)
    triage: TriageAgentOutput
    practice_group: PracticeGroupAgentOutput

class ClientAlertAgentOutput(Model):
    status: Literal['DRAFT_READY', 'HOLD_FOR_SIGN_OFF']
    headline: Text
    audience: Text
    draft: Text
    caveats: list[Text] = Field(min_length=1)
    source_finding_ids: list[Text]
    requires_human_publication: Literal[True] = True

class ClientAlertAgentInput(Model):
    run_id: Text
    scenario: Scenario
    signed_findings: list[DirectFinding]
    sign_off: SignOffAgentOutput

class EvaluatorObservation(Model):
    id: Text
    category: Literal['CONTRADICTION', 'UNSUPPORTED_ASSUMPTION', 'FAILED_HANDOFF', 'UNRESOLVED_RISK', 'MISSING_OWNERSHIP', 'STALE_ARTEFACT', 'DOWNSTREAM_EFFECT', 'RESILIENCE_FAILURE']
    severity: Severity
    agent_names: list[AgentName]
    asset_ids: list[Text]
    issue: Text
    recommendation: Text
    evidence: list[EvidenceReference]

class EvaluatorAgentOutput(Model):
    observations: list[EvaluatorObservation]
    run_complete: bool
    summary: Text

class AgentAuditRecord(Model):
    invocation_id: Text
    sequence: Annotated[int, Field(ge=1)]
    agent: AgentName
    attempt: Annotated[int, Field(ge=1, le=2)]
    profile_id: Text
    profile_version: Text
    prompt_version: Text
    execution_mode: Literal['LIVE', 'MOCK', 'FALLBACK']
    received: dict[str, object]
    produced: dict[str, object]
    input_hash: Text
    output_hash: Text
    started_at: Text
    completed_at: Text

class EvaluatorAgentInput(Model):
    run_id: Text
    scenario: Scenario
    audit_records: list[AgentAuditRecord] = Field(min_length=4)
    firm_assets: list[FirmAsset] = Field(min_length=5, max_length=5)
    dependencies: list[Dependency]

class TwinRunResult(Model):
    run_id: Text
    context_hash: Text
    profiles: list[TwinCalibrationProfile] = Field(min_length=5, max_length=5)
    triage: TriageAgentOutput
    practice_group_attempts: list[PracticeGroupAgentOutput] = Field(min_length=1, max_length=2)
    sign_off_attempts: list[SignOffAgentOutput] = Field(min_length=1, max_length=2)
    client_alert: ClientAlertAgentOutput
    evaluator: EvaluatorAgentOutput
    impact: ImpactResult
    audit_records: list[AgentAuditRecord] = Field(min_length=5, max_length=7)

class ProjectSnapshot(Model):
    seed: SeedPack
    comparative: ComparativeResult | None
    scenario: Scenario | None
    impact: ImpactResult | None
    remediation: RemediationResult | None
    decisions: list[ReviewDecision] = Field(max_length=100)
    brief: ResilienceBrief | None
    twin_run: 'TwinRunResult | None' = None
