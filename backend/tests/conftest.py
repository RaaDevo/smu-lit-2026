import pytest
from config import get_settings

@pytest.fixture(autouse=True)
def isolate_configuration(monkeypatch):
    monkeypatch.setenv('USE_MOCK_AI', 'true')
    monkeypatch.setenv('REQUIRE_AUTH', 'false')
    monkeypatch.setenv('APP_ENV', 'development')
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
