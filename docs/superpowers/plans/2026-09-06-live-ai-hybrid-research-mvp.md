# Live AI and Hybrid Legal Research MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Donna's existing five-stage regulatory-resilience workflow execute genuine, separately governed OpenRouter-backed Twin reasoning and grounded live legal-source retrieval when healthy, while retaining schema-identical deterministic fallback behavior.

**Architecture:** Keep FastAPI/Pydantic as the stateless contract boundary, the current deterministic Twin orchestrator as the sole router and loop controller, and the existing Next.js workflow as the client. Adapt the shared OpenRouter service to compose base policy, agent role, calibration profile, and runtime context explicitly; add semantic validators around every model output; and add a small allowlisted research layer that merges live official-source retrieval with the curated seed pack before comparative analysis. No agent framework, vector database, graph database, queue, or parallel product architecture is introduced.

**Tech Stack:** Python 3.12+, FastAPI 0.141.1, Pydantic 2.13.5, HTTPX 0.28.1, OpenRouter Chat Completions with strict JSON Schema, pytest 8.4.2, Next.js 16.3.4, React 19.1, TypeScript 5.8, Tailwind CSS 3.4.

**Spec:** `docs/AMENDMENTS.md`, `docs/TRD.md`, and `docs/PRD.md`, plus the approved live-AI/hybrid-research brief attached to the planning request.

## Global Constraints

- Preserve the current five-stage frontend and all existing lawyer approval, edit, reject, escalate, persistence, export, and publication safeguards.
- Keep Triage, Practice Group, Sign-off, Client Alert, and Evaluator as five distinct model calls with separate role prompts, calibration profiles, typed inputs, typed outputs, and audit records.
- Keep routing, state transitions, one-return reconsideration limit, dependency propagation, context hashing, and fallback selection in deterministic Python code.
- Never present a foreign development or AI inference as current Singapore law; preserve the existing legal-status and lawyer-approved-assumption distinctions.
- Never hardcode or commit `OPENROUTER_API_KEY`; `.env` remains ignored and all examples contain blank values.
- Live model and retrieval failures must degrade to the existing curated/deterministic path without breaking the workflow.
- Preserve exact source provenance and reject model evidence that does not resolve to supplied source IDs and supplied passages.
- Do not add LangChain, LangGraph, a vector database, a graph database, Docker, Kubernetes, queues, autonomous loops, or a new frontend framework.
- Do not modify the user's uncommitted layout work in `frontend/app/globals.css`, `frontend/components/twin/Brief.tsx`, or `frontend/components/twin/Workspace.tsx` except for narrowly scoped API wiring and provenance text required by this plan.

---

## Repository Assessment and Classification

| Classification | Component | Decision |
| --- | --- | --- |
| KEEP | `backend/domain.py` strict Pydantic/camelCase contract pattern | Extend existing models; do not create a second contract system. |
| KEEP | `backend/services/twin_orchestrator.py` deterministic sequencing and single reconsideration loop | Continue to own routing, attempt limits, propagation order, and fallback selection. |
| KEEP | Five files under `backend/agents/` | Preserve one role prompt per Twin and teammate-authored authority boundaries. |
| KEEP | `backend/data/agent_profiles.json` | Continue as firm calibration data; pass it into live calls instead of merely auditing its ID. |
| KEEP | `backend/services/propagation.py` | Remain the only dependency traversal implementation. Models never invent propagation paths. |
| KEEP | `backend/services/demo_twin.py` and `backend/data/seed.json` | Remain the deterministic demo/fallback source of schema-valid outputs. |
| KEEP | Existing routes, frontend stages, review decisions, persistence, and Brief generation | Add contracts and wiring without adding a parallel UI or replacing the flow. |
| ADAPT | `backend/services/ai_service.py` | Unify stage/agent request construction, include calibration context, run semantic validation after parsing, and expose one bounded repair path. |
| ADAPT | `backend/services/twin_orchestrator.py` | Invoke the live model once per Twin, validate each handoff, record actual timing/mode, and fall back per agent. |
| ADAPT | `backend/services/pipeline.py` | Reuse provenance checks for live research, validate every agent output, and bind remediation to the audited Twin run. |
| ADAPT | `backend/domain.py` and generated `frontend/types/domain.ts` | Add source origin/retrieval contracts and research request/result types; broaden source jurisdictions without weakening strict validation. |
| ADAPT | `backend/routes/twin.py` and `frontend/lib/api.ts` | Add one research endpoint and call it inside the existing Evidence action. |
| ADAPT | `frontend/components/twin/Evidence.tsx` and the Evidence action in `Workspace.tsx` | Surface Curated/Live provenance and merge research results without redesigning the stage. |
| REMOVE | None | Do not remove `/analyse/stress-test`, demo fixtures, or the curated seed during the hackathon MVP. |
| NEW | `backend/data/source_registry.json` | Allowlisted official-source configuration for Singapore, UK, Australia, New Zealand, and Malaysia. |
| NEW | `backend/services/research.py` | Hybrid curated-plus-live retrieval with strict host, size, content-type, timeout, and provenance controls. |
| NEW | `backend/services/agent_validation.py` | Focused semantic validators for the five typed agent handoffs. |
| NEW | `backend/tests/test_research.py` and `backend/tests/test_twin_orchestrator.py` | Contract, failure, grounding, live-call, and fallback coverage. |

### Teammate crawler assessment

No crawler/search implementation exists in the current working tree, tracked history, or visible branches. Therefore it cannot honestly be classified KEEP or ADAPT. For this repository state, classify it as **unavailable / replace with a minimal registry-backed retriever**. If the teammate later supplies code, evaluate it behind the `SourceRetriever` interface introduced in Task 5; accept it only if it passes the same allowlist, provenance, timeout, and partial-failure tests. Do not delay P0 or P1 waiting for it.

---

## P0 — Live Agent Execution and End-to-End Twin

### Task 1: Make the OpenRouter boundary compose role, calibration, and runtime context

**Files:**
- Modify: `backend/services/ai_service.py`
- Modify: `backend/config.py`
- Modify: `backend/.env.example`
- Modify: `backend/tests/test_ai.py`
- Create: `backend/tests/live_fixtures.py`

**Interfaces:**
- Consumes: agent name, stable role prompt, `TwinCalibrationProfile`, typed runtime input, output schema, and semantic validator.
- Produces: `build_messages(...) -> list[dict[str, str]]` and `run_structured(...) -> T`, using one initial response plus at most one repair.

