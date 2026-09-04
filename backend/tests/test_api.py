from fastapi.testclient import TestClient

from config import get_settings
from main import app


client = TestClient(app)


def test_health_reports_mock_mode_by_default() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "ai_mode": "mock"}


def test_mock_analysis_matches_public_schema() -> None:
    response = client.post(
        "/analyse",
        json={"text": "The supplier must disclose confidential data within 10 days."},
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"summary", "risk_level", "issues"}
    assert body["risk_level"] in {"low", "medium", "high"}
    assert body["issues"]
    assert set(body["issues"][0]) == {
        "title",
        "severity",
        "explanation",
        "recommendation",
    }


def test_empty_text_is_rejected() -> None:
    response = client.post("/analyse", json={"text": "   "})
    assert response.status_code == 422
    assert response.json()["detail"] == "Text must not be empty."


def test_malformed_request_is_rejected() -> None:
    response = client.post("/analyse", json={"wrong_field": "value"})
    assert response.status_code == 422


def test_live_mode_without_credentials_returns_safe_error(monkeypatch) -> None:
    monkeypatch.setenv("USE_MOCK_AI", "false")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    get_settings.cache_clear()
    try:
        response = client.post("/analyse", json={"text": "A valid input."})
        assert response.status_code == 503
        assert response.json() == {
            "detail": "Live AI is enabled, but OPENROUTER_API_KEY is not configured."
        }
    finally:
        get_settings.cache_clear()
