# Law Firm Twin Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Donna’s existing regulatory-resilience workflow with an AI-recommended Singapore working assumption and five auditable, genuinely distinct Law Firm Twin agents, while retaining deterministic orchestration, dependency propagation, human review, and a reliable end-to-end demo fallback.

**Architecture:** Keep the current FastAPI → Pydantic → generated TypeScript → Next.js architecture and the existing five frontend stages. Add a typed `TwinRunResult` produced by a deterministic orchestrator that invokes Triage, Practice Group, Sign-off, Client Alert, and Evaluator through separate prompt/profile/schema boundaries; only the agents perform professional reasoning, while code controls routing, one bounded reconsideration, validation, graph traversal, persistence, and fallback selection. Preserve the existing Impact Map, remediation review, and Brief as projections of validated run state.

**Tech Stack:** Python 3, FastAPI, Pydantic v2, httpx/OpenRouter, pytest, Next.js 16 App Router, React, TypeScript, Tailwind CSS, Node test runner, Firebase snapshot persistence.

**Spec:** This document’s “Fixed Requirements and Flow” section is the implementation spec and must travel with the plan.

## Global Constraints

- Preserve the current five-stage UI shell and existing legal-review workflow.
- Implement Triage, Practice Group, Sign-off, Client Alert, and Evaluator as distinct AI agent boundaries.
- Give every agent its own system prompt, calibration configuration, typed input, typed output, authority boundary, competence boundary, and handoff rules.
- Use a deterministic orchestrator for sequencing, routing, state management, dependency traversal, and a maximum of one Sign-off return cycle.
- The orchestrator must not perform legal reasoning or rewrite agent conclusions.
- Record the complete validated input and output of every invocation in an auditable run record.
- Use deterministic per-agent fallback outputs whenever mock mode is enabled or a live agent call fails.
- Keep all AI proposals conditional on the lawyer-approved hypothetical and visibly subject to lawyer review.
- Do not redesign unrelated screens, add publishing, or add general multi-agent infrastructure beyond this flow.

## Fixed Requirements and Flow

```text
regulatory development
→ comparative research
→ persuasive-weight / relevance analysis
→ AI-recommended Singapore working assumption
→ lawyer accepts, overrides, or enters a lawyer-authored assumption
→ Firm Twin run begins (deterministic run envelope; no legal reasoning)
→ Triage Agent
→ Practice Group Agent
→ Sign-off Agent
   ↳ at most one return to Practice Group Agent for reconsideration
→ Client Alert Agent
→ Evaluator Agent independently audits the complete run
→ deterministic dependency propagation and stale/conflict aggregation
→ remediation proposals
→ human review
→ final resilience brief
```

The completed run must answer: what became stale, why it became stale, which downstream artefacts are affected, which conflicts exist, what needs remediation, and what requires lawyer review.

## Existing Architecture to Reuse

- `backend/services/ai_service.py`: retain OpenRouter transport, strict JSON Schema response mode, one repair attempt, timeouts, and safe provider errors. Extract a lower-level typed call so each agent supplies its own prompt and schema.
- `backend/services/pipeline.py`: retain evidence validation, context hashing, impact validation, patch review, snapshot validation, and Brief projection.
- `backend/services/propagation.py`: retain cycle-safe upstream-to-downstream traversal as the only dependency propagation authority.
- `backend/services/demo_twin.py` and `backend/data/seed.json`: retain the canonical scenario, five synthetic artefacts, and dependency graph.
- `backend/routes/twin.py`: retain the seed, comparative, review-patch, report, and snapshot endpoints; add one agent-run endpoint and extend validated downstream inputs.
- `frontend/components/twin/Workspace.tsx`: retain the current `evidence`, `scenario`, `impact`, `review`, and `brief` views and all existing controls.
- `frontend/components/twin/ImpactMap.tsx`, `PatchCard.tsx`, `Evidence.tsx`, and `Brief.tsx`: reuse without visual redesign; add only agent-run summaries and evaluator evidence where the workflow requires them.
- `frontend/lib/project-state.ts`, `project.ts`, and `api.ts`: extend the current state/reset/persistence patterns.
- `backend/export_types.py`: continue generating `frontend/types/domain.ts` from Pydantic models; do not hand-edit generated types.

## Target File Map

### Backend files to modify

- `backend/domain.py`: add recommendation, calibration, per-agent input/output, audit, handoff, evaluator, and aggregate run models; extend remediation/report/snapshot models with `twinRun`.
- `backend/config.py`: add fallback policy and a maximum reconsideration count fixed to `1`.
- `backend/services/ai_service.py`: expose a generic strict structured-call primitive that accepts an agent-specific system prompt and output schema.
- `backend/services/demo_twin.py`: add deterministic comparative recommendation fields and helpers that read canonical agent fallbacks.
- `backend/services/pipeline.py`: validate agent outputs/audit chains, derive impact from signed Practice Group findings, validate `twinRun` context, and include evaluator findings in remediation and Brief inputs.
- `backend/routes/twin.py`: add `POST /analyse/twin-run`; update remediation, report, and project validation wiring.
- `backend/export_types.py`: update only if new Pydantic field shapes require exporter support for JSON payload aliases or new unions.
- `backend/data/seed.json`: add the active calibration-profile ID and deterministic demo run ID; preserve the five existing assets and graph.
- `backend/.env.example`: document `AGENT_FALLBACK_ON_ERROR=true` and `MAX_SIGNOFF_RECONSIDERATIONS=1`.
- `backend/tests/test_ai.py`, `test_api.py`, and `test_twin.py`: extend existing transport, contract, full-flow, and tamper tests.

### Backend files to create

- `backend/agents/__init__.py`: export the five agent specifications.
- `backend/agents/contracts.py`: define `AgentSpec`, profile loading, prompt/profile version lookup, payload hashing, and audit-record construction.
- `backend/agents/triage.py`: Triage prompt, profile binding, typed invocation wrapper, and deterministic fallback selector.
- `backend/agents/practice_group.py`: Practice Group prompt, initial/reconsideration invocation wrapper, and deterministic fallback selector.
- `backend/agents/sign_off.py`: Sign-off prompt, decision validation, invocation wrapper, and deterministic fallback selector.
- `backend/agents/client_alert.py`: Client Alert prompt, signed-input gate, invocation wrapper, and deterministic fallback selector.
- `backend/agents/evaluator.py`: independent evaluator prompt, complete-run input builder, invocation wrapper, and deterministic fallback selector.
- `backend/services/twin_orchestrator.py`: deterministic sequencing, handoff construction, one reconsideration loop, fallback routing, evaluator invocation, and aggregate result assembly.
- `backend/data/agent_profiles.json`: versioned prompt/calibration/authority/competence/handoff configuration for all five agents.
- `backend/data/demo_agent_outputs.json`: canonical structured outputs for every invocation, including the Practice Group reconsideration and second Sign-off variants.
- `backend/tests/test_agent_contracts.py`: profile, schema, prompt, evidence, authority, and audit-record tests.
- `backend/tests/test_twin_orchestrator.py`: order, bounded return, fallback, evaluator observation, and no-hidden-reasoning tests.