- [ ] **Step 1: Add the shared approved-input fixture and failing prompt tests**

Create `backend/tests/live_fixtures.py`:

```python
from domain import StressInput
from services.demo_twin import demo_comparative, load_seed

def approved_stress_input() -> StressInput:
    seed = load_seed()
    scenario = demo_comparative(seed).scenarios[0].model_copy(update={
        'status': 'LAWYER_APPROVED_WORKING_ASSUMPTION',
        'approved_by': 'lawyer',
        'approved_at': '2026-09-06T12:00:00Z',
    })
    return StressInput(scenario=scenario, sources=seed.sources,
        firm_assets=seed.firm_assets, dependencies=seed.dependencies)

def approved_stress_payload() -> dict:
    return approved_stress_input().model_dump(mode='json', by_alias=True)
```

Add to `backend/tests/test_ai.py`:

```python
from agents import TRIAGE_SPEC
from domain import TriageAgentInput, TriageAgentOutput
from services.ai_service import build_messages

def test_agent_messages_separate_role_calibration_and_runtime():
    seed = load_seed()
    scenario = demo_comparative(seed).scenarios[0].model_copy(update={
        'status': 'LAWYER_APPROVED_WORKING_ASSUMPTION',
        'approved_by': 'lawyer',
        'approved_at': '2026-09-06T12:00:00Z',
    })
    value = TriageAgentInput(runId='run-test', scenario=scenario,
        sources=seed.sources, firmAssets=seed.firm_assets,
        dependencies=seed.dependencies)
    messages = build_messages(TRIAGE_SPEC.name, TRIAGE_SPEC.system_prompt,
        TRIAGE_SPEC.profile, value, TriageAgentOutput)
    assert [message['role'] for message in messages] == ['system', 'system', 'system', 'user']
    assert 'Triage Agent' in messages[1]['content']
    assert TRIAGE_SPEC.profile.id in messages[2]['content']
    assert 'run-test' in messages[3]['content']
    assert 'firmAssets' in messages[3]['content']

def test_agent_semantic_failure_gets_one_repair(monkeypatch):
    data = approved_stress_input()
    good = _triage(data).model_dump(mode='json', by_alias=True)
    bad = copy.deepcopy(good)
    bad['items'][0]['evidence'][0]['sourceId'] = 'invented'
    replies = [bad, good]
    stub(monkeypatch, replies)
    result = client.post('/analyse/twin-run', json=approved_stress_payload())
    assert result.status_code == 200
    assert replies == []
```

Import `copy`, `_triage`, `approved_stress_input`, and `approved_stress_payload` explicitly in the test file.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_ai.py -k "separate_role or semantic_failure" -v`

Expected: FAIL because `build_messages` does not exist and `run_structured` does not invoke a semantic validator during repair.

- [ ] **Step 3: Extract one message builder and strengthen `run_structured`**

Implement this interface in `backend/services/ai_service.py`:

```python
def build_messages(name: str, role_prompt: str, profile: BaseModel,
                   data: BaseModel, schema: type[BaseModel]) -> list[dict[str, str]]:
    return [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'system', 'content': f'ROLE {name}\n{role_prompt}'},
        {'role': 'system', 'content': 'FIRM CALIBRATION PROFILE\n' + profile.model_dump_json(by_alias=True)},
        {'role': 'user', 'content': 'OUTPUT JSON SCHEMA\n'
            + json.dumps(schema.model_json_schema(by_alias=True))
            + '\nRUNTIME CONTEXT\n' + data.model_dump_json(by_alias=True)},
    ]

async def run_structured(name: str, role_prompt: str, profile: BaseModel,
                         data: BaseModel, schema: type[T],
                         validate: Callable[[T, BaseModel], None]) -> T:
    ...
```

After `schema.model_validate_json(content)`, call `validate(result, data)`. Catch `ValueError` from both schema and semantic validation, append the bounded repair instruction including at most 2,500 characters of validation detail, and retry exactly once. Keep provider, timeout, and response text out of client-facing errors.

- [ ] **Step 4: Make strict-parameter routing explicit**

For `OPENROUTER_OUTPUT_MODE=json_schema`, add this request field alongside `response_format`:

```python
'provider': {'require_parameters': True}
```

Keep `json_object` as the documented compatibility fallback. Do not add OpenRouter SDK dependencies; continue using HTTPX.

- [ ] **Step 5: Document the existing fallback switch**

Add to `backend/.env.example`:

```dotenv
# If a live Twin call fails after one repair, continue with its deterministic output.
AGENT_FALLBACK_ON_ERROR=true
```

- [ ] **Step 6: Run focused AI tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_ai.py -v`

Expected: all live-call, timeout, invalid-output, prompt-layer, and repair tests pass.

- [ ] **Step 7: Commit the provider-boundary change**

```bash
git add backend/services/ai_service.py backend/config.py backend/.env.example backend/tests/test_ai.py backend/tests/live_fixtures.py
git commit -m "feat: ground live twin calls in role and calibration context"
```

### Task 2: Add semantic validation for all five Twin handoffs

**Files:**
- Create: `backend/services/agent_validation.py`
- Create: `backend/tests/test_twin_orchestrator.py`
- Modify: `backend/services/pipeline.py`

**Interfaces:**
- Consumes: each agent output plus the exact typed input that agent received.
- Produces: `validate_triage`, `validate_practice_group`, `validate_sign_off`, `validate_client_alert`, and `validate_evaluator`, each returning `None` or raising `ValueError`.

- [ ] **Step 1: Write failing validator tests**

Create `backend/tests/test_twin_orchestrator.py` with tests that mutate otherwise-valid deterministic outputs:

