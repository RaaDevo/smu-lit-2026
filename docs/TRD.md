# Technical Requirements Document

## Firm Regulatory Resilience Twin

**Hackathon:** SMU LIT Legal-Tech Hackathon 2026
**Challenge:** Rajah & Tann — Designing a Sustainable and Resilient LegalTech
**Document:** Technical Requirements Document
**Application Type:** Desktop Web Application
**Prototype Domain:** Online harms / online safety regulation

---

# 1. Purpose

This document defines the technical requirements for the **Firm Regulatory Resilience Twin** hackathon prototype.

It accompanies the Product Requirements Document and specifies:

* frontend architecture;
* backend architecture;
* database architecture;
* authentication;
* AI integration;
* API structure;
* application data flow;
* deployment requirements;
* security requirements;
* testing requirements;
* technical constraints.

The system should reuse and adapt the team's existing full-stack skeleton rather than introduce a new application stack.

The primary technical objective is to deliver a reliable end-to-end vertical slice demonstrating:

```text
Regulatory Development
        ↓
Comparative Analysis
        ↓
Scenario Generation
        ↓
Lawyer-Approved Assumption
        ↓
Firm Stress Test
        ↓
Impact + Dependency Analysis
        ↓
Proposed Remediation
        ↓
Human Review
        ↓
Regulatory Resilience Brief
```

---

# 2. System Architecture

The application shall use the existing architecture:

```text
┌───────────────────────────────────────────────┐
│                  FRONTEND                     │
│                                               │
│ Next.js 16                                    │
│ React 19                                      │
│ TypeScript                                    │
│ Tailwind CSS                                  │
│ Firebase Authentication                       │
│ Firebase Web SDK                              │
└──────────────────────┬────────────────────────┘
                       │
                       │ HTTPS / JSON API
                       ▼
┌───────────────────────────────────────────────┐
│                  BACKEND                      │
│                                               │
│ FastAPI                                       │
│ Python                                        │
│ Pydantic                                      │
│ Deterministic application logic               │
│ AI orchestration                              │
└──────────────────────┬────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
┌───────────────────┐   ┌───────────────────────┐
│     OpenRouter    │   │ Firebase Cloud        │
│                   │   │ Firestore             │
│ LLM inference     │   │                       │
└───────────────────┘   └───────────────────────┘
```

The system shall remain a conventional web application.

The project does **not** require:

* a graph database;
* a vector database;
* microservices;
* Kubernetes;
* distributed agents;
* WebSockets;
* native desktop software;
* native mobile software.

---

# 3. Frontend

## 3.1 Technology Stack

The frontend shall continue using the existing stack:

```text
Framework       Next.js 16
UI Library      React 19
Language        TypeScript
Styling         Tailwind CSS
Hosting         Vercel
Authentication  Firebase Authentication
Database SDK    Firebase Web SDK
```

The existing Next.js application shall be adapted rather than rebuilt.

---

# 4. Frontend Responsibilities

The frontend shall be responsible for:

* rendering the regulatory resilience dashboard;
* displaying regulatory developments;
* allowing lawyers to inspect comparative analysis;
* displaying generated Singapore scenarios;
* capturing lawyer approval or modification of scenarios;
* initiating firm stress tests;
* visualising affected firm assets;
* visualising dependency propagation;
* displaying impact findings;
* displaying remediation suggestions;
* allowing users to approve, reject, edit or escalate recommendations;
* displaying the final Regulatory Resilience Brief;
* authenticating users through Google;
* reading and writing application state to Firebase where appropriate;
* communicating with the FastAPI backend.

The frontend shall **not** contain OpenRouter API keys or other server-side secrets.

---

# 5. Primary Frontend Views

The MVP should contain the following primary screens.

## 5.1 Authentication Screen

Displayed when authentication is enabled and no valid Firebase user session exists.

Primary action:

```text
Continue with Google
```

No username/password authentication needs to be implemented for the MVP.

---

## 5.2 Regulatory Resilience Dashboard

The dashboard shall provide an overview of:

* regulatory developments;
* active stress tests;
* assets requiring review;
* current resilience status.

Example:

```text
┌────────────────────────────────────────────────────┐
│ Regulatory Resilience Dashboard                    │
├────────────────────────────────────────────────────┤
│ Emerging Developments   Active Tests   Reviews     │
│          3                  2             4         │
├────────────────────────────────────────────────────┤
│ Recent Regulatory Signals                          │
│                                                    │
│ UK Online Safety Development            HIGH       │
│ Singapore Consultation                  HIGH       │
│ Australian Safety Standard              MEDIUM     │
├────────────────────────────────────────────────────┤
│ Firm Resilience                                     │
│                                                    │
│ 2 Update Required                                  │
│ 1 Review Required                                  │
│ 1 Downstream Update                                │
└────────────────────────────────────────────────────┘
```

---

# 6. Stress-Test Workspace

The primary application workflow should occur within a dedicated desktop workspace.

Suggested layout:

```text
┌─────────────────────────────────────────────────────┐
│ Development / Scenario                              │
├──────────────┬──────────────────────┬───────────────┤
│              │                      │               │
│ Development  │ Main Analysis        │ Evidence /    │
│ + Scenario   │ Workspace            │ Details       │
│              │                      │               │
│              │                      │               │
└──────────────┴──────────────────────┴───────────────┘
```

The interface should prioritise legal decision-making over conversational chat.

A chatbot interface is not required.

---

# 7. Dependency Visualisation

The frontend shall provide a visual representation of relationships between regulatory assumptions and firm assets.

Example:

```text
REGULATORY ASSUMPTION
          │
          ▼
Compliance Playbook §4.2
          │
          ├──────────────┐
          ▼              ▼
Checklist Step 6    Client Advisory
          │
          ▼
Training Slide 14
```

The MVP does not require a production graph visualisation engine.

The visualisation may be implemented using:

* React components;
* SVG;
* CSS;
* a lightweight graph library if implementation time permits.

The visualisation must support:

* nodes;
* directed relationships;
* impact status;
* asset names;
* affected sections;
* selection/click interaction.

The technical priority is **clarity**, not graph sophistication.

---

# 8. Impact Status Presentation

The frontend shall visually distinguish:

```text
UNAFFECTED

MONITOR

REVIEW REQUIRED

UPDATE REQUIRED

DOWNSTREAM UPDATE
```

Each affected asset should expose:

* asset title;
* affected section;
* impact status;
* severity;
* reasoning;
* confidence;
* evidence;
* upstream dependency;
* downstream dependencies.

---

# 9. Remediation Interface

Proposed changes should preferably use a diff-style interface.

Example:

```diff
- Platforms are not required to conduct formal risk assessments.

+ Covered platforms should be assessed for whether the new
+ risk-assessment obligation applies. Where applicable, the
+ compliance workflow must include documented risk assessment.
```

The user shall be able to select:

```text
APPROVE
REJECT
EDIT
ESCALATE
```

AI-generated changes must never silently overwrite the original firm material.

---

# 10. Frontend State

Temporary UI state may be maintained using React state.

Persistent state shall be stored in Firebase Cloud Firestore.

The application should avoid introducing additional state-management libraries unless required.

For the hackathon MVP:

```text
React state
     ↓
temporary interface state

Firestore
     ↓
persistent projects, scenarios,
findings, reviews and reports
```

---

# 11. Backend

## 11.1 Technology Stack

The backend shall continue using:

```text
Framework          FastAPI
Language           Python
Validation         Pydantic
AI Provider        OpenRouter
Development Mode   Mock AI supported
API Format         JSON
```

The existing FastAPI skeleton should be adapted rather than replaced.

---

# 12. Backend Responsibilities

The backend shall be responsible for:

* receiving structured requests from the frontend;
* validating requests using Pydantic;
* calling OpenRouter;
* enforcing structured AI outputs;
* analysing regulatory developments;
* producing comparative assessments;
* generating scenarios;
* analysing firm assets;
* detecting stale assumptions;
* determining impact findings;
* traversing dependency relationships;
* proposing remediation;
* performing adversarial review;
* generating resilience brief content;
* returning validated structured JSON.

The backend should remain stateless wherever practical.

Persistent user/application state should primarily reside in Firestore.

---

# 13. AI Service

The existing `ai_service` abstraction shall be retained.

Conceptually:

```text
FastAPI endpoint
       ↓
Application service
       ↓
AI service
   ↙       ↘
Mock AI   OpenRouter
```

The AI provider shall remain model-agnostic.

Required environment variables:

```env
USE_MOCK_AI=true

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

No model identifier should be hardcoded into application logic.

---

# 14. Mock Mode

The existing mock AI capability shall remain available.

When:

```env
USE_MOCK_AI=true
```

the backend should return deterministic structured results without calling OpenRouter.

Mock mode shall support:

* local development;
* frontend testing;
* demo fallback;
* API failure fallback where appropriate.

The known hackathon demonstration scenario should have a deterministic mock response available.

---

# 15. Structured AI Outputs

LLM responses shall not be passed directly to the frontend as unrestricted prose.

Each AI stage should return structured JSON matching a Pydantic schema.

Example:

```python
class ImpactFinding(BaseModel):
    asset_id: str
    section: str
    status: str
    severity: str
    reasoning: str
    confidence: float
    evidence: list[str]
    downstream_assets: list[str]
```

If model output fails validation:

```text
LLM Response
     ↓
Parse
     ↓
Pydantic Validation
     ↓
Retry / Repair if invalid
     ↓
Validated Response
     ↓
Frontend
```

This reduces demo failures and inconsistent UI rendering.

---

# 16. AI Pipeline

The conceptual AI stages are:

```text
Scout
↓
Researcher
↓
Comparative Analyst
↓
Scenario Analyst
↓
Impact Analyst
↓
Remediation Agent
↓
Reviewer
```

These labels represent responsibilities.

The MVP does **not** require seven autonomous agents.

Implementation should preferably use sequential backend functions with structured LLM calls.

Example:

```python
analyse_development()

generate_comparative_assessment()

generate_scenarios()

analyse_asset_impact()

generate_remediation()

review_analysis()
```

---

# 17. Deterministic Logic

LLMs should not perform work that can be handled reliably by ordinary application code.

The backend shall use deterministic logic for:

* dependency traversal;
* finding downstream assets;
* status counts;
* sorting findings;
* project state transitions;
* aggregating results;
* calculating dashboard totals;
* report assembly where practical.

Example dependency traversal:

```text
Affected Asset
      ↓
Dependency table
      ↓
Find direct dependants
      ↓
Traverse downstream relationships
      ↓
Mark inherited impact
```

This logic should not require an LLM.

---

# 18. Backend API

The existing `/health` endpoint shall remain.

```http
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

# 19. Analysis API

The generic existing analysis functionality should be adapted to support the regulatory resilience workflow.

Recommended endpoints:

```text
POST /analyse/comparative

POST /analyse/scenarios

POST /analyse/stress-test

POST /analyse/remediation

POST /analyse/review

POST /reports/generate
```

The exact number of endpoints may be reduced during implementation if a simpler API provides the same workflow.

---

# 20. Comparative Analysis Endpoint

```http
POST /analyse/comparative
```

Input:

```json
{
  "development": {},
  "selected_jurisdictions": [
    "United Kingdom",
    "Australia"
  ]
}
```

Output:

```json
{
  "assessments": [
    {
      "jurisdiction": "United Kingdom",
      "relevance": "HIGH",
      "reasoning": "...",
      "sources": []
    }
  ]
}
```

---

# 21. Scenario Generation Endpoint

```http
POST /analyse/scenarios
```

Input:

```json
{
  "development": {},
  "comparative_assessments": [],
  "singapore_context": []
}
```

Output:

```json
{
  "scenarios": [
    {
      "id": "scenario-a",
      "title": "Broad statutory duty",
      "description": "...",
      "assumptions": [],
      "evidence": [],
      "uncertainty": "MEDIUM",
      "status": "AI_GENERATED_SCENARIO"
    }
  ]
}
```

---

# 22. Stress-Test Endpoint

```http
POST /analyse/stress-test
```

Input:

```json
{
  "scenario": {},
  "firm_assets": [],
  "dependencies": []
}
```

Output:

```json
{
  "findings": [],
  "dependency_impacts": [],
  "summary": {
    "assets_analysed": 5,
    "update_required": 2,
    "review_required": 1,
    "downstream_update": 1,
    "unaffected": 1
  }
}
```

