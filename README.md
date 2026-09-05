# Firm Regulatory Resilience Twin

A desktop hackathon prototype for the SMU LIT challenge, “Designing a Sustainable and Resilient LegalTech”. It tests **one lawyer-approved hypothetical Singapore position** against five synthetic firm artefacts and propagates remediation requirements through their dependencies. It never presents the hypothetical as current law or automatically rewrites documents.

The complete local workflow works without OpenRouter or Firebase credentials. Frozen requirements: [AMENDMENTS](docs/AMENDMENTS.md) > [TRD](docs/TRD.md) > [PRD](docs/PRD.md). See [the implementation plan and classification](docs/superpowers/plans/2026-09-05-resilience-twin.md).

## Architecture

```text
Curated UK development + Singapore/UK evidence
  → Stage 1: comparative analysis and hypothetical scenarios
  → Lawyer selects/edits and approves ONE working assumption
  → Stage 2: direct semantic analysis of five assets
  → Deterministic upstream → downstream propagation
  → Stage 3: remediation proposals and adversarial review
  → Lawyer accepts/rejects/edits/escalates
  → Deterministic Regulatory Resilience Brief
```

Next.js/React/TypeScript/Tailwind owns the workspace and optional Firebase Web SDK persistence. FastAPI/Pydantic is stateless: every request carries its full analysis context. Three major model stages share one OpenRouter boundary. Graph traversal, approval checks, totals, provenance checks and report assembly are ordinary code.

No live legal discovery, RAG, vector/graph database, monitoring, autonomous agents, mobile application or automatic document publication is included.

## Run locally

Use Node 22.18+ (Node 24 also works) and Python 3.12+. From the repository root, in PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Skip creating the virtual environment if it already exists. No activation script or environment file is required for the default mock workflow.