```python
def agent_fixtures():
    data = approved_stress_input()
    run = asyncio.run(run_twins(data))
    triage_input = TriageAgentInput(**data.model_dump(), runId=run.run_id)
    practice_input = PracticeGroupAgentInput(**data.model_dump(), runId=run.run_id,
        triage=run.triage)
    signoff_input = SignOffAgentInput(runId=run.run_id, scenario=data.scenario,
        sources=data.sources, triage=run.triage,
        practiceGroup=run.practice_group_attempts[-1])
    client_input = ClientAlertAgentInput(runId=run.run_id, scenario=data.scenario,
        signedFindings=[item for item in run.practice_group_attempts[-1].findings
            if item.id in run.sign_off_attempts[-1].approved_finding_ids],
        signOff=run.sign_off_attempts[-1])
    evaluator_input = EvaluatorAgentInput(runId=run.run_id, scenario=data.scenario,
        auditRecords=run.audit_records[:-1], firmAssets=data.firm_assets,
        dependencies=data.dependencies)
    return {
        'triage': (triage_input, run.triage.model_copy(deep=True)),
        'practice': (practice_input, run.practice_group_attempts[-1].model_copy(deep=True)),
        'signoff': (signoff_input, run.sign_off_attempts[-1].model_copy(deep=True)),
        'client': (client_input, run.client_alert.model_copy(deep=True)),
        'evaluator': (evaluator_input, run.evaluator.model_copy(deep=True)),
    }

@pytest.mark.parametrize('mutation', ['unknown_asset', 'unknown_source', 'missing_asset'])
def test_triage_rejects_invalid_grounding(mutation):
    value, output = agent_fixtures()['triage']
    if mutation == 'unknown_asset':
        output.items[0].asset_id = 'invented-asset'
    elif mutation == 'unknown_source':
        output.items[0].evidence[0].source_id = 'invented-source'
    else:
        output.items = output.items[:-1]
    with pytest.raises(ValueError):
        validate_triage(output, value)

def test_signoff_rejects_unknown_approved_finding():
    value, output = agent_fixtures()['signoff']
    output.approved_finding_ids.append('invented-finding')
    with pytest.raises(ValueError, match='approved finding'):
        validate_sign_off(output, value)

def test_client_alert_rejects_unsigned_finding_reference():
    value, output = agent_fixtures()['client']
    output.source_finding_ids.append('invented-finding')
    with pytest.raises(ValueError, match='signed finding'):
        validate_client_alert(output, value)

def test_evaluator_cannot_reference_future_or_unknown_agents():
    value, output = agent_fixtures()['evaluator']
    output.observations[0].asset_ids = ['invented-asset']
    with pytest.raises(ValueError, match='asset'):
        validate_evaluator(output, value)
```

Import the listed domain input classes, `asyncio`, `pytest`, `run_twins`, and `approved_stress_input` explicitly. The `missing_asset` assertion requires `validate_triage` to cover every firm asset, not merely reject unknown IDs.

- [ ] **Step 2: Run the new tests and verify they fail**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_twin_orchestrator.py -v`

Expected: FAIL because `services.agent_validation` and its functions do not exist.

- [ ] **Step 3: Implement exact semantic invariants**

In `backend/services/agent_validation.py`:

```python
def validate_triage(output, value):
    asset_ids = {asset.id for asset in value.firm_assets}
    if {item.asset_id for item in output.items} != asset_ids:
        raise ValueError('Triage must reference every supplied asset exactly once.')
    check_evidence(output, value.sources)

def validate_practice_group(output, value):
    validate_direct(DirectResult(findings=output.findings), value)
    asset_ids = {asset.id for asset in value.firm_assets}
    if set(output.ownership) != asset_ids:
        raise ValueError('Practice Group ownership must cover every supplied asset.')
    if any(not set(conflict.asset_ids) <= asset_ids for conflict in output.conflicts):
        raise ValueError('Practice Group conflict references an unknown asset.')
    check_evidence(output, value.sources)

def validate_sign_off(output, value):
    known = {finding.id for finding in value.practice_group.findings}
    if not set(output.approved_finding_ids) <= known:
        raise ValueError('Sign-off approved an unknown finding.')
    if output.decision == 'RETURNED' and output.reconsideration is None:
        raise ValueError('Returned Sign-off requires reconsideration instructions.')
    if output.decision == 'APPROVED' and output.reconsideration is not None:
        raise ValueError('Approved Sign-off cannot request reconsideration.')

def validate_client_alert(output, value):
    signed = {finding.id for finding in value.signed_findings}
    if not set(output.source_finding_ids) <= signed:
        raise ValueError('Client Alert references a finding not supplied by Sign-off.')
    if value.sign_off.decision != 'APPROVED' and output.status != 'HOLD_FOR_SIGN_OFF':
        raise ValueError('Client Alert must hold when Sign-off has not approved.')

def validate_evaluator(output, value):
    known_assets = {asset.id for asset in value.firm_assets}
    if any(not set(item.asset_ids) <= known_assets for item in output.observations):
        raise ValueError('Evaluator references an unknown asset.')
    check_evidence(output, sources_from_audit(value.audit_records))
```

Refactor `pipeline.check_evidence` only enough to make it importable without duplicating provenance logic. `sources_from_audit` must read the original Triage input's `sources` payload and validate it as `list[LegalSource]`; it must not trust evaluator-generated source objects.

- [ ] **Step 4: Run validator and existing pipeline tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_twin_orchestrator.py tests/test_twin.py -v`

Expected: new validator tests and all existing propagation/tamper tests pass.

- [ ] **Step 5: Commit the validator boundary**

```bash
git add backend/services/agent_validation.py backend/services/pipeline.py backend/tests/test_twin_orchestrator.py
git commit -m "feat: validate every twin agent handoff"
```

### Task 3: Wire genuine per-agent live execution with per-agent fallback audit

**Files:**
- Modify: `backend/services/twin_orchestrator.py`
- Modify: `backend/tests/test_twin_orchestrator.py`
- Modify: `backend/tests/test_api.py`

**Interfaces:**
- Consumes: Task 1 `run_structured` and Task 2 validators.
- Produces: the existing `run_twins(data: StressInput) -> TwinRunResult`, with every invocation marked `LIVE`, `MOCK`, or `FALLBACK`.

- [ ] **Step 1: Add a five-agent live-call test**

```python
def outputs_by_agent(run):
    return {
        'TRIAGE': run.triage,
        'PRACTICE_GROUP': run.practice_group_attempts[-1],
        'SIGN_OFF': run.sign_off_attempts[-1],
        'CLIENT_ALERT': run.client_alert,
        'EVALUATOR': run.evaluator,
    }

def test_live_run_calls_each_twin_separately(monkeypatch):
    data = approved_stress_input()
    monkeypatch.setenv('USE_MOCK_AI', 'true')
    get_settings.cache_clear()
    baseline = asyncio.run(run_twins(data))
    outputs = outputs_by_agent(baseline)
    monkeypatch.setenv('USE_MOCK_AI', 'false')
    get_settings.cache_clear()
    called = []
    async def fake_run(name, role_prompt, profile, data, schema, validate):
        called.append((name, profile.id, type(data).__name__, schema.__name__))
        result = outputs[name].model_copy(deep=True)
        validate(result, data)
        return result
    monkeypatch.setattr('services.twin_orchestrator.run_structured', fake_run)
    result = asyncio.run(run_twins(data))
    assert [item[0] for item in called] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'
    ]
    assert all(record.execution_mode == 'LIVE' for record in result.audit_records)
```

