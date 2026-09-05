"""Explicit demo fixtures. Live mode never uses these status lookups."""
from pathlib import Path
from domain import ComparativeResult, DirectResult, EvidenceReference, RemediationResult, Scenario, SeedPack

CANONICAL_DESCRIPTION = ('IF Singapore required designated social-media services to conduct and document '
    'an illegal-content risk assessment and retain it for regulatory inspection, the firm would need '
    'to incorporate the assessment and retention checks into its onboarding workflow.')

def load_seed() -> SeedPack:
    return SeedPack.model_validate_json((Path(__file__).parents[1] / 'data' / 'seed.json').read_text(encoding='utf-8'))

def evidence(sources):
    return [EvidenceReference(source_id=s.id, relevant_text=s.relevant_text,
        explanation='Curated comparative context only; the Singapore duty is a hypothetical working assumption.') for s in sources]

def demo_comparative(data):
    refs = evidence(data.sources)
    scenarios = []
    for index, (title, description) in enumerate([
        ('Designated-service assessment duty', CANONICAL_DESCRIPTION),
        ('Non-binding assessment guidance', 'IF Singapore issued non-binding guidance recommending documented illegal-content risk assessments, the firm would review its guidance without treating the recommendation as a statutory duty.'),
    ]):
        scenarios.append(Scenario(id=f'scenario-{index + 1}', title=title, description=description,
            assumptions=['Hypothetical Singapore position; scope and commencement require lawyer judgement.'],
            evidence=refs, uncertainty='HIGH', legal_questions=['Which services are covered and when would a change take effect?'],
            status='AI_GENERATED_SCENARIO', approved_by=None, approved_at=None))
    assessments = [{'jurisdiction': s.jurisdiction,
        'classification': 'FOREIGN_DEVELOPMENT' if s.jurisdiction != 'Singapore' else 'FACT',
        'relevance': 'HIGH', 'reasoning': s.relevant_text, 'evidence': [r], 'confidence': 0.85,
    } for s, r in zip(data.sources, refs)]
    return ComparativeResult(assessments=assessments, scenarios=scenarios, recommendation={
        'scenarioId': 'scenario-1',
        'rationale': 'The foreign documented-assessment model has high persuasive relevance to the supplied Singapore designated-service framework, while remaining hypothetical Singapore law.',
        'persuasiveWeight': 'HIGH',
        'evidence': [item.model_dump() for item in refs],
        'confidence': 0.82,
    })

def demo_direct(data):
    canonical = is_canonical(data)
    statuses = {'playbook': 'UPDATE_REQUIRED', 'checklist': 'UPDATE_REQUIRED', 'training': 'UNAFFECTED', 'advisory': 'REVIEW_REQUIRED', 'clauses': 'UNAFFECTED'}
    reasons = {
        'playbook': 'The synthetic instruction explicitly omits a written assessment and retention. That conflicts with the approved hypothetical duty.',
        'checklist': 'Step 6 closes onboarding without assessment documentation or retention checks required by the approved hypothetical.',
        'training': 'The text delegates to the checklist without stating its own substantive legal rule. Dependency propagation will determine inherited review.',
        'advisory': 'The recipient list spans different service categories. A lawyer must determine applicability before changing or reissuing the advisory.',
        'clauses': 'This payment-only section has no identified semantic connection to the assumed risk-assessment duty.',
    }
    return DirectResult(findings=[{'id': 'impact-' + asset.id, 'assetId': asset.id, 'section': asset.sections[0].id,
        'status': statuses.get(asset.id, 'REVIEW_REQUIRED') if canonical else 'REVIEW_REQUIRED',
        'severity': 'HIGH' if canonical and statuses.get(asset.id) == 'UPDATE_REQUIRED' else 'MEDIUM',
        'reasoning': reasons.get(asset.id, 'Unknown demo asset: review required.') if canonical else 'Edited/non-canonical scenario: deterministic demo cannot assess its semantics. Lawyer review is required; use live mode for fresh analysis.',
        'evidence': [e.model_dump() for e in evidence(data.sources)], 'confidence': 0.9 if canonical else 0.2,
    } for asset in data.firm_assets])

def demo_remediation(data):
    assets = {a.id: a for a in data.firm_assets}
    patches = []
    for finding in data.impact.findings:
        if finding.status not in ('UPDATE_REQUIRED', 'REVIEW_REQUIRED', 'DOWNSTREAM_UPDATE'):
            continue
        asset = assets[finding.asset_id]
        original = next(s.text for s in asset.sections if s.id == finding.section)
        proposal = ('IF the lawyer-approved working assumption applies, confirm service designation, obtain a '
                    'documented illegal-content risk assessment and record its retention before onboarding closes.')
        if asset.id == 'training':
            proposal = 'After approval of the checklist remediation, refresh the Step 6 exercise and answer key. Teach the assessment and retention checks conditionally under the working assumption.'
        if asset.id == 'advisory':
            proposal = 'Before reissuing this advisory, the partner must determine which recipients are covered. Present assessment and retention requirements only as conditional on the approved scenario.'
        if not is_canonical(data):
            proposal = 'Lawyer review required: assess this section against the edited working assumption before drafting replacement wording.'
        patches.append({'id': 'patch-' + asset.id, 'impactId': finding.id, 'assetId': asset.id,
            'section': finding.section, 'originalText': original, 'proposedText': proposal,
            'finalReviewedText': None, 'reasoning': finding.reasoning,
            'evidence': [e.model_dump() for e in finding.evidence], 'status': 'PENDING_REVIEW'})
    return RemediationResult(patches=patches, review_findings=[{
        'id': 'review-scope', 'assetId': data.firm_assets[3].id, 'severity': 'HIGH',
        'issue': 'The recipient designation is unknown; the supplied sources do not enact the hypothetical Singapore duty.',
        'recommendation': 'Escalate scope and commencement to the partner. Keep all proposed language conditional.',
        'evidence': [e.model_dump() for e in evidence(data.sources)],
    }], outstanding_questions=['Confirm service designation, commencement, exceptions and the exact record-retention requirement before operational use.'])

def is_canonical(data):
    seed = load_seed()
    canonical = demo_comparative(seed).scenarios[0]
    omit = {'status', 'approved_by', 'approved_at'}
    return (data.scenario.model_dump(exclude=omit) == canonical.model_dump(exclude=omit)
        and data.firm_assets == seed.firm_assets and data.sources == seed.sources)
