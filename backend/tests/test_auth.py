import pytest
from fastapi.testclient import TestClient
from config import get_settings, Settings
from main import app
import time
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
import auth

client = TestClient(app)

@pytest.mark.parametrize('path', ['/analyse/comparative', '/analyse/stress-test', '/analyse/remediation', '/reports/generate', '/reports/review-patch', '/reports/validate-project'])
def test_missing_token_rejected_before_model_work(monkeypatch, path):
    monkeypatch.setenv('REQUIRE_AUTH', 'true')
    get_settings.cache_clear()
    assert client.post(path, json={}).status_code == 401

def test_invalid_token_rejected(monkeypatch):
    monkeypatch.setenv('REQUIRE_AUTH', 'true')
    get_settings.cache_clear()
    assert client.post('/analyse/comparative', json={}, headers={'Authorization':'Bearer invalid'}).status_code == 401

def test_production_cannot_start_unprotected():
    with pytest.raises(ValueError):
        Settings(app_env='production', require_auth=False, _env_file=None)

@pytest.fixture
def signed_token(monkeypatch):
    # Ephemeral test-only RSA key; not a Firebase service-account key, never written to disk.
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(auth, 'signing_key', lambda kid: key.public_key())
    monkeypatch.setenv('REQUIRE_AUTH', 'true')
    get_settings.cache_clear()
    now = int(time.time())
    claims = {'sub':'verified-lawyer', 'aud':'lit2026', 'iss':'https://securetoken.google.com/lit2026',
              'iat':now-2, 'exp':now+300, 'auth_time':now-60}
    return key, claims

def test_valid_signed_token_processes_analysis(signed_token):
    key, claims = signed_token
    token = jwt.encode(claims, key, algorithm='RS256', headers={'kid':'test'})
    seed = client.get('/seed').json()
    response = client.post('/analyse/comparative', json={'development':seed['development'],'sources':seed['sources']},
        headers={'Authorization':'Bearer ' + token})
    assert response.status_code == 200
    assert response.json()['scenarios'][0]['status'] == 'AI_GENERATED_SCENARIO'

@pytest.mark.parametrize('change', [
    {'exp':1}, {'aud':'another-project'}, {'iss':'https://example.com'}, {'sub':''},
    {'auth_time':9999999999}, {'iat':9999999999},
])
def test_invalid_signed_claims_rejected(signed_token, change):
    key, claims = signed_token
    token = jwt.encode({**claims, **change}, key, algorithm='RS256', headers={'kid':'test'})
    assert client.post('/analyse/comparative',json={},headers={'Authorization':'Bearer '+token}).status_code == 401

def test_wrong_signature_rejected(signed_token):
    _, claims = signed_token
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = jwt.encode(claims, other, algorithm='RS256', headers={'kid':'test'})
    assert client.post('/analyse/comparative',json={},headers={'Authorization':'Bearer '+token}).status_code == 401