- [ ] **Step 2: Add parameterized per-agent fallback tests**

```python
@pytest.mark.parametrize('failed_agent', [
    'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'
])
def test_one_live_agent_failure_falls_back_and_run_completes(monkeypatch, failed_agent):
    data = approved_stress_input()
    monkeypatch.setenv('USE_MOCK_AI', 'true')
    get_settings.cache_clear()
    outputs = outputs_by_agent(asyncio.run(run_twins(data)))
    monkeypatch.setenv('USE_MOCK_AI', 'false')
    get_settings.cache_clear()
    async def fake_run(name, role_prompt, profile, value, schema, validate):
        if name == failed_agent:
            raise AIServiceError('injected provider failure')
        result = outputs[name].model_copy(deep=True)
        validate(result, value)
        return result
    monkeypatch.setattr('services.twin_orchestrator.run_structured', fake_run)
    result = asyncio.run(run_twins(data))
    fallback = [record for record in result.audit_records if record.execution_mode == 'FALLBACK']
    assert [record.agent for record in fallback] == [failed_agent]
    assert result.impact.findings
    assert result.client_alert.requires_human_publication is True
```

Import `asyncio`, `AIServiceError`, `get_settings`, `run_twins`, and `approved_stress_input`. Clear `get_settings` again in test teardown so environment state does not leak.

- [ ] **Step 3: Run focused tests and verify current failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_twin_orchestrator.py -k "calls_each or falls_back" -v`

Expected: FAIL because `_invoke` does not pass profiles or validators into `run_structured`.

- [ ] **Step 4: Adapt `_invoke` and preserve the loop limit**

Map each spec to the validator from Task 2 and call:

```python
started_at = _now()
try:
    output = fallback() if settings.use_mock_ai else await run_structured(
        spec.name, spec.system_prompt, spec.profile, value, schema, validate)
except AIServiceError:
    if not settings.agent_fallback_on_error:
        raise
    output, mode = fallback(), 'FALLBACK'
validate(output, value)
completed_at = _now()
```

Pass `started_at` and `completed_at` into `_audit`; do not synthesize identical timestamps. Keep the existing `if signoff.decision == 'RETURNED'` branch and allow exactly one Practice Group/Sign-off repeat.

- [ ] **Step 5: Confirm Evaluator sees all prior immutable audit records**

Before Evaluator invocation, deep-copy prior records into `EvaluatorAgentInput`. After the call, assert their input/output hashes still match `_hash(record.received)` and `_hash(record.produced)`. Raise a controlled `ValueError` if audit content was altered.

- [ ] **Step 6: Run P0 backend tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_ai.py tests/test_agent_contracts.py tests/test_twin_orchestrator.py tests/test_api.py tests/test_twin.py -v`

Expected: all agent identity, live-call, bounded-repair, reconsideration, fallback, audit, API, and workflow tests pass.

- [ ] **Step 7: Commit live Twin execution**

```bash
git add backend/services/twin_orchestrator.py backend/tests/test_twin_orchestrator.py backend/tests/test_api.py
git commit -m "feat: execute five live twins with deterministic fallback"
```

---

## P1 — Hybrid Legal-Source Research and Grounding

### Task 4: Extend source provenance contracts and add the official registry

**Files:**
- Modify: `backend/domain.py`
- Create: `backend/data/source_registry.json`
- Modify: `backend/data/seed.json`
- Modify: `backend/export_types.py`
- Modify: `frontend/types/domain.ts` (generated)
- Create: `backend/tests/test_research.py`

**Interfaces:**
- Produces: `SourceOrigin`, `Jurisdiction`, `SourceRegistryEntry`, `ResearchInput`, `ResearchResult`, and `LegalSource.origin`.

- [ ] **Step 1: Write failing registry and provenance tests**

```python
def test_registry_contains_only_https_official_sources():
    entries = load_registry()
    assert {entry.jurisdiction for entry in entries} == {
        'Singapore', 'United Kingdom', 'Australia', 'New Zealand', 'Malaysia'
    }
    assert all(entry.trusted for entry in entries)
    assert all(entry.base_url.startswith('https://') for entry in entries)

def test_curated_seed_sources_declare_origin():
    seed = load_seed()
    assert {source.origin for source in seed.sources} == {'CURATED'}
```

- [ ] **Step 2: Run and verify contract failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -v`

Expected: FAIL because registry models/data and `LegalSource.origin` do not exist.

- [ ] **Step 3: Add strict research models**

Add to `backend/domain.py`:

```python
Jurisdiction = Literal['Singapore', 'United Kingdom', 'Australia', 'New Zealand', 'Malaysia']
SourceOrigin = Literal['CURATED', 'LIVE']
RetrievalStrategy = Literal['DIRECT_HTML', 'DIRECT_PDF', 'CURATED_ONLY']

class SourceRegistryEntry(Model):
    id: Text
    jurisdiction: Jurisdiction
    authority: Text
    source_type: Literal['LEGISLATION', 'REGULATION', 'REGULATORY_GUIDANCE', 'GOVERNMENT_PUBLICATION']
    base_url: Annotated[str, StringConstraints(pattern=r'^https://')]
    trusted: Literal[True] = True
    retrieval_strategy: RetrievalStrategy
    topic_tags: list[Text] = Field(min_length=1)
    candidate_urls: list[Annotated[str, StringConstraints(pattern=r'^https://')]]

class ResearchInput(Model):
    development: RegulatoryDevelopment
    curated_sources: list[LegalSource] = Field(min_length=2, max_length=20)
    jurisdictions: list[Jurisdiction] = Field(min_length=2, max_length=5)
    query: Text

class ResearchResult(Model):
    sources: list[LegalSource] = Field(min_length=2, max_length=30)
    mode: Literal['LIVE', 'FALLBACK']
    warnings: list[Text]