In a second terminal:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open [the workspace](http://localhost:3000). API [health](http://localhost:8000/health) and [interactive contracts](http://localhost:8000/docs) are available separately. Use `localhost` consistently; it is the default allowed frontend origin.

On macOS/Linux, use `.venv/bin/python` and `npm` instead of the Windows commands. Existing local environment settings override defaults; inspect your own configuration if the header does not show **Demo Mode**.

## Canonical 60–90 second demo

1. Inspect the curated development, evidence and synthetic corpus. Select **Analyse evidence & generate scenarios**.
2. Choose **Designated-service assessment duty**. It asks what happens **IF** Singapore requires designated services to document and retain an illegal-content risk assessment.
3. **Approve working assumption**, then **Stress Test Firm**. Stress testing is blocked before approval.
4. Select training. Its direct result is unaffected, but its checklist dependency makes it a downstream update. Inspect the playbook → checklist → training path and evidence.
5. **Propose remediation & review**. Edit and accept a proposal; escalate the advisory's applicability question.
6. Generate the brief. Original, proposed and final reviewed text remain distinct. Export JSON or print/save PDF; outstanding approvals and publication actions remain explicit.

| Asset | Section | Canonical result |
| --- | --- | --- |
| Online Safety Compliance Playbook | 4.2 | UPDATE_REQUIRED |
| Platform Client Compliance Checklist | Step 6 | UPDATE_REQUIRED |
| Associate Training / Internal Guidance | Slide 14 | DOWNSTREAM_UPDATE |
| Template Client Advisory | Scope note | REVIEW_REQUIRED |
| Standard Contract / Platform Clause Set | Clause 2 | UNAFFECTED |

Mock mode is deliberately deterministic, not a semantic model. Editing the canonical scenario or corpus produces conservative low-confidence review flags. Live mode analyses the supplied text and does not look up canonical statuses. Changing the selected scenario or its description clears approval and all dependent results and decisions.

## Evidence and legal sign-off

The seed in `backend/data/seed.json` contains dated **curator summaries**, explicitly labelled as such, of two public regulator publications:

- [Ofcom: scrutinising illegal-harms risk assessments, 3 March 2025](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcing-the-online-safety-act-scrutinising-illegal-harms-risk-assessments).
- [IMDA: Online Safety Code announcement, 17 July 2023](https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2023/imdas-online-safety-code-comes-into-effect).

These are not statutory quotations or a complete current-law evidence base. No runtime web research occurs. The law team must verify the summaries, operative provisions, designated-service scope, commencement, record-retention requirements and current Singapore position before presenting legal conclusions. The pack does **not** establish that Singapore currently lacks a risk-assessment duty. All five internal materials are deliberately synthetic.

Evidence IDs must exist in the supplied pack, and cited passages must occur in the supplied relevant text. This verifies traceability, not legal correctness or logical support. Model confidence is not legal certainty.

## OpenRouter configuration

If needed, create `backend/.env` from its example **without overwriting an existing local file**. Keep keys server-side and uncommitted.

| Variable | Default | Meaning |
| --- | --- | --- |
| USE_MOCK_AI | true | No external AI requests |
| OPENROUTER_API_KEY | empty | Organiser-provided team key, added later |
| OPENROUTER_MODEL | empty | Exact organiser-provided identifier; never inferred or hardcoded |
| OPENROUTER_BASE_URL | https://openrouter.ai/api/v1 | Provider endpoint |
| OPENROUTER_OUTPUT_MODE | json_schema | Select json_object if the chosen model lacks strict JSON Schema support |
| AI_TIMEOUT_SECONDS | 25 | Per-request wall-clock timeout; permitted range 1–30 seconds |
| ALLOWED_ORIGINS | http://localhost:3000 | Comma-separated exact frontend origins |
| REQUIRE_AUTH | false | Verify Firebase ID tokens on analysis/report routes |
| FIREBASE_PROJECT_ID | lit2026 | Expected token audience/project |
| APP_ENV | development | production refuses startup unless REQUIRE_AUTH=true |

Set `USE_MOCK_AI=false` only after configuring both key and exact model. Restart FastAPI after changes. Invalid outputs get **one** repair attempt, including schema and provenance checks; a second invalid response fails safely. Timeouts, network failures and provider rejections return controlled errors without automatic retries or silent mock fallback. A stage can take two request timeouts if repair is needed. The UI explains how to restart in mock mode.

## Firebase persistence and Google sign-in

Use the **existing lit2026 project in Singapore**. No new Firebase project or Firebase Admin service-account private key is needed.

1. Select/add a Web app in that project and put its public web configuration into `frontend/.env.local`, following `frontend/.env.example`.
2. Enable Google in Firebase Authentication and add localhost and your deployed frontend domain to authorized domains.
3. Enable `NEXT_PUBLIC_ENABLE_AUTH=true`. For persistence also enable `NEXT_PUBLIC_ENABLE_FIRESTORE=true` and use the existing project's Firestore database. If it has not been provisioned, provision it inside that same project in the intended Singapore location.
4. Review and publish [firestore.rules](firestore.rules). It grants owner-only access to `projects/{uid}` and no delete permission. Do not leave permissive test rules enabled.
5. Restart/rebuild Next.js. Sign in, **Save project**, reload, and **Load saved project** to verify the actual cloud configuration.

The MVP stores one complete versioned snapshot per user. It includes the five assets, evidence, selected scenario, findings, proposals, decision history and brief. Save/load is explicit; unsaved state is in memory and is lost on reload/sign-out. Resetting a local run does not delete the saved snapshot. Save/load validates snapshots through FastAPI; failures preserve local working state. The frontend writes Firestore directly; the backend never accesses project state in Firebase.

Saving captures the snapshot at the time of the click and does not block analysis or local edits. Firestore acknowledgement waits are limited to 12 seconds. An unconfirmed save may still commit later when connectivity returns; the UI states this explicitly. Save again to include subsequent local changes.

With Firebase features disabled, missing credentials do not block local analysis. Enabling authentication without valid Firebase configuration intentionally shows a configuration/sign-in gate. `NEXT_PUBLIC_*` values are public: never place OpenRouter keys or private credentials there.

## Protected deployment

Vercel hosts `frontend` as the project root. Host FastAPI separately on a Python-capable HTTPS service. No automatic deployment is configured.

- Backend: `APP_ENV=production`, `REQUIRE_AUTH=true`, `FIREBASE_PROJECT_ID=lit2026`, and the exact frontend `ALLOWED_ORIGINS`.
- Frontend: `NEXT_PUBLIC_API_URL` pointing to the deployed API; Firebase authentication enabled/configured before building.
- Add the deployed/preview domains you use to Firebase authorized domains.
- Verify signed-in and signed-out requests before adding provider credentials.

`GET /health` and `GET /seed` are public. Every POST under `/analyse/*` and `/reports/*` requires an ID token when protection is enabled. The backend verifies RS256 signatures against Google's cached public certificates, audience, issuer, subject and token times. Missing/invalid/expired tokens reject before OpenRouter work. CORS is not authentication. The MVP does not implement token-revocation checks, lawyer-role certification or an immutable compliance audit ledger.

## API and code map

| Route | Purpose |
| --- | --- |
| GET /seed | Curated evidence, five assets and directed dependencies |
| POST /analyse/comparative | Stage 1 |
| POST /analyse/stress-test | Approval check, Stage 2, deterministic propagation |
| POST /analyse/remediation | Stage 3 |
| POST /reports/review-patch | Record decision without modifying an asset |
| POST /reports/generate | Validate inputs and assemble the brief |
| POST /reports/validate-project | Validate snapshots before save/restore |

- `backend/domain.py`: strict Pydantic contract with camelCase aliases; `frontend/types/domain.ts` is generated from it.
- `backend/services/pipeline.py`: contextual validation, stale-run detection, decisions and brief assembly.
- `backend/services/propagation.py`: cycle-safe upstream-to-downstream traversal, preserving stronger direct statuses and inherited evidence.
- `backend/services/ai_service.py`: shared mock/live validation and bounded recovery.
- `frontend/components/twin/Workspace.tsx`: staged desktop workflow; `frontend/lib/api.ts`: single API boundary.
- `frontend/lib/project.ts`: Firestore save/load; `backend/auth.py`: public-key token verification.

## Verification

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe export_types.py --check
cd ..\frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

After domain changes, `python export_types.py` prints updated TypeScript declarations for the generated file; `--check` fails on drift. GitHub CI runs backend tests, contract checks, frontend state tests, lint and production build.

With both local servers running in mock mode and Google Chrome installed:

```powershell
cd frontend
npm.cmd run test:smoke
```

Playwright uses installed Chrome (no browser download), traverses the real frontend/backend workflow, verifies exported JSON and scenario invalidation, and saves ignored screenshots under `.qa/`. `SMOKE_BROWSER=msedge` selects installed Edge; `SMOKE_URL` overrides the frontend URL.

Locally verified: 44 backend tests, four frontend state/persistence tests, contract synchronization, lint/build and desktop browser workflow including JSON/PDF export. Live OpenRouter responses were tested using controlled HTTP stubs, not an organiser key. Actual Firebase sign-in, Firestore rules/save-load and deployed protection still require checks against the configured cloud project; local token tests do not substitute for that integration check.
