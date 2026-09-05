"""Deterministic routing for five distinct professional-reasoning agents."""
import hashlib
import json
from datetime import datetime, timezone
from typing import Callable, TypeVar

from pydantic import BaseModel

from agents import TRIAGE_SPEC, PRACTICE_GROUP_SPEC, SIGN_OFF_SPEC, CLIENT_ALERT_SPEC, EVALUATOR_SPEC
from config import get_settings
from domain import (AgentAuditRecord, ClientAlertAgentInput, ClientAlertAgentOutput, DirectResult, EvaluatorAgentInput,
    EvaluatorAgentOutput, PracticeGroupAgentInput, PracticeGroupAgentOutput,
    SignOffAgentInput, SignOffAgentOutput, StressInput, TriageAgentInput,
    TriageAgentOutput, TwinRunResult)
from services.ai_service import AIServiceError, run_structured
from services.demo_twin import demo_direct, evidence
from services.pipeline import context_hash, validate_direct
from services.propagation import propagate

T = TypeVar('T', bound=BaseModel)

def _payload(value: BaseModel) -> dict[str, object]:
    return value.model_dump(mode='json', by_alias=True)

def _hash(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _audit(spec, value: BaseModel, output: BaseModel, run_id: str, sequence: int, attempt: int, mode: str) -> AgentAuditRecord:
    received, produced = _payload(value), _payload(output)
    stamp = _now()
    return AgentAuditRecord(invocation_id=f'{run_id}-{spec.name.lower()}-{attempt}', sequence=sequence,
        agent=spec.name, attempt=attempt, profile_id=spec.profile.id, profile_version=spec.profile.version,
        prompt_version=spec.prompt_version, execution_mode=mode, received=received, produced=produced,
        input_hash=_hash(received), output_hash=_hash(produced), started_at=stamp, completed_at=stamp)

async def _invoke(spec, value: BaseModel, schema: type[T], fallback: Callable[[], T], run_id: str, sequence: int, attempt: int) -> tuple[T, AgentAuditRecord]:
    settings = get_settings()
    mode = 'MOCK' if settings.use_mock_ai else 'LIVE'
    try:
        output = fallback() if settings.use_mock_ai else await run_structured(spec.name.lower(), spec.system_prompt, value, schema)
        output = schema.model_validate(output)
    except AIServiceError:
        if not settings.agent_fallback_on_error:
            raise
        output, mode = fallback(), 'FALLBACK'
    return output, _audit(spec, value, output, run_id, sequence, attempt, mode)

def _triage(data: StressInput) -> TriageAgentOutput:
    refs = evidence(data.sources)
    return TriageAgentOutput(items=[{'assetId': asset.id, 'priority': 'HIGH',
        'issue': f'Assess {asset.title} against the approved hypothetical.', 'proposedOwner': asset.owner,
        'evidence': [item.model_dump() for item in refs]} for asset in data.firm_assets],
        handoffSummary='Every supplied artefact was routed to the Practice Group Twin with curated source context.')

def _practice(data: StressInput, triage: TriageAgentOutput, reconsideration=None) -> PracticeGroupAgentOutput:
    direct = demo_direct(data)
    refs = evidence(data.sources)
    return PracticeGroupAgentOutput(findings=direct.findings, conflicts=[{
        'id': 'conflict-playbook-checklist', 'assetIds': ['playbook', 'checklist'], 'severity': 'HIGH',
        'issue': 'The checklist implements the playbook omission, creating a direct operating conflict.',
        'evidence': [item.model_dump() for item in refs],
    }], ownership={asset.id: asset.owner for asset in data.firm_assets},
        handoffSummary='Practice Group findings cover every supplied artefact and are ready for independent Sign-off.')

def _signoff(practice: PracticeGroupAgentOutput) -> SignOffAgentOutput:
    return SignOffAgentOutput(decision='APPROVED', approved_finding_ids=[item.id for item in practice.findings],
        reconsideration=None, unresolved_risks=['Scope and commencement remain subject to lawyer review.'],
        handoff_summary='Findings are conditionally suitable for internal client-alert drafting and remediation review.')

def _client_alert(signoff: SignOffAgentOutput, practice: PracticeGroupAgentOutput) -> ClientAlertAgentOutput:
    ready = signoff.decision == 'APPROVED'
    return ClientAlertAgentOutput(status='DRAFT_READY' if ready else 'HOLD_FOR_SIGN_OFF',
        headline='Conditional online-safety onboarding review', audience='Internal client-alert review',
        draft=('If the lawyer-approved working assumption applies, designated-service clients may require documented illegal-content risk assessments and retention checks. This is a draft for lawyer review, not publication.' if ready else 'Hold: Sign-off has not approved the findings.'),
        caveats=['This draft does not state current Singapore law.', 'Human publication is still required.'],
        source_finding_ids=signoff.approved_finding_ids if ready else [], requires_human_publication=True)

def _evaluator(data: StressInput, impact, audit: list[AgentAuditRecord]) -> EvaluatorAgentOutput:
    refs = evidence(data.sources)
    stale = [finding.asset_id for finding in impact.findings if finding.status in ('UPDATE_REQUIRED', 'DOWNSTREAM_UPDATE')]
    observations = [{
        'id': 'evaluator-stale-assets', 'category': 'STALE_ARTEFACT', 'severity': 'HIGH',
        'agentNames': ['PRACTICE_GROUP', 'SIGN_OFF'], 'assetIds': stale,
        'issue': 'Practice Group findings and deterministic dependency traversal identify stale internal artefacts.',
        'recommendation': 'Route each stale artefact through remediation and lawyer review.',
        'evidence': [item.model_dump() for item in refs],
    }, {
        'id': 'evaluator-downstream', 'category': 'DOWNSTREAM_EFFECT', 'severity': 'MEDIUM',
        'agentNames': ['PRACTICE_GROUP', 'EVALUATOR'], 'assetIds': ['training'],
        'issue': 'Training inherits an upstream checklist dependency effect.',
        'recommendation': 'Refresh training only after the checklist remediation is resolved.',
        'evidence': [item.model_dump() for item in refs],
    }]
    return EvaluatorAgentOutput(observations=observations, run_complete=len(audit) >= 4,
        summary='Evaluator reviewed the handoffs, stale artefacts, downstream dependency effects, and unresolved legal scope.')

async def run_twins(data: StressInput) -> TwinRunResult:
    run_hash = context_hash(data)
    run_id = f'run-{run_hash[:12]}'
    audit: list[AgentAuditRecord] = []
    triage_input = TriageAgentInput(**data.model_dump(), run_id=run_id)
    triage, record = await _invoke(TRIAGE_SPEC, triage_input, TriageAgentOutput, lambda: _triage(data), run_id, 1, 1); audit.append(record)
    practice_input = PracticeGroupAgentInput(**data.model_dump(), run_id=run_id, triage=triage)
    practice, record = await _invoke(PRACTICE_GROUP_SPEC, practice_input, PracticeGroupAgentOutput, lambda: _practice(data, triage), run_id, 2, 1); audit.append(record)
    signoff_input = SignOffAgentInput(run_id=run_id, scenario=data.scenario, sources=data.sources, triage=triage, practice_group=practice)
    signoff, record = await _invoke(SIGN_OFF_SPEC, signoff_input, SignOffAgentOutput, lambda: _signoff(practice), run_id, 3, 1); audit.append(record)
    client_input = ClientAlertAgentInput(run_id=run_id, scenario=data.scenario,
        signed_findings=[item for item in practice.findings if item.id in signoff.approved_finding_ids], sign_off=signoff)
    client_alert, record = await _invoke(CLIENT_ALERT_SPEC, client_input, ClientAlertAgentOutput, lambda: _client_alert(signoff, practice), run_id, 4, 1); audit.append(record)
    direct = DirectResult(findings=practice.findings)
    validate_direct(direct, data)
    impact = propagate(direct, data.dependencies, run_hash)
    evaluator_output = _evaluator(data, impact, audit)
    evaluator_input = EvaluatorAgentInput(run_id=run_id, scenario=data.scenario,
        audit_records=audit, firm_assets=data.firm_assets, dependencies=data.dependencies)
    evaluator, record = await _invoke(EVALUATOR_SPEC, evaluator_input, EvaluatorAgentOutput, lambda: evaluator_output, run_id, 5, 1); audit.append(record)
    return TwinRunResult(run_id=run_id, context_hash=run_hash,
        profiles=[spec.profile for spec in (TRIAGE_SPEC, PRACTICE_GROUP_SPEC, SIGN_OFF_SPEC, CLIENT_ALERT_SPEC, EVALUATOR_SPEC)],
        triage=triage, practice_group_attempts=[practice], sign_off_attempts=[signoff], client_alert=client_alert,
        evaluator=evaluator, impact=impact, audit_records=audit)
