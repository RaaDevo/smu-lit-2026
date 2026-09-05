from agents import ALL_AGENT_SPECS


def test_every_twin_agent_has_a_distinct_prompt_and_calibration_profile():
    assert [spec.name for spec in ALL_AGENT_SPECS] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR',
    ]
    assert len({spec.system_prompt for spec in ALL_AGENT_SPECS}) == 5
    assert len({spec.profile.id for spec in ALL_AGENT_SPECS}) == 5
    assert all(spec.profile.authority for spec in ALL_AGENT_SPECS)
    assert all(spec.profile.competence_boundaries for spec in ALL_AGENT_SPECS)
    assert all(spec.profile.handoff_rules for spec in ALL_AGENT_SPECS)