This endpoint forms the core technical demonstration.

---

# 23. Remediation Endpoint

```http
POST /analyse/remediation
```

Input:

```json
{
  "scenario": {},
  "impact_findings": [],
  "firm_assets": []
}
```

Output:

```json
{
  "patches": [
    {
      "impact_id": "impact-001",
      "original_text": "...",
      "proposed_text": "...",
      "reasoning": "...",
      "status": "PENDING_REVIEW"
    }
  ]
}
```

---

# 24. Adversarial Review Endpoint

```http
POST /analyse/review
```

The reviewer should inspect the current analysis for:

* unsupported claims;
* incorrect source use;
* missed dependencies;
* scenario/current-law confusion;
* contradictions;
* overconfidence;
* remediation inconsistencies.

Output:

```json
{
  "issues": [],
  "review_status": "PASSED_WITH_WARNINGS"
}
```

---

# 25. Report Endpoint

```http
POST /reports/generate
```

The endpoint should assemble the final Regulatory Resilience Brief.

It should primarily combine previously generated structured information rather than regenerate the entire analysis from scratch.

---

# 26. Database

## 26.1 Database Technology

The application shall use:

> **Firebase Cloud Firestore**

Firestore will be the primary persistent database for the prototype.

No SQL database is required.

No graph database is required.

No separate vector database is required for the MVP.

---

# 27. Firestore Data Structure

Recommended top-level structure:

```text
users/
projects/
```

Project-specific data should preferably be stored as subcollections.

Example:

```text
users/
└── {uid}

projects/
└── {projectId}
    ├── developments/
    │   └── {developmentId}
    │
    ├── comparativeAssessments/
    │   └── {assessmentId}
    │
    ├── scenarios/
    │   └── {scenarioId}
    │
    ├── firmAssets/
    │   └── {assetId}
    │
    ├── dependencies/
    │   └── {dependencyId}
    │
    ├── impactFindings/
    │   └── {findingId}
    │
    ├── proposedPatches/
    │   └── {patchId}
    │
    ├── reviewDecisions/
    │   └── {decisionId}
    │
    └── resilienceBriefs/
        └── {briefId}
```

This keeps the hackathon data model understandable and avoids unnecessary database complexity.

---

# 28. Project Document

Example:

```json
{
  "name": "Online Safety Stress Test",
  "ownerUid": "firebase-user-id",
  "status": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 29. Regulatory Development

```json
{
  "id": "dev-001",
  "title": "...",
  "jurisdiction": "United Kingdom",
  "type": "REGULATION",
  "status": "FOREIGN_DEVELOPMENT",
  "date": "...",
  "summary": "...",
  "sources": []
}
```

---

# 30. Scenario

```json
{
  "id": "scenario-b",
  "title": "...",
  "description": "...",
  "assumptions": [],
  "evidence": [],
  "uncertainty": "MEDIUM",
  "status": "LAWYER_APPROVED_WORKING_ASSUMPTION",
  "approvedBy": "...",
  "approvedAt": "..."
}
```

---

# 31. Firm Asset

```json
{
  "id": "asset-playbook",
  "title": "Online Safety Compliance Playbook",
  "type": "PLAYBOOK",
  "owner": "Knowledge Lawyer",
  "version": "1.0",
  "content": "...",
  "assumptions": []
}
```

For the MVP, the five synthetic firm assets should be seeded into Firestore.

Required demo corpus:

```text
1. Online Safety Compliance Playbook

2. Platform Client Compliance Checklist

3. Template Client Advisory

4. Standard Contract / Platform Clause Set