### Frontend files to modify

- `frontend/lib/api.ts`: add `runTwins()` and send `twinRun` to remediation/report endpoints.
- `frontend/lib/project-state.ts`: add `twinRun`; reset it whenever comparative analysis or the assumption changes; add recommended, alternative, and lawyer-authored scenario helpers.
- `frontend/lib/project.ts`: bump persisted snapshots to schema version `2` and keep server validation before save/restore.
- `frontend/components/twin/Workspace.tsx`: preselect and label the recommendation, expose accept/override/own-assumption actions inside the existing Scenario stage, call the agent-run endpoint, and render agent progress in the existing Impact stage.
- `frontend/components/twin/Brief.tsx`: add a compact Law Firm Twins audit/evaluator appendix and use evaluator findings in the existing executive counts/actions presentation.
- `frontend/tests/project.test.ts`: cover recommendation selection and downstream invalidation.
- `frontend/tests/review-queue.test.ts`: retain unchanged behavior; add no test unless the remediation input changes queue semantics.

### Frontend files to create

- `frontend/components/twin/TwinRunSummary.tsx`: compact ordered agent/handoff status with collapsible received/produced audit details.
- `frontend/components/twin/CalibrationProfile.tsx`: read-only active profile summary; no profile editor.
- `frontend/lib/twin-run.ts`: pure selectors for current agent attempt, final Practice Group output, unresolved evaluator risks, and run completion.
- `frontend/tests/twin-run.test.ts`: test selectors and incomplete/returned/fallback runs.

## Public Contracts

Add the following Pydantic concepts to `backend/domain.py`; `frontend/types/domain.ts` must be regenerated from them.

```python
AgentName = Literal['TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR']
AgentExecutionMode = Literal['LIVE', 'MOCK', 'FALLBACK']
SignOffDecision = Literal['APPROVED', 'RETURNED']

class ScenarioRecommendation(Model):
    scenario_id: Text
    rationale: Text
    persuasive_weight: Severity
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: Confidence

class ComparativeResult(Model):
    assessments: list[ComparativeAssessment] = Field(min_length=2, max_length=4)
    scenarios: list[Scenario] = Field(min_length=1, max_length=3)
    recommendation: ScenarioRecommendation

class TwinCalibrationProfile(Model):
    id: Text
    version: Text
    label: Text
    agent: AgentName
    risk_posture: Literal['CONSERVATIVE', 'BALANCED']
    evidence_threshold: Literal['SUPPLIED_SOURCE_REQUIRED', 'SIGNED_FINDING_REQUIRED']
    escalation_threshold: Severity
    authority: list[Text] = Field(min_length=1)
    competence_boundaries: list[Text] = Field(min_length=1)
    handoff_rules: list[Text] = Field(min_length=1)

class AgentAuditRecord(Model):
    invocation_id: Text
    sequence: int = Field(ge=1)
    agent: AgentName
    attempt: int = Field(ge=1, le=2)
    profile_id: Text
    profile_version: Text
    prompt_version: Text
    execution_mode: AgentExecutionMode
    received: dict[str, object]
    produced: dict[str, object]
    input_hash: Text
    output_hash: Text
    started_at: Text
    completed_at: Text
```

Use five separate input/output pairs rather than a generic untyped result:

```python
class TriageAgentInput(StressInput):
    run_id: Text

class TriageItem(Model):
    asset_id: Text
    priority: Severity
    issue: Text
    proposed_owner: Text
    evidence: list[EvidenceReference] = Field(min_length=1)

class TriageAgentOutput(Model):
    items: list[TriageItem] = Field(min_length=1)
    handoff_summary: Text

class PracticeGroupAgentInput(StressInput):
    run_id: Text
    triage: TriageAgentOutput
    reconsideration: 'ReconsiderationRequest | None' = None

class PracticeConflict(Model):
    id: Text
    asset_ids: list[Text] = Field(min_length=1)
    issue: Text
    severity: Severity
    evidence: list[EvidenceReference] = Field(min_length=1)

class PracticeGroupAgentOutput(Model):
    findings: list[DirectFinding] = Field(min_length=5, max_length=5)
    conflicts: list[PracticeConflict]
    ownership: dict[str, str]
    handoff_summary: Text

class SignOffAgentInput(Model):
    run_id: Text
    scenario: Scenario
    sources: list[LegalSource]
    triage: TriageAgentOutput
    practice_group: PracticeGroupAgentOutput

class ReconsiderationRequest(Model):
    finding_ids: list[Text] = Field(min_length=1)
    reasons: list[Text] = Field(min_length=1)
    required_evidence_or_analysis: list[Text] = Field(min_length=1)

class SignOffAgentOutput(Model):
    decision: SignOffDecision
    approved_finding_ids: list[Text]
    reconsideration: ReconsiderationRequest | None
    unresolved_risks: list[Text]
    handoff_summary: Text

class ClientAlertAgentInput(Model):
    run_id: Text
    scenario: Scenario
    signed_findings: list[DirectFinding]
    sign_off: SignOffAgentOutput

class ClientAlertAgentOutput(Model):
    status: Literal['DRAFT_READY', 'HOLD_FOR_SIGN_OFF']
    headline: Text
    audience: Text
    draft: Text
    caveats: list[Text] = Field(min_length=1)
    source_finding_ids: list[Text]
    requires_human_publication: Literal[True] = True

class EvaluatorAgentInput(Model):
    run_id: Text
    scenario: Scenario
    audit_records: list[AgentAuditRecord] = Field(min_length=4)
    firm_assets: list[FirmAsset] = Field(min_length=5, max_length=5)
    dependencies: list[Dependency]

class EvaluatorObservation(Model):
    id: Text
    category: Literal['CONTRADICTION', 'UNSUPPORTED_ASSUMPTION', 'FAILED_HANDOFF', 'UNRESOLVED_RISK', 'MISSING_OWNERSHIP', 'STALE_ARTEFACT', 'DOWNSTREAM_EFFECT', 'RESILIENCE_FAILURE']
    severity: Severity
    agent_names: list[AgentName]
    asset_ids: list[Text]
    issue: Text
    recommendation: Text
    evidence: list[EvidenceReference]

class EvaluatorAgentOutput(Model):
    observations: list[EvaluatorObservation]
    run_complete: bool
    summary: Text

class TwinRunResult(Model):
    run_id: Text
    context_hash: Text
    profiles: list[TwinCalibrationProfile] = Field(min_length=5, max_length=5)
    triage: TriageAgentOutput
    practice_group_attempts: list[PracticeGroupAgentOutput] = Field(min_length=1, max_length=2)
    sign_off_attempts: list[SignOffAgentOutput] = Field(min_length=1, max_length=2)
    client_alert: ClientAlertAgentOutput
    evaluator: EvaluatorAgentOutput
    impact: ImpactResult
    audit_records: list[AgentAuditRecord] = Field(min_length=5, max_length=7)
```

