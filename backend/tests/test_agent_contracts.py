from agents import ALL_AGENT_SPECS
from agents.shared_scaffold import compose_twin_system_prompt
from pydantic import ValidationError

from domain import (ComparativeAssessment, EvidenceReference, EvaluatorAgentOutput,
                    ScenarioRecommendation, SignOffAgentOutput)


def test_every_twin_agent_has_a_distinct_prompt_and_calibration_profile():
    assert [spec.name for spec in ALL_AGENT_SPECS] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR',
    ]
    assert len({spec.system_prompt for spec in ALL_AGENT_SPECS}) == 5
    assert len({spec.profile.id for spec in ALL_AGENT_SPECS}) == 5
    assert all(spec.profile.authority for spec in ALL_AGENT_SPECS)
    assert all(spec.profile.competence_boundaries for spec in ALL_AGENT_SPECS)
    assert all(spec.profile.handoff_rules for spec in ALL_AGENT_SPECS)


def test_triage_calibration_is_structured_and_composed_separately_from_its_role():
    triage = next(spec for spec in ALL_AGENT_SPECS if spec.name == 'TRIAGE')

    assert triage.profile.operational_context is not None
    assert triage.profile.operational_context.triage_cadence == 'NOT_CALIBRATED'
    assert triage.profile.operational_context.informal_urgency_rule == 'NOT_CALIBRATED'
    assert all(spec.profile.operational_context is not None for spec in ALL_AGENT_SPECS)
    assert triage.system_prompt == compose_twin_system_prompt(triage.role_prompt, triage.profile)


def test_comparative_contract_preserves_qualitative_weight_and_source_provenance():
    evidence = EvidenceReference(source_id='au-hc-1', jurisdiction='Australia',
        source_type='COURT_DECISION', authority='High Court of Australia',
        legal_status='FOREIGN_COMMON_LAW_AUTHORITY', relevant_text='Verified passage.',
        comparative_relevance='HIGH', explanation='Comparable doctrine, subject to Singapore authority.')
    assessment = ComparativeAssessment(jurisdiction='Australia', classification='FOREIGN_COMMON_LAW_AUTHORITY',
        relevance='HIGH', reasoning='Foreign authority is comparative material.', evidence=[evidence], confidence='MEDIUM')
    recommendation = ScenarioRecommendation(scenario_id='scenario-1',
        rationale='Stress-test the conservative scenario.', persuasive_weight='UNCERTAIN', evidence=[evidence],
        confidence='MEDIUM', factors_considered=['Court level'], supporting_evidence=[evidence],
        countervailing_considerations=['No supplied Singapore appellate authority.'],
        uncertainty='Supplied evidence is incomplete.', recommendation_rationale='It best tests the identified uncertainty.')
    assert assessment.evidence[0].authority == 'High Court of Australia'
    assert recommendation.persuasive_weight == 'UNCERTAIN'


def test_evidence_reference_rejects_missing_required_provenance():
    with __import__('pytest').raises(ValidationError):
        EvidenceReference(source_id='missing-provenance', relevant_text='Verified passage.',
            explanation='This must not be accepted without source provenance.')


def test_signoff_informal_workaround_cannot_be_formal_approval():
    result = SignOffAgentOutput(decision='RETURNED', approved_finding_ids=[], reconsideration={
        'findingIds': ['finding-1'], 'reasons': ['Formal review incomplete.'],
        'requiredEvidenceOrAnalysis': ['Obtain formal approval.'],
    }, unresolved_risks=['Formal approval remains outstanding.'], handoff_summary='Hold.',
        formal_sign_off='NOT_COMPLETE', procedural_deviations=[{
            'description': 'Relationship Partner sent an informal heads-up before formal approval.',
            'governance_risk': 'Client communication preceded formal approval.',
        }])
    assert result.formal_sign_off == 'NOT_COMPLETE'
    assert result.procedural_deviations[0].description.startswith('Relationship Partner')


def test_evaluator_requires_all_three_assessment_dimensions():
    with __import__('pytest').raises(ValidationError):
        EvaluatorAgentOutput(observations=[], run_complete=True, summary='Incomplete matrix.', stage_matrix=[{
            'stage': 'TRIAGE', 'dimension': 'TIMING', 'assessment': 'No delay identified.',
            'status': 'NO_MATERIAL_GAP', 'evidence': [],
        }])


def test_client_alert_holds_when_formal_signoff_is_not_complete():
    from services.twin_orchestrator import _client_alert
    signoff = SignOffAgentOutput.model_construct(decision='APPROVED', approved_finding_ids=[], reconsideration=None,
        unresolved_risks=[], handoff_summary='Informal only.', formal_sign_off='NOT_COMPLETE', procedural_deviations=[])
    alert = _client_alert(signoff, None)
    assert alert.status == 'HOLD_FOR_SIGN_OFF'