```

Change `LegalSource.jurisdiction` to `Jurisdiction` and add `origin: SourceOrigin`. Keep `RegulatoryDevelopment` as the current UK demo development for this MVP; do not broaden the user flow in this task.

- [ ] **Step 4: Create the registry with exact official targets**

Add entries for these allowlisted authorities and base URLs:

```json
[
  {"id":"sg-imda","jurisdiction":"Singapore","authority":"Infocomm Media Development Authority","sourceType":"REGULATORY_GUIDANCE","baseUrl":"https://www.imda.gov.sg/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety","online harms"],"candidateUrls":["https://www.imda.gov.sg/Imda/regulations-and-licensing-listing/content-standards-and-classification/standards-and-classification/internet/Online%20safety"]},
  {"id":"sg-sso","jurisdiction":"Singapore","authority":"Singapore Statutes Online","sourceType":"LEGISLATION","baseUrl":"https://sso.agc.gov.sg/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety","online harms"],"candidateUrls":["https://sso.agc.gov.sg/Act/OSRAA2025"]},
  {"id":"uk-ofcom","jurisdiction":"United Kingdom","authority":"Ofcom","sourceType":"GOVERNMENT_PUBLICATION","baseUrl":"https://www.ofcom.org.uk/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety","illegal harms"],"candidateUrls":["https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcing-the-online-safety-act-scrutinising-illegal-harms-risk-assessments"]},
  {"id":"uk-legislation","jurisdiction":"United Kingdom","authority":"legislation.gov.uk","sourceType":"LEGISLATION","baseUrl":"https://www.legislation.gov.uk/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety"],"candidateUrls":["https://www.legislation.gov.uk/ukpga/2023/50/contents"]},
  {"id":"au-esafety","jurisdiction":"Australia","authority":"eSafety Commissioner","sourceType":"REGULATORY_GUIDANCE","baseUrl":"https://www.esafety.gov.au/","trusted":true,"retrievalStrategy":"CURATED_ONLY","topicTags":["online safety"],"candidateUrls":[]},
  {"id":"au-legislation","jurisdiction":"Australia","authority":"Federal Register of Legislation","sourceType":"LEGISLATION","baseUrl":"https://www.legislation.gov.au/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety"],"candidateUrls":["https://www.legislation.gov.au/C2021A00076/latest"]},
  {"id":"nz-legislation","jurisdiction":"New Zealand","authority":"New Zealand Legislation","sourceType":"LEGISLATION","baseUrl":"https://www.legislation.govt.nz/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["harmful digital communications"],"candidateUrls":["https://www.legislation.govt.nz/act/public/2015/63/en/latest/"]},
  {"id":"nz-dia","jurisdiction":"New Zealand","authority":"Department of Internal Affairs","sourceType":"GOVERNMENT_PUBLICATION","baseUrl":"https://www.dia.govt.nz/","trusted":true,"retrievalStrategy":"DIRECT_HTML","topicTags":["online safety","online harms"],"candidateUrls":["https://www.dia.govt.nz/Digital-Safety"]},
  {"id":"my-mcmc","jurisdiction":"Malaysia","authority":"Malaysian Communications and Multimedia Commission","sourceType":"REGULATORY_GUIDANCE","baseUrl":"https://www.mcmc.gov.my/","trusted":true,"retrievalStrategy":"CURATED_ONLY","topicTags":["safer internet","online safety"],"candidateUrls":[]}
]
```

Mark the two existing seed sources `origin: "CURATED"`. Do not add model-written text to the registry.

- [ ] **Step 5: Regenerate TypeScript and check drift**

Run: `cd backend; .\.venv\Scripts\python.exe export_types.py`

Run: `cd backend; .\.venv\Scripts\python.exe export_types.py --check`

Expected: PASS and `frontend/types/domain.ts` contains the exact new aliases/models.

- [ ] **Step 6: Run registry tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -v`

- [ ] **Step 7: Commit source contracts and registry**

```bash
git add backend/domain.py backend/data/source_registry.json backend/data/seed.json backend/export_types.py frontend/types/domain.ts backend/tests/test_research.py
git commit -m "feat: register trusted online harms sources with provenance"
```

### Task 5: Implement bounded hybrid retrieval with curated fallback

**Files:**
- Create: `backend/services/research.py`
- Modify: `backend/config.py`
- Modify: `backend/.env.example`
- Modify: `backend/requirements.txt`
- Modify: `backend/tests/test_research.py`

**Interfaces:**
- Produces: `SourceRetriever.fetch(entry, url) -> LegalSource | None`, `load_registry()`, and `research_sources(data: ResearchInput) -> ResearchResult`.

- [ ] **Step 1: Add failing success, security, and partial-failure tests**

```python
def research_input():
    seed = load_seed()
    return ResearchInput(development=seed.development,
        curatedSources=seed.sources,
        jurisdictions=['Singapore', 'United Kingdom'],
        query='documented illegal harms risk assessments')

def registry_entry():
    return next(entry for entry in load_registry() if entry.id == 'uk-ofcom')

def stub_official_html(monkeypatch, html):
    async def get(self, url, **kwargs):
        return httpx.Response(200, request=httpx.Request('GET', url),
            headers={'content-type': 'text/html'}, text=html)
    monkeypatch.setattr(httpx.AsyncClient, 'get', get)

def stub_timeout(monkeypatch):
    async def get(self, url, **kwargs):
        raise httpx.ReadTimeout('injected timeout')
    monkeypatch.setattr(httpx.AsyncClient, 'get', get)

async def test_live_research_merges_curated_and_live(monkeypatch):
    stub_official_html(monkeypatch, '<html><title>Official update</title><main>Online safety duties and scope.</main></html>')
    result = await research_sources(research_input())
    assert result.mode == 'LIVE'
    assert any(source.origin == 'CURATED' for source in result.sources)
    assert any(source.origin == 'LIVE' for source in result.sources)

async def test_live_failure_returns_curated_sources(monkeypatch):
    stub_timeout(monkeypatch)
    result = await research_sources(research_input())
    assert result.mode == 'FALLBACK'
    assert result.sources == research_input().curated_sources
    assert result.warnings == ['Live source retrieval was unavailable; curated sources were used.']

@pytest.mark.parametrize('url', ['http://example.com', 'https://127.0.0.1/private', 'https://evil.example/'])
async def test_retriever_rejects_non_registry_targets(url):
    with pytest.raises(ValueError, match='allowlisted'):
        await SourceRetriever().fetch(registry_entry(), url)
```

Import `httpx`, `pytest`, `ResearchInput`, `SourceRetriever`, `load_registry`, `research_sources`, and `load_seed` explicitly in `test_research.py`.