`POST /analyse/twin-run` consumes the existing `StressInput` and returns `TwinRunResult`. Replace `RemediationInput.impact` with required `twin_run: TwinRunResult`, and add the same required run to `ReportInput` and `ResilienceBrief` plus a nullable run to `ProjectSnapshot`; validate that `twin_run.context_hash == context_hash(input)` before accepting remediation, snapshots, or reports.

## Agent Authority and Handoff Matrix

| Agent | May decide | Must not decide | Receives | Produces / hands off |
|---|---|---|---|---|
| Triage | Priority, issue routing, proposed owner | Legal correctness, final impact, remediation, publication | Approved assumption, curated sources, five assets, graph | Typed triage items to Practice Group |
| Practice Group | Direct legal/operational findings, conflicts, ownership | Final approval, publication, graph propagation | Assumption, sources, corpus, triage, optional return request | Exactly one direct finding per asset to Sign-off |
| Sign-off | Approve findings or return identified findings once | New findings, source edits, publication | Triage and Practice Group output | Approved IDs or typed reconsideration request |
| Client Alert | Conditional draft based only on signed findings | New legal conclusions, approval, publication | Approved findings and Sign-off output | Draft or hold state to Evaluator |
| Evaluator | Independent observations about run integrity and resilience | Altering prior outputs, approving findings, remediation text | Complete audit records, assumption, corpus, graph | Typed observations to deterministic aggregation/remediation |

## Implementation Order

### Task 1: Add comparative recommendation and agent-domain contracts

**Files:**
- Modify: `backend/domain.py`
- Modify: `backend/services/demo_twin.py`
- Modify: `backend/tests/test_api.py`
- Modify: `backend/tests/test_twin.py`
- Regenerate: `frontend/types/domain.ts`

**Interfaces:**
- Consumes: existing `Model`, `StressInput`, `DirectFinding`, `ImpactResult`, and `EvidenceReference`.
- Produces: all contracts in “Public Contracts,” plus `ComparativeResult.recommendation`.

- [ ] **Step 1: Write failing comparative contract tests**

```python
def test_comparative_result_names_one_evidenced_recommendation():
    result = client.post('/analyse/comparative', json=input_data()).json()
    ids = {scenario['id'] for scenario in result['scenarios']}
    assert result['recommendation']['scenarioId'] in ids
    assert result['recommendation']['persuasiveWeight'] == 'HIGH'
    assert result['recommendation']['evidence']
```

- [ ] **Step 2: Run the focused test and confirm it fails because `recommendation` is absent**

Run: `cd backend; python -m pytest tests/test_api.py -k recommendation -v`

- [ ] **Step 3: Add the exact Pydantic contracts and comparative recommendation validation**

Add the models from “Public Contracts.” In `validate_comparative`, enforce:

```python
scenario_ids = {scenario.id for scenario in result.scenarios}
if result.recommendation.scenario_id not in scenario_ids:
    raise ValueError('Recommendation must reference a supplied scenario.')
check_evidence(result.recommendation, data.sources)
```

- [ ] **Step 4: Make `demo_comparative` recommend `scenario-1` with supplied evidence**

```python
return ComparativeResult(
    assessments=assessments,
    scenarios=scenarios,
    recommendation={
        'scenarioId': 'scenario-1',
        'rationale': 'The foreign documented-assessment model has high persuasive relevance to the supplied Singapore designated-service framework, while remaining hypothetical Singapore law.',
        'persuasiveWeight': 'HIGH',
        'evidence': [item.model_dump() for item in refs],
        'confidence': 0.82,
    },
)
```

- [ ] **Step 5: Regenerate TypeScript contracts and run domain/API tests**

Run: `cd backend; python export_types.py`

Run: `cd backend; python -m pytest tests/test_api.py tests/test_twin.py -v`

- [ ] **Step 6: Commit the contract slice**

```bash
git add backend/domain.py backend/services/demo_twin.py backend/tests/test_api.py backend/tests/test_twin.py frontend/types/domain.ts
git commit -m "feat: add twin agent and scenario recommendation contracts"
```

### Task 2: Add versioned agent profiles and five explicit specifications

**Files:**
- Create: `backend/data/agent_profiles.json`
- Create: `backend/agents/__init__.py`
- Create: `backend/agents/contracts.py`
- Create: `backend/agents/triage.py`
- Create: `backend/agents/practice_group.py`
- Create: `backend/agents/sign_off.py`
- Create: `backend/agents/client_alert.py`
- Create: `backend/agents/evaluator.py`
- Create: `backend/tests/test_agent_contracts.py`

**Interfaces:**
- Consumes: typed input/output models from Task 1.
- Produces: `AgentSpec`, `load_agent_profiles()`, and five exported `SPEC` objects.

- [ ] **Step 1: Write failing profile-boundary tests**

```python
def test_every_agent_has_unique_prompt_profile_and_schema():
    specs = [TRIAGE_SPEC, PRACTICE_GROUP_SPEC, SIGN_OFF_SPEC, CLIENT_ALERT_SPEC, EVALUATOR_SPEC]
    assert {spec.name for spec in specs} == {'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'}
    assert len({spec.system_prompt for spec in specs}) == 5
    assert len({spec.profile.id for spec in specs}) == 5
    assert all(spec.profile.authority for spec in specs)
    assert all(spec.profile.competence_boundaries for spec in specs)
    assert all(spec.profile.handoff_rules for spec in specs)
```

- [ ] **Step 2: Run the contract test and confirm imports fail**

Run: `cd backend; python -m pytest tests/test_agent_contracts.py -v`

- [ ] **Step 3: Create `AgentSpec` and strict profile loading**

