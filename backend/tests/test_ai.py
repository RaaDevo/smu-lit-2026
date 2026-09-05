import json
import pytest
import httpx
from fastapi.testclient import TestClient
from config import get_settings
from main import app
from services.demo_twin import load_seed, demo_comparative

client = TestClient(app)

@pytest.fixture(autouse=True)
def live(monkeypatch):
    monkeypatch.setenv('USE_MOCK_AI', 'false')
    monkeypatch.setenv('OPENROUTER_API_KEY', 'test-placeholder')
    monkeypatch.setenv('OPENROUTER_MODEL', 'test-model-from-env')
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()

def input_data():
    seed = load_seed()
    return {'development': seed.development.model_dump(by_alias=True),
            'sources': [s.model_dump(by_alias=True) for s in seed.sources]}

def stub(monkeypatch, replies):
    async def post(self, url, **kwargs):
        assert kwargs['json']['model'] == 'test-model-from-env'
        reply = replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return httpx.Response(200, request=httpx.Request('POST', url),
            json={'choices': [{'message': {'content': json.dumps(reply)}}]})
    monkeypatch.setattr(httpx.AsyncClient, 'post', post)

@pytest.mark.parametrize('mutation', ['enum', 'confidence', 'source', 'excerpt', 'approval'])
def test_bad_output_repaired_once_then_same_public_schema(monkeypatch, mutation):
    good = demo_comparative(load_seed()).model_dump(by_alias=True)
    bad = json.loads(json.dumps(good))
    if mutation == 'enum': bad['scenarios'][0]['status'] = 'VERY_BADLY_AFFECTED'
    if mutation == 'confidence': bad['assessments'][0]['confidence'] = 1.2
    if mutation == 'source': bad['scenarios'][0]['evidence'][0]['sourceId'] = 'invented'
    if mutation == 'excerpt': bad['scenarios'][0]['evidence'][0]['relevantText'] = 'Invented passage'
    if mutation == 'approval':
        bad['scenarios'][0].update(status='LAWYER_APPROVED_WORKING_ASSUMPTION', approvedBy='AI', approvedAt='2026-09-05T00:00:00Z')
    replies = [bad, good]
    stub(monkeypatch, replies)
    response = client.post('/analyse/comparative', json=input_data())
    assert response.status_code == 200, response.text
    assert response.json() == good
    assert replies == []

def test_repair_exhaustion_is_controlled(monkeypatch):
    replies = [{}, {}]
    stub(monkeypatch, replies)
    response = client.post('/analyse/comparative', json=input_data())
    assert response.status_code == 503
    assert replies == []
    assert 'Traceback' not in response.text

def test_timeout_does_not_retry(monkeypatch):
    replies = [httpx.ReadTimeout('private provider detail')]
    stub(monkeypatch, replies)
    response = client.post('/analyse/comparative', json=input_data())
    assert response.status_code == 503
    assert 'private provider detail' not in response.text


@pytest.mark.parametrize('failure', ['http', 'network', 'invalid-json'])
def test_provider_failures_are_bounded_and_private(monkeypatch, failure):
    calls = []
    async def post(self, url, **kwargs):
        calls.append(url)
        if failure == 'network':
            raise httpx.ConnectError('private provider detail')
        return httpx.Response(401 if failure == 'http' else 200,
            request=httpx.Request('POST', url), text='private provider detail')
    monkeypatch.setattr(httpx.AsyncClient, 'post', post)
    response = client.post('/analyse/comparative', json=input_data())
    assert response.status_code == 503
    assert 'private provider detail' not in response.text
    assert len(calls) == (2 if failure == 'invalid-json' else 1)

def test_live_impact_and_remediation_use_same_validators(monkeypatch):
    from domain import StressInput, RemediationInput
    from services.demo_twin import demo_direct, demo_remediation
    from services.pipeline import context_hash
    from services.propagation import propagate
    seed = load_seed()
    scenario = demo_comparative(seed).scenarios[0].model_copy(update={
        'status':'LAWYER_APPROVED_WORKING_ASSUMPTION','approved_by':'lawyer','approved_at':'2026-09-05T12:00:00Z'})
    data = StressInput(scenario=scenario,sources=seed.sources,firm_assets=seed.firm_assets,dependencies=seed.dependencies)
    direct = demo_direct(data)
    expected = propagate(direct, data.dependencies, context_hash(data))
    remediation_input = RemediationInput(**data.model_dump(), impact=expected)
    good_remediation = demo_remediation(remediation_input)
    invalid_direct = direct.model_dump(by_alias=True)
    invalid_direct['findings'][0]['status'] = 'VERY_BADLY_AFFECTED'
    invalid_remediation = good_remediation.model_dump(by_alias=True)
    invalid_remediation['patches'][0]['originalText'] = 'Silently changed original'
    replies = [invalid_direct, direct.model_dump(by_alias=True),
               invalid_remediation, good_remediation.model_dump(by_alias=True)]
    stub(monkeypatch,replies)
    result = client.post('/analyse/stress-test',json=data.model_dump(by_alias=True))
    assert result.status_code == 200
    assert result.json() == expected.model_dump(by_alias=True)
    result = client.post('/analyse/remediation',json=remediation_input.model_dump(by_alias=True))
    assert result.status_code == 200
    assert result.json() == good_remediation.model_dump(by_alias=True)
    assert replies == []

def test_live_stage_reads_changed_corpus_without_canonical_lookup(monkeypatch):
    from domain import StressInput
    from services.demo_twin import demo_direct
    seed = load_seed()
    scenario = demo_comparative(seed).scenarios[0].model_copy(update={
        'status':'LAWYER_APPROVED_WORKING_ASSUMPTION','approved_by':'lawyer','approved_at':'2026-09-05T12:00:00Z'})
    data = StressInput(scenario=scenario,sources=seed.sources,firm_assets=seed.firm_assets,dependencies=seed.dependencies)
    output = demo_direct(data).model_dump(by_alias=True)
    data.firm_assets[4].sections[0].text = 'Changed clause now discusses assessment obligations.'
    output['findings'][4].update(status='REVIEW_REQUIRED',reasoning='Changed clause requires legal interpretation.')
    async def post(self,url,**kwargs):
        assert data.firm_assets[4].sections[0].text in kwargs['json']['messages'][1]['content']
        return httpx.Response(200,request=httpx.Request('POST',url),json={'choices':[{'message':{'content':json.dumps(output)}}]})
    monkeypatch.setattr(httpx.AsyncClient,'post',post)
    result = client.post('/analyse/stress-test',json=data.model_dump(by_alias=True))
    assert result.status_code == 200
    assert next(f for f in result.json()['findings'] if f['assetId']=='clauses')['status'] == 'REVIEW_REQUIRED'
