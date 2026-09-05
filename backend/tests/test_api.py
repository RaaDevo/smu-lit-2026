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