5. Associate Training / Internal Guidance Document
```

---

# 32. Dependency

Dependencies should be stored explicitly.

Example:

```json
{
  "sourceAssetId": "playbook",
  "targetAssetId": "checklist",
  "relationship": "DERIVES_FROM",
  "explanation": "Checklist Step 6 implements Playbook §4.2."
}
```

This enables deterministic impact propagation.

---

# 33. Impact Finding

```json
{
  "assetId": "playbook",
  "section": "4.2",
  "status": "UPDATE_REQUIRED",
  "severity": "HIGH",
  "reasoning": "...",
  "evidence": [],
  "confidence": 0.91,
  "downstreamAssetIds": [
    "checklist",
    "training"
  ]
}
```

---

# 34. Proposed Patch

```json
{
  "impactId": "impact-001",
  "originalText": "...",
  "proposedText": "...",
  "reasoning": "...",
  "status": "PENDING_REVIEW"
}
```

---

# 35. Review Decision

```json
{
  "patchId": "patch-001",
  "reviewerUid": "...",
  "decision": "APPROVE",
  "note": "...",
  "timestamp": "..."
}
```

The original text must remain stored even after approval.

---

# 36. Authentication

## 36.1 Authentication Provider

Authentication shall use:

> **Firebase Authentication**

The primary authentication method shall be:

> **Google Sign-In**

No custom password authentication system should be developed.

---

# 37. Authentication Flow

Expected user flow:

```text
User opens application
        ↓
Firebase checks session
        ↓
No active session
        ↓
Sign in with Google
        ↓
Google account selection
        ↓
Firebase authentication
        ↓
Firebase user created / restored
        ↓
User enters dashboard
```

---

# 38. Google Sign-In UI

Authentication should be deliberately minimal.

Example:

```text
┌───────────────────────────────────────┐
│ Firm Regulatory Resilience Twin       │
│                                       │
│ Regulatory intelligence for resilient│
│ legal knowledge systems.              │
│                                       │
│      [ Continue with Google ]         │
└───────────────────────────────────────┘
```

Authentication is infrastructure rather than the core demo feature.

---

# 39. Authentication Configuration

Frontend environment configuration should include the existing Firebase web configuration.

Example:

```env
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_FIRESTORE=true

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase Web configuration values may be exposed to the frontend as intended by Firebase.

Private server credentials must never be included in `NEXT_PUBLIC_*` variables.

---

# 40. Firestore Access Control

Firestore Security Rules should require authentication for persistent user data.

At minimum:

```text
Unauthenticated user
        ↓
Cannot access project data

Authenticated user
        ↓
Can access projects they own
```

Project documents should therefore contain:

```text
ownerUid
```

For the hackathon MVP, sophisticated role-based permissions are not required.

---

# 41. Backend Authentication

The MVP backend may remain stateless.

The frontend can authenticate through Firebase and access Firestore directly using Firebase Security Rules.

If protected backend endpoints are required, the frontend should send the Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

The backend should verify the token before processing authenticated requests.

This can be added once the main vertical slice works.

Authentication must not become a blocker for completing the core stress-test workflow.

---

# 42. Source and Provenance Requirements

Legal information must preserve provenance.

Relevant data objects should support:

```text
source title
authority
URL
jurisdiction
source type
relevant passage
confidence
legal status
```

The application must distinguish:

```text
FACT

FOREIGN DEVELOPMENT

INFERENCE

SCENARIO

LAWYER VIEW
```

These labels should be represented explicitly in structured backend output rather than inferred by frontend styling.

---

# 43. Human Judgement Gate

The system shall not automatically convert an AI-generated scenario into a firm assumption.

Required state transition:

```text
AI_GENERATED_SCENARIO
        ↓
Lawyer reviews
        ↓
Approve / Modify / Reject
        ↓
LAWYER_APPROVED_WORKING_ASSUMPTION
        ↓
Stress Test Firm
```

The backend should reject or warn against stress-testing an unapproved scenario where practical.

---

# 44. Application Data Flow

The target end-to-end technical flow is:

```text
1. User signs in with Google
             ↓
2. Dashboard loads project data from Firestore
             ↓
3. User selects regulatory development
             ↓
4. Frontend calls FastAPI
             ↓
5. FastAPI calls OpenRouter
             ↓
6. Structured comparative analysis returned
             ↓
7. Scenario analysis generated
             ↓
8. Lawyer approves/modifies scenario
             ↓
9. Approved scenario persisted to Firestore
             ↓
10. User selects STRESS TEST FIRM
             ↓
11. Firm assets + scenario sent to backend
             ↓
12. LLM identifies semantic impacts
             ↓
13. Deterministic backend traverses dependencies
             ↓
14. Impact findings returned
             ↓
15. Findings persisted
             ↓
16. Remediation generated
             ↓
17. Lawyer approves/rejects/edits
             ↓
18. Decisions persisted
             ↓
19. Resilience Brief assembled
```

