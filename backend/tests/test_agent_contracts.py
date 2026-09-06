from agents import ALL_AGENT_SPECS
from agents.shared_scaffold import compose_twin_system_prompt


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
    assert all(spec.profile.operational_context is None for spec in ALL_AGENT_SPECS if spec.name != 'TRIAGE')
    assert triage.system_prompt == compose_twin_system_prompt(triage.role_prompt, triage.profile)
