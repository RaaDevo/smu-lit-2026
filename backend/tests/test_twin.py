from copy import deepcopy

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def prepare():
    seed = client.get('/seed')
    assert seed.status_code == 200
    pack = seed.json()
    response = client.post('/analyse/comparative', json={
        'development': pack['development'], 'sources': pack['sources'],
    })
    assert response.status_code == 200, response.text
    comparative = response.json()
    scenario = deepcopy(comparative['scenarios'][0])
    scenario.update(status='LAWYER_APPROVED_WORKING_ASSUMPTION',
                    approvedBy='local-lawyer', approvedAt='2026-09-05T12:00:00Z')
    return pack, comparative, {
        'scenario': scenario, 'sources': pack['sources'],
        'firmAssets': pack['firmAssets'], 'dependencies': pack['dependencies'],
    }


def test_canonical_workflow_preserves_sources_and_original_text():
    pack, comparative, payload = prepare()
    response = client.post('/analyse/stress-test', json=payload)
    assert response.status_code == 200, response.text
    impact = response.json()
    assert {f['assetId']: f['status'] for f in impact['findings']} == {
        'playbook': 'UPDATE_REQUIRED', 'checklist': 'UPDATE_REQUIRED',
        'training': 'DOWNSTREAM_UPDATE', 'advisory': 'REVIEW_REQUIRED',
        'clauses': 'UNAFFECTED',
    }
    training = next(f for f in impact['findings'] if f['assetId'] == 'training')
    assert training['directStatus'] == 'UNAFFECTED'
    assert any(p['assetIds'] == ['playbook', 'checklist', 'training'] for p in training['propagationPaths'])
    assert all(e['sourceId'] in {s['id'] for s in pack['sources']}
               for f in impact['findings'] for e in f['evidence'])
    rem = client.post('/analyse/remediation', json={**payload, 'impact': impact})
    assert rem.status_code == 200, rem.text
    remediation = rem.json()
    original = deepcopy(payload['firmAssets'])
    patch = remediation['patches'][0]
    reviewed = client.post('/reports/review-patch', json={
        'patch': patch, 'decision': 'EDITED', 'reviewerUid': 'local-lawyer',
        'note': 'Conditional wording retained.', 'finalReviewedText': 'IF the assumption applies, obtain a documented assessment.',
    })
    assert reviewed.status_code == 200, reviewed.text
    decision = reviewed.json()
    assert decision['patch']['originalText'] == patch['originalText']
    assert decision['patch']['proposedText'] == patch['proposedText']
    assert decision['patch']['finalReviewedText'] != patch['proposedText']
    report = client.post('/reports/generate', json={
        **payload, 'development': pack['development'], 'comparative': comparative,
        'impact': impact, 'remediation': remediation, 'decisions': [decision['decision']],
    })
    assert report.status_code == 200, report.text
    assert report.json()['sources'] == pack['sources']
    assert payload['firmAssets'] == original
    assert report.json()['patches'][0]['status'] == 'EDITED'
    assert set(payload['scenario']['legalQuestions']) <= set(report.json()['outstandingQuestions'])


def test_twin_backed_brief_covers_resilience_gaps_and_review_status():
    pack, comparative, payload = prepare()
    twin_run = client.post('/analyse/twin-run', json=payload)
    assert twin_run.status_code == 200, twin_run.text
    impact = twin_run.json()['impact']
    remediation = client.post('/analyse/remediation', json={**payload, 'impact': impact})
    assert remediation.status_code == 200, remediation.text

    report = client.post('/reports/generate', json={
        **payload, 'development': pack['development'], 'comparative': comparative,
        'impact': impact, 'remediation': remediation.json(), 'decisions': [],
        'twinRun': twin_run.json(),
    })

    assert report.status_code == 200, report.text
    brief = report.json()
    categories = {item['category'] for item in brief['twinRun']['evaluator']['observations']}
    assert {'STALE_ARTEFACT', 'DOWNSTREAM_EFFECT', 'CONTRADICTION', 'RESILIENCE_FAILURE'} <= categories
    assert 'ownership coverage' in brief['twinRun']['evaluator']['summary'].lower()
    assert any(action.startswith('Stale artefacts:') for action in brief['requiredActions'])
    assert any(action.startswith('Conflicts:') for action in brief['requiredActions'])
    assert any(action.startswith('Downstream dependencies:') for action in brief['requiredActions'])
    assert any(action.startswith('Ownership coverage:') for action in brief['requiredActions'])
    assert any('PENDING_REVIEW' in action for action in brief['requiredActions'])


def test_unapproved_scenario_cannot_consume_analysis():
    _, _, payload = prepare()
    payload['scenario'].update(status='AI_GENERATED_SCENARIO', approvedBy=None, approvedAt=None)
    assert client.post('/analyse/stress-test', json=payload).status_code == 422