---

# 45. Error Handling

Frontend requests must support:

```text
Loading

Success

Empty result

Validation error

Backend unavailable

AI provider unavailable

Unexpected error
```

Errors should be displayed in plain professional language.

The UI should never expose:

* stack traces;
* API keys;
* internal prompts;
* provider secrets.

---

# 46. AI Failure Handling

If OpenRouter fails:

```text
OpenRouter request
       ↓
Failure
       ↓
Backend returns controlled error
       ↓
Frontend displays retry option
```

For judging, the known demo scenario should also support mock/deterministic data.

This prevents model-provider or network failures from destroying the demonstration.

---

# 47. Environment Configuration

## Frontend

```env
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_FIRESTORE=true

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Backend

```env
USE_MOCK_AI=true

OPENROUTER_API_KEY=
OPENROUTER_MODEL=

ALLOWED_ORIGINS=
```

Secrets must only exist in local `.env` files or deployment environment configuration.

They must never be committed to GitHub.

---

# 48. Deployment

## Frontend

The frontend shall deploy through:

> **Vercel**

using the existing configuration.

```text
Repository Root
     ↓
frontend/
     ↓
Next.js
     ↓
Vercel
```

---

# 49. Backend

The FastAPI backend requires a publicly accessible HTTPS endpoint for the deployed frontend.

Conceptually:

```text
Vercel
   ↓
NEXT_PUBLIC_API_URL
   ↓
Public FastAPI deployment
   ↓
OpenRouter
```

The specific backend hosting provider is not an architectural requirement and may be selected during implementation based on hackathon speed and reliability.

---

# 50. Firebase

The existing Firebase project shall provide:

```text
Firebase Authentication
        +
Cloud Firestore
```

The deployed Vercel domain must be added to Firebase Authentication's authorised domains before Google Sign-In is used in production.

---

# 51. Browser Requirements

The prototype is intended for modern desktop Chromium-based browsers.

Primary targets:

```text
Google Chrome
Microsoft Edge
```

Other modern desktop browsers may function but do not require dedicated hackathon testing.

---

# 52. Constraints

## Platform Constraint

The product shall be:

> **Desktop only**

The MVP does not require mobile responsiveness.

---

## Application Constraint

The product shall be:

> **Web application only**

No native:

* Windows application;
* macOS application;
* iOS application;
* Android application

shall be developed.

---

## Screen Constraint

The application should be optimised for laptop and desktop displays.

Recommended minimum viewport:

```text
1280px width
```

Primary design target:

```text
1440px desktop/laptop
```

Mobile layouts do not need to be designed or tested.

---

# 53. Hackathon Scope Constraints

The MVP shall prioritise one reliable end-to-end workflow over infrastructure sophistication.

The following are explicitly **not required**:

```text
Production-grade legal search

Full automated horizon scanning

Continuous background workers

Vector database

Graph database

Complex RAG pipeline

OCR pipeline

Multiple independent autonomous agents

Real law-firm confidential documents

Enterprise IAM

Complex role-based access control

Mobile application

Multi-tenant enterprise architecture

Real-time collaboration

Automatic rewriting of source documents
```

---

# 54. Synthetic Demo Data

The MVP should use controlled synthetic firm documents.

This enables the law members to establish known expected impacts before the AI is tested.

The demo should therefore have:

```text
Known scenario
      +
Known firm artefacts
      +
Known dependencies
      +