```python
@dataclass(frozen=True)
class AgentSpec(Generic[InputT, OutputT]):
    name: AgentName
    prompt_version: str
    system_prompt: str
    input_schema: type[InputT]
    output_schema: type[OutputT]
    profile: TwinCalibrationProfile

def load_agent_profiles() -> dict[AgentName, TwinCalibrationProfile]:
    path = Path(__file__).parents[1] / 'data' / 'agent_profiles.json'
    profiles = [TwinCalibrationProfile.model_validate(item) for item in json.loads(path.read_text('utf-8'))]
    if len(profiles) != 5 or len({profile.agent for profile in profiles}) != 5:
        raise ValueError('Exactly one calibration profile is required per agent.')
    return {profile.agent: profile for profile in profiles}
```

- [ ] **Step 4: Add five complete profile records**

Use stable IDs `triage-conservative-v1`, `practice-online-safety-v1`, `signoff-evidence-v1`, `client-alert-conditional-v1`, and `evaluator-independent-v1`. Each JSON object must include its agent, version `1.0.0`, authority list, competence-boundary list, handoff rules, evidence threshold, escalation threshold, and risk posture.

- [ ] **Step 5: Define one system prompt in each agent module**

The prompts must include these exact boundary statements:

```python
# triage.py
SYSTEM_PROMPT = """You are Donna's Triage Agent. Prioritise and route issues using only supplied material. You may propose ownership and urgency. You must not decide final legal correctness, approve findings, draft remediation, or author client communications. Every issue must cite supplied evidence and hand off through the TriageAgentOutput schema."""

# practice_group.py
SYSTEM_PROMPT = """You are Donna's Practice Group Agent for the supplied regulatory topic. Assess every supplied firm artefact against the lawyer-approved hypothetical, identify direct staleness and conflicts, and respond explicitly to any reconsideration request. You must not approve your own findings, infer graph propagation, alter source text, or publish advice. Return exactly one DirectFinding per asset."""

# sign_off.py
SYSTEM_PROMPT = """You are Donna's Sign-off Agent. Independently test the Practice Group findings for evidential support, internal consistency, scope, and conditional language. Approve the set or return identified findings with precise reasons and required analysis. Do not create replacement findings, edit sources, or author external communications."""

# client_alert.py
SYSTEM_PROMPT = """You are Donna's Client Alert Agent. Draft a conditional internal client-alert proposal using only Sign-off-approved findings. Introduce no new legal conclusion, do not imply the hypothetical is current Singapore law, and never mark content as published. If Sign-off has not approved the findings, return HOLD_FOR_SIGN_OFF."""

# evaluator.py
SYSTEM_PROMPT = """You are Donna's independent Evaluator Agent. Audit the complete supplied agent record for contradictions, unsupported assumptions, failed handoffs, unresolved risk, missing ownership, stale artefacts, downstream effects, and resilience failures. Do not alter prior outputs, approve findings, perform remediation, or conceal disagreement."""
```

- [ ] **Step 6: Run profile tests**

Run: `cd backend; python -m pytest tests/test_agent_contracts.py -v`

- [ ] **Step 7: Commit profiles and boundaries**

```bash
git add backend/agents backend/data/agent_profiles.json backend/tests/test_agent_contracts.py
git commit -m "feat: define five calibrated law firm twin agents"
```

### Task 3: Refactor the provider into an auditable per-agent runner

**Files:**
- Modify: `backend/services/ai_service.py`
- Modify: `backend/config.py`
- Modify: `backend/.env.example`
- Create: `backend/agents/runner.py`
- Create: `backend/data/demo_agent_outputs.json`
- Modify: `backend/tests/test_ai.py`
- Modify: `backend/tests/test_agent_contracts.py`

**Interfaces:**
- Consumes: `AgentSpec`, typed input models, canonical demo outputs.
- Produces: `run_agent(spec, input_value, attempt, sequence) -> tuple[OutputT, AgentAuditRecord]`.

- [ ] **Step 1: Write failing tests for prompt isolation, fallback, and audit completeness**

```python
async def test_runner_uses_only_selected_agent_prompt(monkeypatch):
    output, audit = await run_agent(TRIAGE_SPEC, triage_input(), attempt=1, sequence=1)
    sent = captured_request['json']['messages'][0]['content']
    assert TRIAGE_SPEC.system_prompt in sent
    assert PRACTICE_GROUP_SPEC.system_prompt not in sent
    assert audit.received == triage_input().model_dump(mode='json', by_alias=True)
    assert audit.produced == output.model_dump(mode='json', by_alias=True)

async def test_live_failure_uses_agent_specific_fallback(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, 'post', failing_post)
    output, audit = await run_agent(TRIAGE_SPEC, triage_input(), attempt=1, sequence=1)
    assert audit.execution_mode == 'FALLBACK'
    assert output.items[0].asset_id == 'playbook'
```

- [ ] **Step 2: Run the focused tests and confirm `run_agent` is missing**

Run: `cd backend; python -m pytest tests/test_ai.py tests/test_agent_contracts.py -k "runner or fallback or audit" -v`

- [ ] **Step 3: Extract the current strict call into `run_structured`**

```python
async def run_structured(name: str, system_prompt: str, data: BaseModel, schema: type[T]) -> T:
    messages = [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': 'JSON schema:\n' + json.dumps(schema.model_json_schema(by_alias=True))
            + '\nSupplied input:\n' + data.model_dump_json(by_alias=True)},
    ]
    # Retain the existing two-attempt JSON validation/repair loop and safe provider errors.
```

Keep `run_stage()` as a compatibility wrapper for comparative and remediation until their callers are migrated.

- [ ] **Step 4: Implement audit construction around one selected agent**

```python
async def run_agent(spec, value, *, attempt: int, sequence: int):
    started_at = utc_now()
    mode = 'MOCK' if get_settings().use_mock_ai else 'LIVE'
    try:
        output = spec.output_schema.model_validate(build_fallback(spec.name, value, attempt)) if mode == 'MOCK' \
            else await run_structured(spec.name.lower(), spec.system_prompt, value, spec.output_schema)
    except AIServiceError:
        if not get_settings().agent_fallback_on_error:
            raise
        output = spec.output_schema.model_validate(build_fallback(spec.name, value, attempt))
        mode = 'FALLBACK'
    completed_at = utc_now()
    return output, make_audit_record(spec, value, output, attempt, sequence, mode, started_at, completed_at)
```

- [ ] **Step 5: Add deterministic outputs keyed by agent and attempt**