def test_cycle_terminates_without_self_dependency():
    _, _, payload = prepare()
    payload['dependencies'].append({'id': 'cycle', 'upstreamAssetId': 'training',
        'downstreamAssetId': 'playbook', 'relationship': 'REFERENCES', 'explanation': 'Cycle test'})
    response = client.post('/analyse/stress-test', json=payload)
    assert response.status_code == 200, response.text
    for finding in response.json()['findings']:
        assert finding['assetId'] not in finding['downstreamAssetIds']


def test_unknown_source_and_stale_run_rejected():
    _, _, payload = prepare()
    bad = deepcopy(payload)
    bad['scenario']['evidence'][0]['sourceId'] = 'invented-source'
    assert client.post('/analyse/stress-test', json=bad).status_code == 422
    impact = client.post('/analyse/stress-test', json=payload).json()
    payload['scenario']['description'] += ' Scope has changed.'
    assert client.post('/analyse/remediation', json={**payload, 'impact': impact}).status_code == 422


def test_altered_corpus_is_not_reported_as_canonical_demo():
    _, _, payload = prepare()
    payload['firmAssets'][0]['sections'][0]['text'] = 'Obtain and retain a documented risk assessment before onboarding.'
    response = client.post('/analyse/stress-test', json=payload)
    assert response.status_code == 200
    assert all(f['confidence'] <= 0.2 for f in response.json()['findings'])


def test_project_snapshot_round_trip_and_tamper_rejection():
    seed, comparative, payload = prepare()
    impact = client.post('/analyse/stress-test', json=payload).json()
    remediation = client.post('/analyse/remediation', json={**payload, 'impact':impact}).json()
    snapshot = {'seed':seed,'comparative':comparative,'scenario':payload['scenario'],
        'impact':impact,'remediation':remediation,'decisions':[],'brief':None,'twinRun':None}
    restored = client.post('/reports/validate-project',json=snapshot)
    assert restored.status_code == 200, restored.text
    assert restored.json() == snapshot
    snapshot['remediation']['patches'][0]['originalText'] = 'Overwritten original'
    assert client.post('/reports/validate-project',json=snapshot).status_code == 422


def test_asset_whitespace_survives_remediation_review():
    _, _, payload = prepare()
    raw = '  Preserve this paragraph.\n\n  And its indentation.  '
    payload['firmAssets'][0]['sections'][0]['text'] = raw
    impact = client.post('/analyse/stress-test',json=payload).json()
    remediation = client.post('/analyse/remediation',json={**payload,'impact':impact}).json()
    assert remediation['patches'][0]['originalText'] == raw


def test_stronger_direct_review_survives_propagation_and_no_reverse_spread():
    _, _, payload = prepare()
    impact = client.post('/analyse/stress-test',json=payload).json()
    advisory = next(f for f in impact['findings'] if f['assetId'] == 'advisory')
    assert advisory['status'] == 'REVIEW_REQUIRED'
    assert advisory['propagationPaths'][0]['assetIds'] == ['playbook','advisory']
    assert advisory['downstreamAssetIds'] == []


def test_unknown_dependency_endpoint_rejected():
    _, _, payload = prepare()
    payload['dependencies'][0]['downstreamAssetId'] = 'missing'
    assert client.post('/analyse/stress-test',json=payload).status_code == 422


def test_accept_reject_and_escalate_preserve_original_and_proposal():
    _, _, payload = prepare()
    impact = client.post('/analyse/stress-test', json=payload).json()
    remediation = client.post('/analyse/remediation', json={**payload, 'impact':impact}).json()
    patch = remediation['patches'][0]
    for status in ('APPROVED', 'REJECTED', 'ESCALATED'):
        result = client.post('/reports/review-patch', json={
            'patch':patch, 'decision':status, 'reviewerUid':'lawyer',
            'note':'Decision test', 'finalReviewedText':None,
        })
        assert result.status_code == 200, result.text
        reviewed = result.json()['patch']
        assert reviewed['status'] == status
        assert reviewed['originalText'] == patch['originalText']
        assert reviewed['proposedText'] == patch['proposedText']
        assert reviewed['finalReviewedText'] == (patch['proposedText'] if status == 'APPROVED' else None)


def test_inherited_evidence_severity_and_confidence_cannot_be_weakened():
    _, _, payload = prepare()
    impact = client.post('/analyse/stress-test', json=payload).json()
    changes = {'evidence': [impact['findings'][2]['evidence'][0]], 'severity': 'LOW', 'confidence': 1.0}
    for field, value in changes.items():
        corrupted = deepcopy(impact)
        training = next(f for f in corrupted['findings'] if f['assetId'] == 'training')
        training[field] = value
        response = client.post('/analyse/remediation', json={**payload, 'impact':corrupted})
        assert response.status_code == 422, f'{field}: {response.text}'