- [ ] **Step 2: Run and verify failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -k "live_research or live_failure or rejects" -v`

Expected: FAIL because the research service does not exist.

- [ ] **Step 3: Add the only new parsing dependency**

Append `beautifulsoup4==4.13.5` to `backend/requirements.txt`. Do not add browser automation, a crawler framework, or a search SDK.

- [ ] **Step 4: Implement constrained retrieval**

`SourceRetriever.fetch` must:

1. Accept URLs only from `entry.candidate_urls`.
2. Require HTTPS and a final redirect host matching the registry base host.
3. Use `httpx.AsyncClient(follow_redirects=True)` with `connect=5`, `read=8`, and total timeout `10` seconds.
4. Require `text/html` and reject bodies over `RESEARCH_MAX_BYTES=1500000`.
5. Extract `<main>` or `<article>`, falling back to `<body>`; remove `script`, `style`, `nav`, `footer`, and `form`.
6. Normalize whitespace and cap `relevant_text` at `RESEARCH_MAX_CHARS=12000`.
7. Construct IDs as `live-` plus the first 16 characters of SHA-256 over the canonical URL.
8. Set `origin='LIVE'`; never let the model assign provenance.
9. Return `None` for timeout, provider/network error, unsupported content, or unusable text; never discard curated input.

`research_sources` should fetch at most `RESEARCH_MAX_SOURCES=4` matching candidate URLs, use `asyncio.gather(..., return_exceptions=True)`, de-duplicate by canonical URL, and return curated sources first.

- [ ] **Step 5: Add configuration defaults**

In `backend/config.py`:

```python
enable_live_research: bool = False
research_timeout_seconds: float = Field(default=10, ge=1, le=15)
research_max_sources: int = Field(default=4, ge=1, le=8)
research_max_bytes: int = Field(default=1_500_000, ge=100_000, le=3_000_000)
research_max_chars: int = Field(default=12_000, ge=1_000, le=30_000)
```

Document matching uppercase variables in `.env.example`; keep live research disabled by default until tests and source review pass.

- [ ] **Step 6: Run research tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -v`

Expected: curated-only, live merge, timeout fallback, redirect-host, size, content-type, extraction, deduplication, and provenance tests pass.

- [ ] **Step 7: Commit the research service**

```bash
git add backend/services/research.py backend/config.py backend/.env.example backend/requirements.txt backend/tests/test_research.py
git commit -m "feat: add bounded hybrid official-source retrieval"
```

### Task 6: Integrate research into the existing Evidence action and comparative analysis

**Files:**
- Modify: `backend/routes/twin.py`
- Modify: `backend/tests/test_api.py`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/lib/project-state.ts`
- Modify: `frontend/tests/project.test.ts`
- Modify: `frontend/components/twin/Evidence.tsx`
- Modify: `frontend/components/twin/Workspace.tsx`

**Interfaces:**
- Produces: `POST /research/sources`, `api.researchSources(input)`, and `applyResearchResult(project, result)`.

- [ ] **Step 1: Add failing API fallback tests**

```python
def test_research_endpoint_returns_curated_pack_when_live_fetch_fails(monkeypatch):
    monkeypatch.setenv('ENABLE_LIVE_RESEARCH', 'true')
    async def fail_fetch(self, entry, url):
        return None
    monkeypatch.setattr('services.research.SourceRetriever.fetch', fail_fetch)
    seed = client.get('/seed').json()
    response = client.post('/research/sources', json={
        'development': seed['development'],
        'curatedSources': seed['sources'],
        'jurisdictions': ['Singapore', 'United Kingdom'],
        'query': 'documented illegal harms risk assessments',
    })
    assert response.status_code == 200
    assert response.json()['mode'] == 'FALLBACK'
    assert response.json()['sources'] == seed['sources']
```

- [ ] **Step 2: Add failing frontend merge tests**

```typescript
test("research merge replaces source context and clears analysis", () => {
  const result = applyResearchResult(completedProject, researchResult);
  assert.deepEqual(result.seed?.sources, researchResult.sources);
  assert.equal(result.comparative, null);
  assert.equal(result.scenario, null);
  assert.equal(result.twinRun, null);
});
```

- [ ] **Step 3: Run focused tests and verify failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_api.py -k research_endpoint -v`

Run: `cd frontend; npm.cmd test -- --test-name-pattern="research merge"`

- [ ] **Step 4: Add the protected research route**

```python
@router.post('/research/sources', response_model=ResearchResult,
             dependencies=[Depends(require_user)])
async def research(data: ResearchInput):
    return await research_sources(data)
```

Keep `GET /seed` public and deterministic. Do not perform retrieval during health checks or page load.

- [ ] **Step 5: Wire the existing Analyse button without adding UI stages**

In the existing Evidence button action:

```typescript
const research = await api.researchSources({
  development: seed.development,
  curatedSources: seed.sources,
  jurisdictions: ["Singapore", "United Kingdom"],
  query: seed.development.title,
});
const researchedProject = applyResearchResult({ ...project, seed }, research);
const comparative = await api.compare({
  development: seed.development,
  sources: research.sources,
});
setProject(applyComparativeResult(researchedProject, comparative));
setView("scenario");
```

If the research request itself returns a controlled API error, retry comparative analysis with the existing `seed.sources` and show the existing notice area: `Live source retrieval was unavailable; Donna continued with curated sources.`

- [ ] **Step 6: Surface provenance without redesigning Evidence**

In `Evidence.tsx`, append `source.origin === 'LIVE' ? 'Live retrieval' : 'Curated source'` to the existing metadata line. Do not add cards, filters, search controls, or a new page.

- [ ] **Step 7: Run API, state, and lint checks**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_api.py tests/test_research.py -v`

Run: `cd frontend; npm.cmd test`

Run: `cd frontend; npm.cmd run lint`

- [ ] **Step 8: Commit vertical research integration**

```bash
git add backend/routes/twin.py backend/tests/test_api.py frontend/lib/api.ts frontend/lib/project-state.ts frontend/tests/project.test.ts frontend/components/twin/Evidence.tsx frontend/components/twin/Workspace.tsx
git commit -m "feat: ground comparative analysis in hybrid research"
```

---

## P2 — Real Firm-Document Impact and Remediation

### Task 7: Bind remediation and the Brief to the audited live Twin run

**Files:**
- Modify: `backend/domain.py`
- Modify: `backend/services/pipeline.py`
- Modify: `backend/services/ai_service.py`
- Modify: `backend/tests/test_twin.py`
- Modify: `backend/tests/test_ai.py`
- Modify: `frontend/types/domain.ts` (generated)
- Modify: `frontend/components/twin/Workspace.tsx`

**Interfaces:**
- Consumes: existing `TwinRunResult.impact`, Evaluator observations, full firm artefact text, and lawyer-approved scenario.
- Produces: `RemediationInput.twin_run` and server-side validation that remediation derives from the same context/audit.

- [ ] **Step 1: Write failing stale/tampered Twin-run tests**

```python
def complete_twin_run():
    data = approved_stress_input()
    return data, asyncio.run(run_twins(data))

