# LegalTech Sandbox

A deliberately small full-stack starter for the SMU LIT Legal-Tech Hackathon. It provides a typed Next.js → FastAPI analysis flow while keeping OpenRouter, Firebase Authentication, and Firestore optional. Mock AI is enabled by default, so the complete core flow runs without credentials.

## Architecture

```text
Browser (Next.js + TypeScript + Tailwind)
  └─ POST /analyse
       └─ FastAPI + Pydantic
            └─ analyse_text()
                 ├─ deterministic demo service (default)
                 └─ OpenRouter OpenAI-compatible API (optional)

Browser-only optional services
  └─ Firebase client SDK
       ├─ Google Authentication
       └─ Firestore collection: analyses
```

Challenge-specific backend logic should be added under `backend/services/` and exposed through a small route under `backend/routes/`. Challenge-specific frontend features should go in `frontend/components/`. Do not add them to `ai_service.py` unless they concern the AI-provider boundary.

## Run locally

### 1. Backend

PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload
```

macOS/Linux activation uses `source .venv/bin/activate`; copy the environment file with `cp .env.example .env`.

Open:

- API health: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Paste any text and select **Analyse**. The header should display **Demo Mode**, and the result should appear without any external account or credential.

## Environment variables

Create local files from the committed templates; never commit the resulting files.

### `backend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `USE_MOCK_AI` | `true` | Prevents all provider calls and returns deterministic data. |
| `OPENROUTER_API_KEY` | empty | Organiser-provided team key for live mode. |
| `OPENROUTER_MODEL` | empty | Exact model identifier supplied by the organiser. |
| `OPENROUTER_BASE_URL` | OpenRouter API URL | OpenAI-compatible provider base URL. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed frontend origins. |

To enable OpenRouter later, edit `backend/.env`:

```dotenv
USE_MOCK_AI=false
OPENROUTER_API_KEY=the-organiser-provided-key
OPENROUTER_MODEL=the-exact-organiser-provided-model-id
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Restart FastAPI after changing the environment. Changing models requires only changing `OPENROUTER_MODEL`; no source edit is needed. OpenRouter calls, structured-output fallback, timeouts, response parsing, and validation are isolated in `backend/services/ai_service.py`; the model identifier is never hardcoded.

### `frontend/.env.local`

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI base URL. |
| `NEXT_PUBLIC_FIREBASE_*` | empty | Browser-visible Firebase web-app configuration. |
| `NEXT_PUBLIC_ENABLE_AUTH` | `false` | Shows optional Google sign-in when Firebase is configured. |
| `NEXT_PUBLIC_ENABLE_FIRESTORE` | `false` | Shows saving for a signed-in user when Firebase is configured. |

All `NEXT_PUBLIC_*` values are embedded in the browser bundle. Only Firebase web configuration and public feature flags belong there—never an OpenRouter key or Firebase Admin credential.

## Optional Firebase setup

The Firebase project already exists; do not create another one.

1. In the Firebase console, open the existing project and add or select a Web app.
2. Copy its public web configuration values into `frontend/.env.local`.
3. For Google sign-in, enable **Authentication → Sign-in method → Google**, then set `NEXT_PUBLIC_ENABLE_AUTH=true`.
4. For saving, create Firestore in the existing project's desired Singapore-region setup, set `NEXT_PUBLIC_ENABLE_FIRESTORE=true`, and add rules that allow authenticated users to create only documents whose `userId` equals their own UID.
5. Restart Next.js after changing any frontend environment value.

The client initializes Firebase only when every required web configuration value exists. Missing or unavailable Firebase configuration does not block analysis. This starter does not use Firebase Admin and requires no service-account private key.

A minimal starting Firestore rule for hackathon development is:

```text
match /analyses/{analysisId} {
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid;
  allow read, update, delete: if request.auth != null
                              && resource.data.userId == request.auth.uid;
}
```

Review and tighten rules for the eventual challenge data model.

## Checks

```powershell
cd backend
python -m pytest -q
python -c "from main import app; print(app.title)"

cd ..\frontend
npm run lint
npm run build
```

GitHub Actions runs the same frontend lint/build and backend import/tests on pushes and pull requests. It does not deploy.

## Vercel preparation

1. Push the repository to GitHub and import it in Vercel.
2. Set Vercel's **Root Directory** to `frontend`; Next.js is detected automatically.
3. Set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of the separately hosted FastAPI service.
4. Add the Firebase public web variables and feature flags only if those features are needed.
5. Add the deployed frontend origin to the backend's comma-separated `ALLOWED_ORIGINS`.
6. If Google Authentication is enabled, add the Vercel production domain (and any preview domains you use) under **Firebase Authentication → Settings → Authorized domains**.

Vercel hosts the frontend only in this setup; deploy FastAPI to a Python-capable host. No deployment is triggered by this repository.

## Five files to understand first

1. `frontend/components/AnalysisWorkspace.tsx` — UI states, analysis submission, and optional save action.
2. `frontend/lib/api.ts` — the frontend's single backend API boundary.
3. `backend/routes/analyse.py` — request validation and safe route-level errors.
4. `backend/services/ai_service.py` — mock/live switch and replaceable AI-provider integration.
5. `backend/models.py` — the shared conceptual API contract enforced by Pydantic.

Tomorrow, replace or extend the generic analysis route and service with challenge-specific capabilities. Keep provider credentials server-side, and add document processing, retrieval, agents, or other architecture only if the released challenge actually needs them.