Known expected stale sections
```

This provides a ground-truth test for whether the AI pipeline is behaving correctly.

---

# 55. Performance Requirements

For the hackathon prototype:

### Navigation

Normal UI navigation should feel immediate.

### Database

Firestore reads should not materially delay page rendering.

### AI

AI analysis may take several seconds.

The frontend must provide visible progress/loading feedback rather than appearing frozen.

### Dependency Traversal

Dependency propagation should execute deterministically and effectively instantaneously for the small MVP corpus.

---

# 56. Reliability Requirements

The judging demo must support both:

```text
LIVE MODE
Frontend
→ FastAPI
→ OpenRouter
→ live structured result
```

and:

```text
DEMO FALLBACK
Frontend
→ FastAPI
→ deterministic mock response
```

Mock mode must preserve the same response schema as live mode.

The frontend should not require modification when switching between live and mock AI.

---

# 57. Security Requirements

The prototype shall:

* keep OpenRouter API keys server-side;
* avoid committing `.env` files;
* restrict Firestore data through Firebase Security Rules;
* authenticate users through Firebase;
* avoid storing Google passwords;
* sanitise or safely render model-generated content;
* validate backend input using Pydantic;
* validate AI outputs before returning them to the frontend;
* restrict CORS to known frontend origins in deployment;
* preserve original firm document content during remediation;
* visibly distinguish AI-generated material from established legal information.

---

# 58. Testing Requirements

## Backend

Maintain tests for:

```text
GET /health

valid analysis request

invalid / empty request

structured response validation

mock AI mode

dependency traversal
```

Additional high-value test:

```text
Known demo scenario
        ↓
Known affected assets
        ↓
Expected statuses
```

This should verify the core product thesis rather than merely API availability.

---

# 59. Frontend

Before submission:

```text
npm lint

npm build
```

The primary workflow should also be manually tested:

```text
Login
  ↓
Dashboard
  ↓
Select development
  ↓
Generate scenario
  ↓
Approve scenario
  ↓
Stress Test Firm
  ↓
Inspect graph
  ↓
Inspect affected asset
  ↓
Review remediation
  ↓
Generate brief
```

---

# 60. Core Acceptance Test

The prototype is technically successful when a user can complete the following without developer intervention:

```text
1. Open deployed web application.

2. Sign in using Google.

3. Open a regulatory development.

4. View comparative analysis.

5. Generate Singapore scenarios.

6. Select or modify one scenario.

7. Approve it as a working assumption.

8. Click "Stress Test Firm".

9. Analyse five synthetic firm assets.

10. Receive structured impact findings.

11. See affected dependencies visually.

12. Open an affected section.

13. View the reason it became stale.

14. View a proposed remediation patch.

15. Approve, reject or edit the patch.

16. Generate a final Regulatory Resilience Brief.
```

---

# 61. MVP Technical Priority

Implementation should occur in the following priority order:

```text
1. Data models

2. Synthetic firm corpus

3. Core FastAPI stress-test endpoint

4. Structured OpenRouter output

5. Deterministic dependency propagation

6. Basic stress-test frontend

7. Impact visualisation

8. Remediation

9. Lawyer review controls

10. Resilience Brief

11. Firestore persistence

12. Google authentication

13. Dashboard polish
```

Google Sign-In and Firestore should be incorporated into the finished prototype, but they must not delay completion of the core resilience workflow.

---

# 62. Existing Repository Strategy

## KEEP

```text
Next.js
React
TypeScript
Tailwind

FastAPI
Pydantic

frontend/backend API layer

OpenRouter service

environment configuration

mock AI mode

CORS handling

testing infrastructure

GitHub CI

Vercel frontend configuration

Firebase wiring
```

## ADAPT

```text
/analyse functionality

Pydantic request/response models

AI prompts

generic analysis UI

result components

mock responses
```

## NEW

```text
RegulatoryDevelopment

ComparativeAssessment

Scenario

FirmAsset

Dependency

ImpactFinding

ProposedPatch

ReviewDecision

ResilienceBrief

Google Sign-In screen

Firestore project persistence

regulatory dashboard

scenario approval gate

firm stress-test workspace

dependency visualisation

diff-based remediation interface

resilience report view
```

## REMOVE

Any remaining generic starter functionality that does not support the regulatory resilience workflow.

---

# 63. Technical Design Principle

Every technical feature should ultimately support:

```text
CHANGE
   ↓
UNDERSTAND
   ↓
STRESS TEST
   ↓
TRACE IMPACT
   ↓
REPAIR
```

The application does not need to demonstrate the most sophisticated possible technical architecture.

It needs to demonstrate a **credible, reliable and explainable system** capable of determining:

> **If this legal position changes, what inside the firm becomes stale, why does it become stale, what else does it affect, and what should happen next?**

That end-to-end capability is the primary technical requirement.