def test_remediation_requires_matching_audited_twin_run():
    data, run = complete_twin_run()
    request = RemediationInput(**data.model_dump(), impact=run.impact, twin_run=run)
    request.twin_run.context_hash = 'tampered'
    response = client.post('/analyse/remediation', json=request.model_dump(by_alias=True))
    assert response.status_code == 422

def test_live_remediation_receives_real_firm_text_and_evaluator_context(monkeypatch):
    data, run = complete_twin_run()
    captured = []
    async def post(self, url, **kwargs):
        captured.append(kwargs['json']['messages'][-1]['content'])
        output = demo_remediation(RemediationInput(**data.model_dump(),
            impact=run.impact, twinRun=run))
        return httpx.Response(200, request=httpx.Request('POST', url),
            json={'choices': [{'message': {'content': output.model_dump_json(by_alias=True)}}]})
    monkeypatch.setattr(httpx.AsyncClient, 'post', post)
    client.post('/analyse/remediation', json={
        **data.model_dump(by_alias=True),
        'impact': run.impact.model_dump(by_alias=True),
        'twinRun': run.model_dump(by_alias=True),
    })
    prompt = captured[0]
    assert data.firm_assets[0].sections[0].text in prompt
    assert run.evaluator.summary in prompt
```

Import `asyncio`, `httpx`, `RemediationInput`, `demo_remediation`, `run_twins`, and `approved_stress_input` explicitly.

- [ ] **Step 2: Run and verify failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_twin.py tests/test_ai.py -k "matching_audited or evaluator_context" -v`

- [ ] **Step 3: Extend and validate `RemediationInput`**

Add required `twin_run: TwinRunResult`. In `pipeline.validate_impact`, additionally require:

```python
if data.twin_run.context_hash != context_hash(data):
    raise ValueError('Twin run does not match the approved scenario and firm corpus.')
if data.twin_run.impact != data.impact:
    raise ValueError('Remediation impact must come from the supplied Twin run.')
validate_twin_run(data.twin_run, data)
```

`validate_twin_run` must recalculate every audit hash, validate final Practice Group findings, rerun deterministic propagation, and compare the supplied `ImpactResult` exactly.

- [ ] **Step 4: Give remediation live context without changing review authority**

Keep `STAGE_PROMPTS['remediation']`, but add these explicit instructions:

```text
Use the final Practice Group findings and deterministic impact supplied in twinRun.
Consider Evaluator observations as audit concerns, not approved legal conclusions.
Every proposal remains PENDING_REVIEW and must preserve originalText exactly.
```

The model may create only patches already permitted by `validate_remediation`; it cannot modify impact status, dependency paths, decisions, or source documents.

- [ ] **Step 5: Regenerate TypeScript and update the existing call**

Run: `cd backend; .\.venv\Scripts\python.exe export_types.py`

In `Workspace.tsx`, send:

```typescript
const remediation = await api.remediate({
  ...stressInput(),
  impact: project.twinRun!.impact,
  twinRun: project.twinRun!,
});
```

Keep the same button, view transition, and review controls.

- [ ] **Step 6: Run P2 tests**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_twin.py tests/test_ai.py tests/test_api.py -v`

Run: `cd backend; .\.venv\Scripts\python.exe export_types.py --check`

Run: `cd frontend; npm.cmd test`

- [ ] **Step 7: Commit audited remediation integration**

```bash
git add backend/domain.py backend/services/pipeline.py backend/services/ai_service.py backend/tests/test_twin.py backend/tests/test_ai.py frontend/types/domain.ts frontend/components/twin/Workspace.tsx
git commit -m "feat: derive remediation from the audited live twin run"
```

---

## P3 — Crawler/Source Expansion and Quality

### Task 8: Add an adapter seam for teammate discovery without coupling the MVP to it

**Files:**
- Modify: `backend/services/research.py`
- Modify: `backend/tests/test_research.py`
- Modify: `backend/data/source_registry.json`

**Interfaces:**
- Produces: `SourceDiscovery.discover(query, entries) -> list[str]` and a default `RegistryCandidateDiscovery` implementation.

- [ ] **Step 1: Write failing adapter-contract tests**

```python
class FailingDiscovery:
    async def discover(self, query, entries):
        raise RuntimeError('crawler unavailable')

class StaticDiscovery:
    def __init__(self, urls):
        self.urls = urls

    async def discover(self, query, entries):
        return self.urls

async def test_discovery_failure_does_not_break_curated_or_direct_retrieval():
    result = await research_sources(research_input(), discovery=FailingDiscovery())
    assert result.sources
    assert any(source.origin == 'CURATED' for source in result.sources)

async def test_discovery_urls_still_require_registry_allowlist():
    discovery = StaticDiscovery(['https://evil.example/result'])
    result = await research_sources(research_input(), discovery=discovery)
    assert all('evil.example' not in source.url for source in result.sources)
```

- [ ] **Step 2: Run and verify failures**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -k discovery -v`

- [ ] **Step 3: Implement the protocol and safe default**

```python
class SourceDiscovery(Protocol):
    async def discover(self, query: str,
                       entries: list[SourceRegistryEntry]) -> list[str]: ...

class RegistryCandidateDiscovery:
    async def discover(self, query, entries):
        terms = {term.lower() for term in query.split() if len(term) > 3}
        return [url for entry in entries
            if terms & {tag.lower() for tag in entry.topic_tags}
            for url in entry.candidate_urls]
```

Catch discovery exceptions inside `research_sources`, add one user-safe warning, and continue with curated sources and direct registry candidates.

- [ ] **Step 4: Evaluate teammate code if it becomes available**

At execution time, if crawler files are supplied, run only these acceptance tests against an adapter:

```text
1. Returns canonical HTTPS URLs only.
2. Every URL host belongs to a trusted registry entry.
3. One site timeout does not cancel other retrievals.
4. Retrieved text records title, authority, jurisdiction, URL, source type, relevant text, and LIVE origin.
5. Empty or malformed results preserve curated fallback.
```