`demo_agent_outputs.json` must contain keys `TRIAGE.1`, `PRACTICE_GROUP.1`, `PRACTICE_GROUP.2`, `SIGN_OFF.1`, `SIGN_OFF.2`, `CLIENT_ALERT.1`, and `EVALUATOR.1`. The canonical first Sign-off output must be `APPROVED`; the second-attempt records exist to test the return path. Every asset/source/finding ID must come from `seed.json`. `build_fallback(agent, input, attempt)` may return these golden records only when the assumption, sources, assets, and graph match the canonical seed. For a lawyer-authored or otherwise non-canonical assumption, it must build a conservative schema-valid result from the supplied IDs: Triage routes every asset at `HIGH`, Practice Group marks every direct finding `REVIEW_REQUIRED` with confidence `0.2`, Sign-off returns unresolved scope to lawyer review, Client Alert returns `HOLD_FOR_SIGN_OFF`, and Evaluator records the unsupported/non-canonical assumption. This prevents a reliable fallback from falsely presenting canonical legal reasoning against changed input.

- [ ] **Step 6: Add exact configuration defaults**

```python
agent_fallback_on_error: bool = True
max_signoff_reconsiderations: Literal[1] = 1
```

- [ ] **Step 7: Run transport and runner tests**

Run: `cd backend; python -m pytest tests/test_ai.py tests/test_agent_contracts.py -v`

- [ ] **Step 8: Commit the runner**

```bash
git add backend/services/ai_service.py backend/config.py backend/.env.example backend/agents/runner.py backend/data/demo_agent_outputs.json backend/tests/test_ai.py backend/tests/test_agent_contracts.py
git commit -m "feat: run each twin agent through an auditable boundary"
```

### Task 4: Implement deterministic orchestration and bounded reconsideration

**Files:**
- Create: `backend/services/twin_orchestrator.py`
- Create: `backend/tests/test_twin_orchestrator.py`
- Modify: `backend/agents/client_alert.py`
- Modify: `backend/agents/evaluator.py`

**Interfaces:**
- Consumes: `StressInput`, five `AgentSpec` wrappers, `run_agent`, `propagate`, `context_hash`.
- Produces: `run_twins(data: StressInput) -> TwinRunResult`.

- [ ] **Step 1: Write failing order and audit-chain tests**

```python
async def test_orchestrator_runs_distinct_agents_in_order():
    result = await run_twins(approved_stress_input())
    assert [record.agent for record in result.audit_records] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'
    ]
    assert [record.sequence for record in result.audit_records] == [1, 2, 3, 4, 5]
    assert result.evaluator.run_complete is True
```

- [ ] **Step 2: Write the bounded return-path test**

```python
async def test_signoff_return_causes_exactly_one_reconsideration(monkeypatch):
    force_first_signoff_return(monkeypatch)
    result = await run_twins(approved_stress_input())
    assert len(result.practice_group_attempts) == 2
    assert len(result.sign_off_attempts) == 2
    assert [record.agent for record in result.audit_records] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'
    ]
    assert result.practice_group_attempts[1].handoff_summary != result.practice_group_attempts[0].handoff_summary
```

- [ ] **Step 3: Run the tests and confirm the orchestrator import fails**

Run: `cd backend; python -m pytest tests/test_twin_orchestrator.py -v`

- [ ] **Step 4: Implement orchestration with no legal branching outside agent decisions**

```python
async def run_twins(data: StressInput) -> TwinRunResult:
    validate_stress_input(data)
    run_id = stable_run_id(context_hash(data))
    audit = []
    triage, record = await invoke_triage(data, run_id, sequence=1)
    audit.append(record)
    practice, record = await invoke_practice_group(data, run_id, triage, None, attempt=1, sequence=2)
    audit.append(record)
    practices = [practice]
    signoff, record = await invoke_sign_off(data, run_id, triage, practice, attempt=1, sequence=3)
    audit.append(record)
    signoffs = [signoff]
    if signoff.decision == 'RETURNED':
        practice, record = await invoke_practice_group(data, run_id, triage, signoff.reconsideration, attempt=2, sequence=4)
        audit.append(record)
        practices.append(practice)
        signoff, record = await invoke_sign_off(data, run_id, triage, practice, attempt=2, sequence=5)
        audit.append(record)
        signoffs.append(signoff)
    client_alert, record = await invoke_client_alert(data, run_id, practice, signoff, sequence=len(audit) + 1)
    audit.append(record)
    evaluator, record = await invoke_evaluator(data, run_id, audit, sequence=len(audit) + 1)
    audit.append(record)
    direct = DirectResult(findings=practice.findings)
    validate_direct(direct, data)
    impact = propagate(direct, data.dependencies, context_hash(data))
    return TwinRunResult(run_id=run_id, context_hash=context_hash(data), profiles=active_profiles(),
        triage=triage, practice_group_attempts=practices, sign_off_attempts=signoffs,
        client_alert=client_alert, evaluator=evaluator, impact=impact, audit_records=audit)
```

The `if` branch routes only on the typed Sign-off decision. It must not reinterpret findings, change severity, invent ownership, or modify reconsideration instructions.

- [ ] **Step 5: Validate handoffs before every call**

Require Practice Group to return exactly one finding per supplied asset; require Sign-off approved/returned IDs to exist; require `RETURNED` to include `reconsideration`; require `APPROVED` to have `reconsideration=None`; require Client Alert `DRAFT_READY` only after approval; and require Evaluator’s input audit hashes to match the recorded payloads.

- [ ] **Step 6: Run orchestrator tests**

Run: `cd backend; python -m pytest tests/test_twin_orchestrator.py -v`

- [ ] **Step 7: Commit the orchestrator**

```bash
git add backend/services/twin_orchestrator.py backend/agents/client_alert.py backend/agents/evaluator.py backend/tests/test_twin_orchestrator.py
git commit -m "feat: orchestrate bounded law firm twin handoffs"
```

### Task 5: Integrate agent runs with validation, remediation, Briefs, and snapshots

**Files:**
- Modify: `backend/services/pipeline.py`
- Modify: `backend/services/demo_twin.py`
- Modify: `backend/domain.py`
- Modify: `backend/tests/test_twin.py`
- Modify: `backend/tests/test_api.py`
- Regenerate: `frontend/types/domain.ts`

**Interfaces:**
- Consumes: `TwinRunResult` from Task 4.
- Produces: `validate_twin_run`, twin-aware remediation/report/snapshot validation, evaluator-backed Brief content.

- [ ] **Step 1: Write failing tamper and context tests**

