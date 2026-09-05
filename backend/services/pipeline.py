"""Context validation and deterministic operations around the three model stages."""
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from uuid import uuid4

from domain import (ComparativeResult, DirectResult, ImpactResult, PatchReviewResult,
    ProposedPatch, RemediationResult, ResilienceBrief, ReviewDecision, StressInput)
from domain import RemediationInput, ReportInput
from services.propagation import propagate


def unique(items, name):
    ids = [item.id for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError(f'Duplicate {name} IDs.')


def check_evidence(value, sources):
    """Verify IDs and excerpts recursively, including nested stage outputs."""
    known = {s.id: s for s in sources}
    raw = value.model_dump() if hasattr(value, 'model_dump') else value
    if isinstance(raw, dict):
        if 'source_id' in raw:
            source = known.get(raw['source_id'])
            if not source or raw['relevant_text'] not in source.relevant_text:
                raise ValueError('Evidence must reference a supplied source ID and a passage from its supplied text.')
        for child in raw.values():
            check_evidence(child, sources)
    elif isinstance(raw, list):
        for child in raw:
            check_evidence(child, sources)


def validate_comparative_input(data):
    unique(data.sources, 'source')
    if {s.jurisdiction for s in data.sources} != {'Singapore', 'United Kingdom'}:
        raise ValueError('Supply curated Singapore and United Kingdom sources.')
    if not set(data.development.source_ids) <= {s.id for s in data.sources}:
        raise ValueError('Development references an unknown source.')


def validate_comparative(result, data):
    unique(result.scenarios, 'scenario')
    if {a.jurisdiction for a in result.assessments} != {'Singapore', 'United Kingdom'}:
        raise ValueError('Comparative assessment must cover both supplied jurisdictions.')
    if any(s.status != 'AI_GENERATED_SCENARIO' for s in result.scenarios):
        raise ValueError('Model-generated scenarios must remain unapproved.')
    if result.recommendation.scenario_id not in {scenario.id for scenario in result.scenarios}:
        raise ValueError('Recommendation must reference a supplied scenario.')
    check_evidence(result.recommendation, data.sources)
    check_evidence(result, data.sources)


def validate_stress_input(data):
    if data.scenario.status != 'LAWYER_APPROVED_WORKING_ASSUMPTION':
        raise ValueError('Approve one scenario as a working assumption before stress testing.')
    unique(data.sources, 'source')
    unique(data.firm_assets, 'asset')
    unique(data.dependencies, 'dependency')
    ids = {a.id for a in data.firm_assets}
    for asset in data.firm_assets:
        unique(asset.sections, 'section')
    for edge in data.dependencies:
        if edge.upstream_asset_id not in ids or edge.downstream_asset_id not in ids:
            raise ValueError('Dependency references an unknown asset.')
    check_evidence(data.scenario, data.sources)


def context_hash(data):
    payload = StressInput.model_validate({k: getattr(data, k) for k in StressInput.model_fields})
    return hashlib.sha256(json.dumps(payload.model_dump(), sort_keys=True).encode()).hexdigest()


def validate_direct(result, data):
    unique(result.findings, 'finding')
    if Counter(f.asset_id for f in result.findings) != Counter(a.id for a in data.firm_assets):
        raise ValueError('Return exactly one direct finding for each supplied asset.')
    sections = {a.id: {s.id for s in a.sections} for a in data.firm_assets}
    for finding in result.findings:
        if finding.section not in sections[finding.asset_id]:
            raise ValueError('Finding references an unknown section.')
    check_evidence(result, data.sources)


def validate_impact(data):
    validate_stress_input(data)
    if data.impact.context_hash != context_hash(data):
        raise ValueError('The scenario, assets or evidence changed. Run the stress test again.')
    # Validate findings again at the stateless boundary; do not trust client totals or graph claims.
    direct = DirectResult(findings=[{
        **{k: getattr(f, k) for k in ('id', 'asset_id', 'section', 'severity', 'reasoning', 'evidence', 'confidence')},
        'status': f.direct_status,
    } for f in data.impact.findings])
    validate_direct(direct, data)
    expected = propagate(direct, data.dependencies, context_hash(data))
    if data.impact.counts != expected.counts:
        raise ValueError('Impact counts do not match the findings.')
    for actual, calculated in zip(data.impact.findings, expected.findings):
        if (actual.status != calculated.status or actual.downstream_asset_ids != calculated.downstream_asset_ids
                or actual.propagation_paths != calculated.propagation_paths
                or actual.evidence != calculated.evidence
                or actual.severity != calculated.severity
                or actual.confidence != calculated.confidence):
            raise ValueError('Impact propagation does not match the supplied dependency graph.')


def validate_remediation(result, data):
    unique(result.patches, 'patch')
    unique(result.review_findings, 'review finding')
    actionable = {f.id: f for f in data.impact.findings if f.status in ('UPDATE_REQUIRED', 'REVIEW_REQUIRED', 'DOWNSTREAM_UPDATE')}
    if Counter(p.impact_id for p in result.patches) != Counter(actionable.keys()):
        raise ValueError('Return exactly one proposal per actionable impact.')
    assets = {a.id: a for a in data.firm_assets}
    for patch in result.patches:
        finding = actionable[patch.impact_id]
        if patch.asset_id != finding.asset_id or patch.section != finding.section:
            raise ValueError('Patch must target its finding asset and section.')
        original = next(s.text for s in assets[patch.asset_id].sections if s.id == patch.section)
        if patch.original_text != original:
            raise ValueError('Patch originalText must exactly preserve the supplied section.')
        if patch.status != 'PENDING_REVIEW' or patch.final_reviewed_text is not None:
            raise ValueError('AI proposals must await human review.')
    if any(f.asset_id not in assets for f in result.review_findings):
        raise ValueError('Reviewer finding references an unknown asset.')
    check_evidence(result, data.sources)


def review_patch(data, reviewer=None):
    final = None
    if data.decision == 'APPROVED':
        final = data.patch.proposed_text
    elif data.decision == 'EDITED':
        if not data.final_reviewed_text:
            raise ValueError('Edited decisions require final reviewed text.')
        final = data.final_reviewed_text
    decision = ReviewDecision(id=str(uuid4()), patch_id=data.patch.id,
        reviewer_uid=reviewer or data.reviewer_uid, decision=data.decision, note=data.note,
        timestamp=datetime.now(timezone.utc).isoformat(), final_reviewed_text=final)
    patch = data.patch.model_copy(update={'status': data.decision, 'final_reviewed_text': final})
    return PatchReviewResult(patch=patch, decision=decision)


def generate_brief(data):
    validate_impact(data)
    validate_comparative_input(data)
    validate_comparative(data.comparative, data)
    validate_remediation(data.remediation, data)
    unique(data.decisions, 'decision')
    patches = {p.id: p.model_copy(deep=True) for p in data.remediation.patches}
    for decision in data.decisions:
        if decision.patch_id not in patches:
            raise ValueError('Review decision references an unknown patch.')
        patch = patches[decision.patch_id]
        if decision.decision == 'EDITED' and not decision.final_reviewed_text:
            raise ValueError('Edited decision has no reviewed text.')
        if decision.decision == 'APPROVED' and decision.final_reviewed_text != patch.proposed_text:
            raise ValueError('Approval cannot silently change proposed text.')
        patch.status = decision.decision
        patch.final_reviewed_text = decision.final_reviewed_text if decision.decision in ('APPROVED', 'EDITED') else None
    owners = {a.id: a.owner for a in data.firm_assets}
    actions = [f'{owners[p.asset_id]}: {p.asset_id} / {p.section} — {p.status}. '
        + ('Reviewed proposal recorded; source document publication remains a separate human action.'
           if p.status in ('APPROVED', 'EDITED') else 'Resolve the review decision before any document publication.') for p in patches.values()]
    return ResilienceBrief(title='Regulatory Resilience Brief — hypothetical Singapore stress test',
        generated_at=datetime.now(timezone.utc).isoformat(), development=data.development,
        scenario=data.scenario, comparative=data.comparative, sources=data.sources,
        firm_assets=data.firm_assets, dependencies=data.dependencies, findings=data.impact.findings,
        patches=list(patches.values()), decisions=data.decisions,
        review_findings=data.remediation.review_findings,
        outstanding_questions=list(dict.fromkeys([
            *data.scenario.legal_questions, *data.remediation.outstanding_questions,
        ])),
        required_actions=actions, counts=data.impact.counts, twin_run=data.twin_run)


def validate_snapshot(data):
    validate_comparative_input(data.seed)
    if data.comparative:
        validate_comparative(data.comparative, data.seed)
    if data.scenario:
        if not data.comparative or data.scenario.id not in {s.id for s in data.comparative.scenarios}:
            raise ValueError('Saved scenario has no comparative origin.')
        check_evidence(data.scenario, data.seed.sources)
    if data.impact:
        if not data.scenario:
            raise ValueError('Saved impact has no approved scenario.')
        context = RemediationInput(scenario=data.scenario, sources=data.seed.sources,
            firm_assets=data.seed.firm_assets, dependencies=data.seed.dependencies, impact=data.impact)
        validate_impact(context)
        if data.remediation:
            validate_remediation(data.remediation, context)
    elif data.remediation or data.decisions or data.brief:
        raise ValueError('Saved downstream state has no impact result.')
    if data.decisions or data.brief:
        if not data.remediation:
            raise ValueError('Saved review has no remediation proposal.')
        report_input = ReportInput(**context.model_dump(), development=data.seed.development,
            comparative=data.comparative, remediation=data.remediation, decisions=data.decisions)
        rebuilt = generate_brief(report_input)
        if data.brief:
            # A saved brief is a projection of the validated inputs, not a second editable truth.
            if data.brief.model_dump(exclude={'generated_at'}) != rebuilt.model_dump(exclude={'generated_at'}):
                raise ValueError('Saved brief does not match its inputs and decisions.')