If any check fails, keep `RegistryCandidateDiscovery` for the demo and record the crawler as deferred. Do not copy crawler parsing logic into the orchestrator or AI service.

- [ ] **Step 5: Add verified candidates incrementally**

Add only URLs manually verified in a browser and covered by a successful extraction fixture. Start with the current IMDA, Singapore Statutes Online, Ofcom, UK legislation, Australian Federal Register, New Zealand Legislation, and DIA entries. Keep MCMC and eSafety `CURATED_ONLY` until a stable target and fixture are verified.

- [ ] **Step 6: Run research regression tests and commit**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_research.py -v`

```bash
git add backend/services/research.py backend/tests/test_research.py backend/data/source_registry.json
git commit -m "feat: support pluggable safe source discovery"
```

---

## Final End-to-End Verification

### Task 9: Prove live, fallback, and demo flows through the same product path

**Files:**
- Modify: `backend/tests/test_api.py`
- Modify: `backend/tests/test_twin.py`
- Modify: `frontend/scripts/smoke.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: all P0–P3 work.
- Produces: one repeatable deterministic smoke path and one credentialed live verification procedure.

- [ ] **Step 1: Add a golden fallback workflow test**

Execute seed → failed live research → curated comparative fallback → lawyer approval → one failed live Twin agent → deterministic agent fallback → propagation → live remediation failure → deterministic remediation fallback → lawyer decision → Brief. Assert:

```python
assert result['research']['mode'] == 'FALLBACK'
assert len([r for r in run['auditRecords'] if r['executionMode'] == 'FALLBACK']) == 1
assert brief['twinRun']['clientAlert']['requiresHumanPublication'] is True
assert brief['patches'][0]['status'] in {'APPROVED', 'EDITED', 'REJECTED', 'ESCALATED', 'PENDING_REVIEW'}
```

- [ ] **Step 2: Update the browser smoke script to current control names**

Use the existing labels now rendered by the UI:

```javascript
await page.getByRole('button', { name: "Use Donna's recommendation", exact: true }).click();
await page.getByRole('button', { name: 'Approve working assumption', exact: true }).click();
await page.getByRole('button', { name: 'Run Firm and Law Firm Twins', exact: true }).click();
```

Continue through Impact, Remediation Review, and Resilience Brief; assert all five Twin names, at least one provenance label, one action decision, and `Human publication still required`.

- [ ] **Step 3: Run the complete automated suite in safe mock mode**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe export_types.py --check
cd ..\frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: zero backend failures, generated types in sync, zero frontend test/lint/build failures.

- [ ] **Step 4: Run the local deterministic browser smoke**

Start backend with `USE_MOCK_AI=true` and `ENABLE_LIVE_RESEARCH=false`, start the frontend, then run `npm.cmd run test:smoke`. Expected: all five stages complete and screenshots/export artifacts are written under ignored `.qa/`.

- [ ] **Step 5: Perform one credentialed live run**

Use a newly rotated OpenRouter key. Set `USE_MOCK_AI=false`, `ENABLE_LIVE_RESEARCH=true`, `AGENT_FALLBACK_ON_ERROR=true`, `OPENROUTER_OUTPUT_MODE=json_schema`, and an exact model slug verified to support `response_format: json_schema`. Run the canonical workflow once and confirm:

```text
Research result contains at least one LIVE source or an explicit curated fallback warning.
Comparative output recommends one evidenced scenario.
Twin audit contains five or seven records in correct sequence.
At least one agent record is LIVE.
Every fallback record is explicitly FALLBACK.
Practice Group findings cover all five actual artefacts and sections.
Evaluator identifies independent audit observations.
Remediation proposals remain PENDING_REVIEW until lawyer action.
Brief retains provenance, audit, and human-publication warnings.
```

- [ ] **Step 6: Update README operational instructions**

Document the hybrid architecture, configuration table, model compatibility check, fallback modes, source registry, crawler absence/adapter seam, and the exact live verification checklist. Remove the outdated statement that no runtime research occurs, but retain the warning that retrieved sources and AI interpretations require lawyer verification.

- [ ] **Step 7: Commit final verification and operations docs**

```bash
git add backend/tests/test_api.py backend/tests/test_twin.py frontend/scripts/smoke.mjs README.md
git commit -m "test: verify live and fallback resilience workflows"
```

---

## Required Human Setup Before the Credentialed Live Check

1. Revoke the OpenRouter key pasted into chat and create a replacement; treat the pasted key as compromised.
2. If `backend/.env` does not exist, copy `backend/.env.example` to `backend/.env`. Never overwrite an existing `.env` without reviewing it.
3. Set the replacement secret only in `backend/.env` or the backend host's secret manager:

```dotenv
USE_MOCK_AI=false
OPENROUTER_API_KEY=<new rotated key>
OPENROUTER_MODEL=<exact supported model slug>
OPENROUTER_OUTPUT_MODE=json_schema
AGENT_FALLBACK_ON_ERROR=true
ENABLE_LIVE_RESEARCH=true
```

4. Select `OPENROUTER_MODEL` from OpenRouter's model catalog and verify that `response_format`/structured outputs are listed in its supported parameters. Do not guess or use a moving alias for the judged demo.
5. Restart FastAPI after changing environment variables. `GET /health` must report `aiMode: "live"` before the credentialed run.
6. Keep a second launch profile with `USE_MOCK_AI=true` and `ENABLE_LIVE_RESEARCH=false` for the deterministic demo fallback.
7. Before deployment, configure the same variables in the backend host only. Never put `OPENROUTER_API_KEY` in a `NEXT_PUBLIC_*` variable or Vercel frontend environment.

## MVP Exit Criteria

- One healthy run produces genuine structured outputs from each of the five distinct Twins.
- One injected failure at each Twin independently falls back and still completes the product flow.
- Comparative reasoning uses only curated/live sources supplied through the research layer and preserves source provenance.
- The Practice Group reasons over full synthetic artefact text and returns exactly one validated direct finding per artefact.
- Deterministic propagation remains reproducible and cannot be model-authored or tampered with.
- Evaluator receives prior immutable audit records and produces independently validated observations.
- Remediation consumes the matching audited Twin result and cannot bypass lawyer decisions.
- The same existing five-stage UI completes in mock, live, and mixed fallback modes.
- No credential, retrieved content cache, or `.env` file is committed.