```python
def test_twin_run_rejects_changed_assumption_and_tampered_audit():
    payload, run = completed_twin_run()
    changed = deepcopy(payload)
    changed['scenario']['description'] += ' changed'
    assert client.post('/analyse/remediation', json={**changed, 'twinRun': run}).status_code == 422
    run['auditRecords'][0]['produced']['handoffSummary'] = 'tampered'
    assert client.post('/analyse/remediation', json={**payload, 'twinRun': run}).status_code == 422
```

- [ ] **Step 2: Run the test and confirm the current remediation contract rejects `twinRun`**

Run: `cd backend; python -m pytest tests/test_twin.py -k twin_run -v`

- [ ] **Step 3: Implement `validate_twin_run`**

```python
def validate_twin_run(run: TwinRunResult, data: StressInput):
    if run.context_hash != context_hash(data):
        raise ValueError('The assumption, evidence or firm corpus changed. Run the twins again.')
    expected_sequence = list(range(1, len(run.audit_records) + 1))
    if [record.sequence for record in run.audit_records] != expected_sequence:
        raise ValueError('Agent audit sequence is incomplete.')
    for record in run.audit_records:
        if record.input_hash != hash_payload(record.received) or record.output_hash != hash_payload(record.produced):
            raise ValueError('Agent audit payload was modified.')
    validate_direct(DirectResult(findings=run.practice_group_attempts[-1].findings), data)
    expected = propagate(DirectResult(findings=run.practice_group_attempts[-1].findings), data.dependencies, context_hash(data))
    if run.impact != expected:
        raise ValueError('Twin impact does not match deterministic dependency propagation.')
```

- [ ] **Step 4: Make remediation consume the validated twin impact**

Change `RemediationInput` so its `impact` is removed and `twin_run` is required. Route existing `demo_remediation` and live remediation prompting with `data.twin_run.impact`; append evaluator observations in categories `UNRESOLVED_RISK`, `MISSING_OWNERSHIP`, and `RESILIENCE_FAILURE` to the remediation review context without converting them into approved legal conclusions.

- [ ] **Step 5: Extend the Brief projection**

Add `twin_run` to `ReportInput` and `ResilienceBrief`. Build `outstanding_questions` from scenario questions, remediation questions, and evaluator unresolved-risk recommendations. Keep required publication human-only and keep patches governed by existing decisions.

- [ ] **Step 6: Extend snapshot validation**

Add nullable `twin_run` to `ProjectSnapshot`. Enforce the state order `scenario → twinRun → remediation → decisions → brief`; reject downstream state without a valid run. Continue rebuilding the Brief server-side to detect projection tampering.

Update the existing comparative-origin rule so `scenario.id == 'lawyer-assumption'` is accepted only when its evidence validates against the supplied sources, it carries no approval metadata before lawyer approval, and its title is exactly `Lawyer-authored working assumption`. All other non-comparative scenario IDs remain invalid.

- [ ] **Step 7: Regenerate TypeScript and run backend workflow tests**

Run: `cd backend; python export_types.py`

Run: `cd backend; python -m pytest tests/test_twin.py tests/test_api.py -v`

- [ ] **Step 8: Commit pipeline integration**

```bash
git add backend/domain.py backend/services/pipeline.py backend/services/demo_twin.py backend/tests/test_twin.py backend/tests/test_api.py frontend/types/domain.ts
git commit -m "feat: connect twin runs to remediation and resilience briefs"
```

### Task 6: Expose the agent run API with safe fallback behavior

**Files:**
- Modify: `backend/routes/twin.py`
- Modify: `backend/main.py`
- Modify: `backend/tests/test_api.py`
- Modify: `backend/tests/test_ai.py`

**Interfaces:**
- Consumes: `run_twins`, twin-aware remediation/report models.
- Produces: `POST /analyse/twin-run`; stable safe errors only when both live execution and configured fallback fail validation.

- [ ] **Step 1: Write the failing endpoint contract test**

```python
def test_twin_run_endpoint_returns_all_agents_and_audit():
    _, _, payload = prepare()
    response = client.post('/analyse/twin-run', json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['contextHash']
    assert [item['agent'] for item in body['auditRecords']] == [
        'TRIAGE', 'PRACTICE_GROUP', 'SIGN_OFF', 'CLIENT_ALERT', 'EVALUATOR'
    ]
    assert body['clientAlert']['requiresHumanPublication'] is True
```

- [ ] **Step 2: Confirm the endpoint is currently absent**

Run: `cd backend; python -m pytest tests/test_api.py -k twin_run_endpoint -v`

- [ ] **Step 3: Add the route without removing `/analyse/stress-test`**

```python
@router.post('/analyse/twin-run', response_model=TwinRunResult, dependencies=[Depends(require_user)])
async def twin_run(data: StressInput):
    pipeline.validate_stress_input(data)
    return await run_twins(data)
```

Keep `/analyse/stress-test` during migration and mark it as the legacy direct-impact route in its OpenAPI description; the frontend switches to `/analyse/twin-run` in Task 8.

- [ ] **Step 4: Test live failure fallback per agent**

Patch the OpenRouter call to fail on each sequence position in a parameterized test. Assert status `200`, exactly one corresponding audit record has `executionMode == 'FALLBACK'`, subsequent agents still receive that fallback output, and the evaluator receives the complete audit list.

- [ ] **Step 5: Run API and AI tests**

Run: `cd backend; python -m pytest tests/test_api.py tests/test_ai.py -v`

- [ ] **Step 6: Commit API integration**

```bash
git add backend/routes/twin.py backend/main.py backend/tests/test_api.py backend/tests/test_ai.py
git commit -m "feat: expose reliable law firm twin run API"
```

### Task 7: Add recommended, alternative, and lawyer-authored assumption state

**Files:**
- Modify: `frontend/lib/project-state.ts`
- Modify: `frontend/tests/project.test.ts`
- Modify: `frontend/lib/project.ts`

**Interfaces:**
- Consumes: generated `ComparativeResult.recommendation` and current `Scenario` lifecycle.
- Produces: `applyComparativeResult`, `selectRecommendedScenario`, `createLawyerAssumption`, and complete downstream invalidation.

- [ ] **Step 1: Write failing state tests**

```typescript
test("comparative analysis preselects the AI recommendation", () => {
  const project = applyComparativeResult(initialProject(), comparative);
  assert.equal(project.scenario?.id, comparative.recommendation.scenarioId);
  assert.equal(project.scenario?.status, "AI_GENERATED_SCENARIO");
});

test("lawyer-authored assumption clears all downstream twin state", () => {
  const project = createLawyerAssumption(completedProject, "A narrower approved hypothetical");
  assert.equal(project.scenario?.description, "A narrower approved hypothetical");
  assert.equal(project.twinRun, null);
  assert.equal(project.remediation, null);
  assert.deepEqual(project.decisions, []);
  assert.equal(project.brief, null);
});
```

