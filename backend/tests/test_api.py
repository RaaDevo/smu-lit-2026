from fastapi.testclient import TestClient

from config import get_settings
from main import app


client = TestClient(app)


def test_health_reports_mock_mode_by_default() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "aiMode": "mock", "requireAuth": False}


def test_seed_has_five_assets_and_explicit_dependency_direction() -> None:
    body = client.get('/seed').json()
    assert len(body['firmAssets']) == 5
    assert body['dependencies'][0]['upstreamAssetId'] == 'playbook'
    assert body['dependencies'][0]['downstreamAssetId'] == 'checklist'


def test_empty_text_is_rejected() -> None:
    response = client.post("/analyse/comparative", json={})
    assert response.status_code == 422


def test_comparative_result_names_an_evidenced_recommendation() -> None:
    seed = client.get('/seed').json()
    response = client.post('/analyse/comparative', json={
        'development': seed['development'], 'sources': seed['sources'],
    })
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['recommendation']['scenarioId'] in {item['id'] for item in body['scenarios']}
    assert body['recommendation']['persuasiveWeight'] == 'HIGH'
    assert body['recommendation']['evidence']


def test_twin_run_endpoint_returns_five_audited_agents() -> None:
    seed = client.get('/seed').json()
    comparative = client.post('/analyse/comparative', json={
        'development': seed['development'], 'sources': seed['sources'],
    }).json()
    scenario = comparative['scenarios'][0] | {
        'status': 'LAWYER_APPROVED_WORKING_ASSUMPTION',
        'approvedBy': 'lawyer', 'approvedAt': '2026-09-06T12:00:00Z',
    }
    response = client.post('/analyse/twin-run', json={
        'scenario': scenario, 'sources': seed['sources'], 'firmAssets': seed['firmAssets'],
        'dependencies': seed['dependencies'],
    })
    assert response.status_code == 200, response.text
    assert [item['agent'] for item in response.json()['auditRecords']] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR',
    ]


def test_malformed_request_is_rejected() -> None:
    response = client.post("/analyse/comparative", json={"wrong_field": "value"})
    assert response.status_code == 422


def test_live_mode_without_credentials_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setenv("USE_MOCK_AI", "false")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    get_settings.cache_clear()
    try:
        seed = client.get('/seed').json()
        response = client.post('/analyse/comparative', json={'development': seed['development'], 'sources': seed['sources']})
        assert response.status_code == 503
        assert response.json() == {
            "detail": "Live AI is enabled, but OPENROUTER_API_KEY is not configured."
        }
    finally:
        get_settings.cache_clear()
