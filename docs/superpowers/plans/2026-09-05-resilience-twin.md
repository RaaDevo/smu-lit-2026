# Firm Regulatory Resilience Twin Implementation Plan

**Goal:** Complete the frozen proactive stress-test workflow on the existing Next.js/FastAPI stack.

**Authority:** AMENDMENTS > TRD > PRD supplied on 5 September 2026. The user authorizes implementation after this plan; no further design gate is needed.

**Architecture:** Three validated model stages around one explicit lawyer approval gate. Stateless FastAPI validates complete inputs, computes downstream propagation, and assembles reports. React owns working state and Firebase client persistence. Local mock mode requires no credentials.

## Existing code classification

| Class | Files / components | Decision |
| --- | --- | --- |
| KEEP | Next.js, Tailwind, TypeScript configuration; Python runtime; Firebase SDK; CI job structure | Reuse installed stack and lockfile |
| ADAPT | backend/main.py, config.py, services/ai_service.py | Strict camelCase contracts, three stages, token protection |
| ADAPT | frontend/lib/api.ts; retain components/AuthControls.tsx | Complete inputs, Firebase ID tokens, new domain types |
| ADAPT | backend/tests/test_api.py, README.md, environment examples | Replace obsolete assertions and setup instructions |
| REMOVE | AnalysisWorkspace.tsx; backend/models.py, routes/analyse.py, services/demo_service.py; frontend/types/api.ts | Superseded by scenario/impact/remediation workspace and domain fixtures |
| NEW | backend/domain.py, routes/twin.py, data, services/propagation.py, services/pipeline.py, services/demo_twin.py, auth.py, export_types.py | Curated data, validation, deterministic services |
| NEW | frontend/types/domain.ts, components/twin, lib/project.ts, lib/project-state.ts, scripts/smoke.mjs, firestore.rules | Desktop workflow, client persistence, owner access |

## Constraints and concrete decisions

- Proactive mode only; UK comparator and Singapore curated evidence; no runtime web research.
- Five synthetic assets and explicit upstreamAssetId -> downstreamAssetId edges.
- Exactly one approved scenario feeds a run. Editing or selecting resets dependent results.
- All statuses are Literals; extra fields rejected; confidence in [0,1]; source IDs and excerpts validated against input.
- Direct model findings never determine graph reachability. Cycle-safe traversal preserves stronger direct statuses.
- One model request plus at most one repair per stage; each request has a 25-second wall-clock limit. JSON schema or configurable JSON mode; no hidden retries.
- Original assets, model proposal and final reviewed text remain separate. Decisions have reviewer, note and timestamp.
- Persist complete small project snapshots through the Firebase Web SDK; backend never reads Firestore.
- REQUIRE_AUTH enables verification on every /analyse/* and /reports/* endpoint. Production environment refuses unprotected startup. Verification uses Google's public keys; no Admin service-account key.
- Auth, persistence, deployment and legal sign-off are external configuration boundaries, not blockers to local delivery.

## Ordered implementation tasks

### 1. Contract, fixtures and full mock API

Files: backend/domain.py; backend/data/seed.json; backend/services/{pipeline,propagation,demo_twin}.py; backend/routes/twin.py; backend/tests/test_twin.py.

- [x] Write an API-level failing test: get seed, generate comparative scenarios, reject unapproved stress test, approve canonical scenario, stress test and assert A/B update, C downstream, D review, E unaffected.
- [x] Add source/section/ID validation, cycle-safe propagation and downstream paths; preserve direct status and inherited evidence.
- [x] Add remediation and deterministic review/report endpoints; test original/proposed/reviewed text preservation and stale-context rejection.
- [x] Run backend tests; correct regressions before UI work.

### 2. Desktop workflow

Files: frontend/types/domain.ts; frontend/lib/{api,project}.ts; frontend/components/twin/*; frontend/app/page.tsx.

- [x] Connect curated development and evidence inspection to stage 1.
- [x] Select/edit/approve one scenario; send full input; reset results after upstream changes.
- [x] Show five selectable nodes, directed edges, direct/inherited status, section text and evidence.
- [x] Review proposals with approve/reject/edit/escalate, notes and audit history; assemble printable/exportable brief.
- [x] Run frontend lint and production build.

### 3. Live structured pipeline

Files: backend/services/ai_service.py; backend/services/pipeline.py; backend/tests/test_ai.py.

- [x] Test invalid enum, unknown source, invalid excerpt, malformed output, repair success, exhausted repair, timeout, provider rejection and mock/live shape equivalence using an HTTP transport stub.
- [x] Implement three prompt/schema pairs. Context checks participate in repair, not just JSON parsing.
- [x] Test that live direct analysis consumes supplied texts, with no canonical status lookup in the live path.

### 4. Persistence and authentication

Files: frontend/lib/project.ts; frontend/components/AuthControls.tsx; firestore.rules; backend/auth.py; backend/config.py; environment templates.

- [x] Add explicit save/load for owner-scoped project snapshots, preserving seed assets and source objects; failure leaves local working state intact.
- [x] Send Firebase ID tokens with protected calls; handle sign-out and restored sessions.
- [x] Verify signatures, issuer, audience, subject, expiry, issued-at and auth-time; missing/invalid/expired tokens reject before model work.
- [x] Add deployment guard and test all protected route groups. Document Firebase console/rules/domain setup.

### 5. Verify and hand off

- [x] Run backend suite, frontend domain tests, lint, production build and real-process API workflow.
- [x] Attempt desktop browser workflow verification with available browser tooling; report any tooling limitation accurately.
- [x] Update README with model/auth environment, exact startup, canonical demo, source limitations and deployment steps.
- [x] Report live integrations requiring external credentials separately from locally verified behavior.

## Ground truth and legal boundary

Canonical hypothetical: IF Singapore required designated social-media services to document an illegal-content risk assessment and retain it for regulatory inspection, test the synthetic firm's internal onboarding guidance. This is a lawyer-approved hypothetical, never a claim of new Singapore law.

Expected: playbook 4.2 UPDATE_REQUIRED; checklist Step 6 UPDATE_REQUIRED; training Slide 14 DOWNSTREAM_UPDATE; advisory Scope note REVIEW_REQUIRED; clauses Clause 2 UNAFFECTED. The law team should review the evidence pack and synthetic assumptions before presentation; the curated pack is dated and intentionally limited.

## Verification record

- 44 backend tests pass, including canonical workflow, cycles, source checks, inherited provenance validation, stale-context rejection, original whitespace preservation, live transport/schema equivalence, bounded failures, signed-token validation and snapshot round trip.
- Four frontend state/persistence tests pass; ESLint, TypeScript production build and generated-contract drift check pass.
- Installed-Chrome Playwright smoke passes against running Next.js and FastAPI: approve, stress, inspect inherited training impact, edit, escalate, export brief, preserve original text, invalidate results on scenario edit. Screenshots are in ignored `.qa/`.
- Google sign-in and Firestore persistence are implemented, but actual cloud rules/save-load and deployed endpoint verification remain configuration-dependent checks for the team. No private service-account key was used, no provider key consumed, no project created, no deployment or push performed.
- Existing generic routes/types were removed in favor of the frozen domain contract. Their previous versions remain recoverable from Git. User-owned `NotionInfo/` and `StuffFromOthers/` were left untouched.
- Independent review identified two corrected issues: restored impact results now enforce inherited evidence/severity/confidence, and Firestore save waiting is separate from analysis with bounded acknowledgement and explicit potentially-late-commit feedback.
- Seeded dependency propagation averaged 0.110 ms across 1,000 local runs (not a production latency guarantee).