- [ ] **Step 2: Run tests and confirm the helpers are absent**

Run: `cd frontend; npm test -- --test-name-pattern="recommendation|lawyer-authored"`

- [ ] **Step 3: Add `twinRun` and centralized invalidation**

```typescript
function clearDownstream(project: ProjectState): ProjectState {
  return { ...project, twinRun: null, remediation: null, decisions: [], brief: null };
}

export function applyComparativeResult(project: ProjectState, comparative: ComparativeResult): ProjectState {
  const recommended = comparative.scenarios.find(
    scenario => scenario.id === comparative.recommendation.scenarioId,
  );
  if (!recommended) throw new Error("The recommendation does not match a scenario.");
  return selectScenario({ ...initialProject(), seed: project.seed, comparative }, recommended);
}
```

- [ ] **Step 4: Add a lawyer-authored scenario helper**

Create a local scenario with ID `lawyer-assumption`, the entered title `Lawyer-authored working assumption`, supplied comparative recommendation evidence, `HIGH` uncertainty, the existing legal questions, `AI_GENERATED_SCENARIO` lifecycle status, and null approval metadata. Server validation must identify it by exact ID and allow it only when its evidence remains within supplied sources.

- [ ] **Step 5: Bump persisted schema version**

Change `schemaVersion` from `1` to `2`. Do not silently load version `1`; show the existing “cannot be restored” error so stale snapshots cannot bypass new agent-run validation.

- [ ] **Step 6: Run frontend state tests**

Run: `cd frontend; npm test`

- [ ] **Step 7: Commit state changes**

```bash
git add frontend/lib/project-state.ts frontend/lib/project.ts frontend/tests/project.test.ts
git commit -m "feat: manage recommended and lawyer-authored assumptions"
```

### Task 8: Integrate the complete agent flow into the existing frontend stages

**Files:**
- Modify: `frontend/lib/api.ts`
- Create: `frontend/lib/twin-run.ts`
- Create: `frontend/tests/twin-run.test.ts`
- Create: `frontend/components/twin/TwinRunSummary.tsx`
- Create: `frontend/components/twin/CalibrationProfile.tsx`
- Modify: `frontend/components/twin/Workspace.tsx`

**Interfaces:**
- Consumes: `TwinRunResult`, recommendation, and the existing Workspace stage state.
- Produces: a reliable Scenario → agent run → existing Impact/Review flow without adding a top-level page or route.

- [ ] **Step 1: Write failing pure-selector tests**

```typescript
test("selectors use the final practice and sign-off attempts", () => {
  assert.equal(finalPracticeOutput(returnedRun), returnedRun.practiceGroupAttempts[1]);
  assert.equal(finalSignOffOutput(returnedRun), returnedRun.signOffAttempts[1]);
  assert.equal(isTwinRunComplete(returnedRun), true);
});

test("unresolved evaluator observations stay visible", () => {
  assert.deepEqual(unresolvedEvaluatorRisks(run).map(item => item.category), [
    "UNRESOLVED_RISK", "MISSING_OWNERSHIP",
  ]);
});
```

- [ ] **Step 2: Run frontend tests and confirm selectors are absent**

Run: `cd frontend; npm test`

- [ ] **Step 3: Add the API call**

```typescript
export const runTwins = (data: StressInput) =>
  request<TwinRunResult>("/analyse/twin-run", data);
```

Change remediation to send `{ ...stressInput(), twinRun: project.twinRun }`; change Brief generation to include the same validated `twinRun`.

- [ ] **Step 4: Update only the existing Scenario stage**

Show a navy `AI recommended` label on the scenario whose ID matches `comparative.recommendation.scenarioId`, followed by rationale, persuasive weight, confidence, and existing evidence disclosure. Keep alternative scenario buttons. Add one secondary `Enter my own assumption` action that selects the lawyer-authored scenario helper and focuses the existing textarea. Keep the existing approval button as the only transition to `LAWYER_APPROVED_WORKING_ASSUMPTION`.

- [ ] **Step 5: Replace the current direct stress call with the orchestrated run**

```typescript
const twinRun = await api.runTwins(stressInput());
setProject(project => ({
  ...project,
  twinRun,
  impact: twinRun.impact,
  remediation: null,
  decisions: [],
  brief: null,
}));
setView("impact");
```

The busy label must read `Running Triage, Practice Group, Sign-off, Client Alert and Evaluator agents` and retain the existing error/retry behavior.

- [ ] **Step 6: Add a compact run summary above the existing Impact Map**

`TwinRunSummary` renders five ordered agent rows, execution mode, attempts, Sign-off return status, and a disclosure for each audit record’s received/produced JSON. `CalibrationProfile` renders the five profile labels, versions, authority, and boundaries in one collapsed `<details>` block. Do not add navigation stages, dashboards, agent chat, animation, or editing controls.

- [ ] **Step 7: Preserve the existing impact/remediation transition**

Continue assigning `project.impact = twinRun.impact` so `ImpactMap` receives its existing prop contract. The remediation button remains in the Impact stage and is disabled until `project.twinRun` exists.

- [ ] **Step 8: Run frontend tests**

Run: `cd frontend; npm test`

- [ ] **Step 9: Commit the UI flow**

```bash
git add frontend/lib/api.ts frontend/lib/twin-run.ts frontend/tests/twin-run.test.ts frontend/components/twin/TwinRunSummary.tsx frontend/components/twin/CalibrationProfile.tsx frontend/components/twin/Workspace.tsx
git commit -m "feat: surface the law firm twin run in the existing workflow"
```

### Task 9: Carry evaluator and client-alert outputs into remediation and the final Brief

**Files:**
- Modify: `frontend/components/twin/Brief.tsx`
- Modify: `frontend/components/twin/Workspace.tsx`
- Modify: `backend/services/pipeline.py`
- Modify: `backend/tests/test_twin.py`
- Modify: `frontend/tests/twin-run.test.ts`

**Interfaces:**
- Consumes: twin-aware `RemediationResult` and `ResilienceBrief`.
- Produces: complete final answer coverage without treating Client Alert output as published or evaluator output as lawyer-approved.

- [ ] **Step 1: Write failing final-result tests**

