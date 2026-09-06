# Twin V1 Prompt Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the legal/product Triage Twin V1 prompt into the existing post-approval Twin workflow with auditable operational-simulation fields and complete final resilience coverage.

**Architecture:** Keep the existing deterministic five-agent orchestration, Pydantic contracts, and graph propagation authority. Compose each live call from a reusable Twin scaffold, its existing role prompt, structured per-firm calibration, and the already typed runtime input; only Triage receives new substantive legal-team role behaviour. Extend rather than replace Triage output and surface the fields through audit records, Evaluator context, remediation, and Brief aggregation.

**Tech Stack:** Python 3, Pydantic v2, FastAPI, pytest, generated TypeScript contracts, Next.js.

**Spec:** [TwinsV1.md](C:\Aarush\Misc\LIT\StuffFromOthers\TwinsV1.md) and the approved mapping in this conversation.

## Global Constraints

- Twin execution remains after a lawyer-approved working assumption.
- Triage prioritises and routes the approved regulatory shock and supplied firm artefacts; it does not conduct comparative-law intake or decide legal correctness.
- Preserve the current five agent names, orchestration order, bounded Sign-off return loop, deterministic fallback mode, and existing public fields.
- CalibrationDataTwin remains versioned structured configuration; it is not an agent and has no invocation or audit record.
- Do not author substantive operational behaviour for incomplete Practice Group, Sign-off, Client Alert, Evaluator, or Legal Analysis Stress Test headings.
- Dependency reachability remains exclusively in `backend/services/propagation.py`.
- Keep all legal conclusions conditional and lawyer review/publication requirements explicit.

### Task 1: Define reusable prompt and calibration boundaries

**Files:**
- Create: `backend/agents/shared_scaffold.py`
- Modify: `backend/agents/contracts.py`
- Modify: `backend/data/agent_profiles.json`
- Test: `backend/tests/test_agent_contracts.py`

**Interfaces:**
- Produces `TWIN_SHARED_SCAFFOLD` and `compose_twin_system_prompt(role_prompt, profile)`.
- Extends `TwinCalibrationProfile` with an optional structured `operational_context`; only the Triage profile contains the four V1 calibration keys.

- [ ] Write failing tests that require a shared scaffold, Triage operational calibration, and absence of calibration data for non-Triage profiles.
- [ ] Run `cd backend; python -m pytest tests/test_agent_contracts.py -v` and confirm the new assertions fail.
- [ ] Add the scaffold module and a prompt composer that serialises the profile calibration as data separate from the role prompt.
- [ ] Add nullable structured operational calibration to the profile schema and versioned Triage configuration placeholders that require the model to state lower reality confidence when calibration is unavailable.
- [ ] Run the focused contract tests and confirm they pass.

### Task 2: Extend Triage contract and adopt the substantive V1 role prompt

**Files:**
- Modify: `backend/domain.py`
- Modify: `backend/agents/triage.py`
- Modify: `backend/services/twin_orchestrator.py`
- Modify: `backend/export_types.py` only if required by the existing exporter
- Regenerate: `frontend/types/domain.ts`
- Test: `backend/tests/test_twin.py`
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Adds `decision`, `latency_estimate`, `latency_driver`, `friction_note`, `handoff`, `confidence_that_this_matches_reality`, `routed_to`, and `urgency_label_applied` to `TriageAgentOutput` without removing `items` or `handoff_summary`.
- Fallback Triage emits deterministic values consistent with its structured calibration and retains one item per asset.

- [ ] Write failing endpoint and orchestrator tests asserting all eight new camelCase fields survive the Twin run and audit record.
- [ ] Run those tests and confirm failure is caused by missing Triage fields.
- [ ] Add bounded field types and the Triage V1 role prompt, preserving existing authority/competence boundaries and adding no roles for incomplete headings.
- [ ] Extend deterministic fallback Triage output and invoke the composed prompt for live calls.
- [ ] Regenerate frontend domain types and run focused tests to green.

### Task 3: Make final resilience analysis cover the complete required set

**Files:**
- Modify: `backend/services/twin_orchestrator.py`
- Modify: `backend/services/pipeline.py`
- Modify: `backend/domain.py` only for additive, schema-safe connection fields if needed
- Modify: `frontend/components/twin/Brief.tsx` only where it is already user-modified; otherwise avoid direct edits
- Test: `backend/tests/test_twin.py`
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Evaluator receives typed Triage operational fields through prior audit records.
- Final Brief exposes stale artefacts, conflicts, downstream dependencies, missing ownership, remediation requirements, and lawyer-review status, without treating agent observations as approved legal conclusions.

- [ ] Write failing integration tests for all six final dimensions using the deterministic run and Brief.
- [ ] Run them and confirm failures identify missing Twin-to-remediation/Brief integration.
- [ ] Extend deterministic Evaluator output to emit evidence-backed conflict, missing-ownership, and remediation/lawyer-review observations where the supplied run supports them.
- [ ] Validate a supplied Twin run before remediation/Brief use and derive review findings, required actions, and outstanding questions from its observations without changing deterministic impact propagation or patch approval state.
- [ ] Render the additional required dimensions in the existing collapsed Twin Brief appendix only if the user’s uncommitted `Brief.tsx` can be patched without overwriting unrelated work.
- [ ] Run focused backend tests to green.

### Task 4: Verify the complete contract and workflow

**Files:**
- Test: `backend/tests/test_agent_contracts.py`
- Test: `backend/tests/test_api.py`
- Test: `backend/tests/test_twin.py`
- Test: `frontend/tests/*.test.ts`

- [ ] Run all backend Twin/API/contract tests.
- [ ] Run the frontend type export drift check and relevant frontend tests.
- [ ] Inspect the diff to confirm no incomplete agent role content was invented and unrelated frontend edits remain unmodified.