```python
def test_brief_contains_auditable_twin_run_and_evaluator_risks():
    brief = complete_report().json()
    assert brief['twinRun']['auditRecords']
    assert brief['twinRun']['clientAlert']['requiresHumanPublication'] is True
    categories = {item['category'] for item in brief['twinRun']['evaluator']['observations']}
    assert 'STALE_ARTEFACT' in categories
    assert 'DOWNSTREAM_EFFECT' in categories
```

- [ ] **Step 2: Run focused backend tests and confirm the Brief lacks `twinRun`**

Run: `cd backend; python -m pytest tests/test_twin.py -k brief_contains_auditable -v`

- [ ] **Step 3: Include evaluator findings without bypassing human review**

Evaluator observations may add `ReviewFinding` entries and outstanding questions, but they must not create `APPROVED` patches, mutate `ImpactResult`, or change a lawyer’s `ReviewDecision`. Use deterministic mapping by category and asset ID; preserve the evaluator’s text and identify its source as evaluator output.

- [ ] **Step 4: Add a low-priority Brief appendix**

Add a collapsed `Law Firm Twins audit and client-alert draft` section below the existing legal detail. Show agent order, live/mock/fallback mode, Sign-off result, evaluator observations, and the Client Alert draft with the existing `Human publication still required` warning. Keep the Executive Outcome and required actions as the visual priority.

- [ ] **Step 5: Verify the six required questions are answerable**

Use exact selectors:

```typescript
const stale = brief.twinRun.evaluator.observations.filter(item => item.category === "STALE_ARTEFACT");
const why = brief.findings.map(item => item.reasoning);
const downstream = brief.findings.flatMap(item => item.downstreamAssetIds);
const conflicts = finalPracticeOutput(brief.twinRun).conflicts;
const remediation = brief.patches;
const lawyerReview = brief.patches.filter(item => !["APPROVED", "EDITED"].includes(item.status));
```

- [ ] **Step 6: Run backend and frontend tests**

Run: `cd backend; python -m pytest tests/test_twin.py -v`

Run: `cd frontend; npm test`

- [ ] **Step 7: Commit final-output integration**

```bash
git add backend/services/pipeline.py backend/tests/test_twin.py frontend/components/twin/Brief.tsx frontend/components/twin/Workspace.tsx frontend/tests/twin-run.test.ts
git commit -m "feat: include evaluator findings in remediation and briefs"
```

### Task 10: Lock down deterministic demo reliability and full-flow verification

**Files:**
- Modify: `backend/data/seed.json`
- Modify: `backend/data/demo_agent_outputs.json`
- Modify: `backend/tests/test_twin.py`
- Modify: `backend/tests/test_twin_orchestrator.py`
- Modify: `frontend/scripts/smoke.mjs`
- Modify: `frontend/.env.example`

**Interfaces:**
- Consumes: the complete vertical slice.
- Produces: a deterministic canonical demo and live-with-fallback path with the same public schemas.

- [ ] **Step 1: Add a canonical golden-flow test**

The test must execute seed → comparative → verify recommendation → approve recommended assumption → twin run → verify five agent boundaries → remediation → review one patch → Brief. Assert these canonical impact statuses remain stable:

```python
assert {item['assetId']: item['status'] for item in run['impact']['findings']} == {
    'playbook': 'UPDATE_REQUIRED',
    'checklist': 'UPDATE_REQUIRED',
    'training': 'DOWNSTREAM_UPDATE',
    'advisory': 'REVIEW_REQUIRED',
    'clauses': 'UNAFFECTED',
}
```

- [ ] **Step 2: Add deterministic repeatability assertions**

Run the mock twin endpoint twice with identical input. Exclude timestamps and invocation IDs, then assert the two results are identical, including agent outputs, evaluator observations, propagation paths, counts, and fallback profile versions.

- [ ] **Step 3: Add failure-at-every-agent tests**

Parameterize the five agent names. Fail the live provider only for that agent and assert the run completes with one `FALLBACK` record, all audit payload hashes verify, and the final Brief still reports human review/publication requirements.

- [ ] **Step 4: Update the smoke script without changing page structure**

The smoke script should verify the existing five stage buttons, click the recommended scenario, approve it, run the twins, assert the five agent names are visible, open the Impact Map, request remediation, record a review decision, and generate the Brief.

- [ ] **Step 5: Run the complete backend suite**

Run: `cd backend; python -m pytest -v`

Expected: all existing auth, API, pipeline, propagation, agent, orchestrator, fallback, tamper, and golden-flow tests pass.

- [ ] **Step 6: Run frontend unit tests**

Run: `cd frontend; npm test`

Expected: project invalidation, persistence deadline, review queue, recommendation, and twin-run selectors pass.

- [ ] **Step 7: Run frontend lint and production build**

Run: `cd frontend; npm run lint`

Run: `cd frontend; npm run build`

Expected: no new lint, TypeScript, route-generation, or build errors.

- [ ] **Step 8: Run the browser smoke test against local services**

Run backend: `cd backend; python -m uvicorn main:app --reload --port 8000`

Run frontend: `cd frontend; npm run dev`

Run smoke: `cd frontend; node scripts/smoke.mjs`

Expected: the five existing stages complete in sequence; agent rows and evaluator results appear inside Impact; remediation still requires lawyer review; the Brief retains the publication warning.

- [ ] **Step 9: Commit demo hardening**

```bash
git add backend/data/seed.json backend/data/demo_agent_outputs.json backend/tests/test_twin.py backend/tests/test_twin_orchestrator.py frontend/scripts/smoke.mjs frontend/.env.example
git commit -m "test: lock down deterministic multi-agent demo flow"
```

## Final Verification Checklist

- `ComparativeResult` always names one evidence-backed recommended scenario from its own scenario list.
- A lawyer can accept the recommendation, select an alternative, or enter their own assumption before approval.
- Editing or changing the assumption clears `twinRun`, impact, remediation, decisions, and Brief.
- Five distinct prompts, profiles, typed inputs, typed outputs, and authority boundaries exist in separate agent modules.
- Every invocation records what it received and produced, payload hashes, versions, attempt, sequence, mode, and timestamps.
- The deterministic orchestrator performs routing only and allows no more than one Practice Group reconsideration.
- Evaluator receives all prior audit records and cannot mutate their outputs.
- Dependency propagation remains exclusively in `services/propagation.py`.
- Mock mode and per-agent live failures produce schema-identical deterministic fallback output.
- Existing review decisions and publication safeguards remain unchanged.
- The current frontend retains five stages and adds no unrelated screens.
- The final Brief answers all six required resilience questions and keeps evaluator/agent detail in a lower-priority appendix.
- Backend tests, frontend tests, lint, build, and browser smoke all pass.
