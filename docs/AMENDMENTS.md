# PRD/TRD Freeze Amendments

These amendments supersede any conflicting wording in the existing PRD and TRD.

The purpose is to remove implementation ambiguity before technical planning begins.

---

# 1. MVP Mode

## Decision

The hackathon MVP demonstrates only:

> **Proactive Stress-Test Mode**

The primary demonstration begins with a curated foreign regulatory development and asks what would happen inside the firm **if Singapore adopted a specified regulatory position**.

Reactive Mode remains part of the broader product vision but is outside the primary MVP workflow.

## MVP Flow

```text
Curated Foreign Regulatory Development
              ↓
Curated Legal Evidence
              ↓
Comparative + Singapore Scenario Analysis
              ↓
Lawyer Selects / Edits ONE Scenario
              ↓
Lawyer Approves Working Assumption
              ↓
Stress Test Firm
              ↓
Direct Impact Detection
              ↓
Deterministic Dependency Propagation
              ↓
Proposed Remediation
              ↓
Human Review
              ↓
Regulatory Resilience Brief
```

Reactive Mode may later use the same resilience engine without requiring hypothetical scenario generation.

---

# 2. Regulatory Monitoring Scope

Replace language stating that the MVP:

> continuously identifies regulatory developments

with:

> **The platform ingests or surfaces relevant regulatory developments for analysis.**

Continuous automated regulatory monitoring is a future-state capability.

For the MVP, the regulatory development used in the demonstration is pre-seeded.

---

# 3. Legal Research and Evidence

## Decision

The MVP shall **not perform autonomous live legal research or open-web legal discovery during the judging workflow**.

Instead, the application shall use a:

> **Curated Demo Evidence Pack**

The evidence pack shall contain the legal materials required for the known demonstration scenario.

This may include:

* the selected foreign regulatory development;
* relevant foreign legislation or regulatory material;
* selected Singapore legislation or regulatory material;
* relevant government or regulator materials;
* explanatory excerpts required for comparative analysis.

The AI may analyse, compare and reason over these materials.

It shall not be required to independently discover them during the demo.

---

# 4. Evidence Pack Structure

Each legal source should use a structured representation such as:

```text
LegalSource
├── id
├── title
├── authority
├── jurisdiction
├── sourceType
├── legalStatus
├── url
├── relevantText
└── date
```

Example source types:

```text
LEGISLATION
REGULATION
REGULATORY_GUIDANCE
GOVERNMENT_PUBLICATION
CONSULTATION
COURT_DECISION
```

Example legal statuses:

```text
CURRENT_LAW
FOREIGN_DEVELOPMENT
PROPOSED_LAW
GUIDANCE
```

Every material AI conclusion should reference one or more `LegalSource` IDs.

---

# 5. Scenario Scope

For the MVP, the system shall generate a limited set of possible Singapore scenarios.

The lawyer may:

```text
SELECT ONE SCENARIO
        ↓
OPTIONALLY EDIT IT
        ↓
APPROVE IT
        ↓
STRESS TEST
```

The MVP shall **not** support:

* combining scenarios;
* running simultaneous scenarios;
* scenario-vs-scenario impact comparison.

Those remain stretch features.

---

# 6. Lawyer Judgement Gate

The scenario used for firm analysis must have the status:

```text
LAWYER_APPROVED_WORKING_ASSUMPTION
```

Required transition:

```text
AI_GENERATED_SCENARIO
        ↓
Lawyer selects
        ↓
Lawyer optionally edits
        ↓
Lawyer approves
        ↓
LAWYER_APPROVED_WORKING_ASSUMPTION
        ↓
Stress Test Firm
```

The system must not present the approved scenario as current Singapore law.

---

# 7. Definition of Propagation

For the MVP:

> **Propagation means propagating the impact and required remediation through the firm's dependency network.**

It does **not** mean automatically modifying all affected downstream documents.

Example:

```text
Regulatory Assumption
        ↓
Playbook §4.2
UPDATE_REQUIRED
        ↓
Checklist Step 6
UPDATE_REQUIRED
        ↓
Training Guidance
DOWNSTREAM_UPDATE
```

The system therefore propagates:

* impact;
* status;
* review requirements;
* remediation requirements;

while preserving human control over actual document changes.

---

# 8. Firm Corpus

The MVP uses five seeded synthetic firm artefacts:

```text
A. Online Safety Compliance Playbook

B. Platform Client Compliance Checklist

C. Associate Training / Internal Guidance

D. Template Client Advisory

E. Standard Contract / Platform Clause Set
```

The corpus shall be deliberately constructed so that the expected impact of the known scenario is known before AI analysis occurs.

---

# 9. Ground-Truth Acceptance Scenario

The team shall define one canonical demo scenario and expected result before implementation is considered complete.

Illustrative acceptance result:

```text
Asset A — Online Safety Compliance Playbook
Section 4.2
→ UPDATE_REQUIRED

Asset B — Platform Client Compliance Checklist
Step 6
→ UPDATE_REQUIRED

Asset C — Associate Training / Internal Guidance
Relevant section
→ DOWNSTREAM_UPDATE

Asset D — Template Client Advisory
Relevant section
→ REVIEW_REQUIRED

Asset E — Standard Contract / Platform Clause Set
→ UNAFFECTED
```

The final exact affected sections shall be determined from the synthetic documents produced by the law team.

This expected result becomes the core integration test.

---

# 10. Dependency Schema

Previous `sourceAssetId` / `targetAssetId` terminology shall not be used.

Dependencies shall use explicit directionality:

```text
Dependency
├── id
├── upstreamAssetId
├── downstreamAssetId
├── relationship
└── explanation
```

Example:

```json
{
  "upstreamAssetId": "playbook",
  "downstreamAssetId": "checklist",
  "relationship": "IMPLEMENTS",
  "explanation": "Checklist Step 6 implements the guidance contained in Playbook §4.2."
}
```

All deterministic graph traversal shall proceed:

```text
UPSTREAM
   ↓
DOWNSTREAM
```

This direction must remain consistent throughout the frontend, backend and Firestore model.

---

# 11. Responsibility for Persistence

## Decision

For the MVP:

> **The frontend owns Firestore persistence. FastAPI is a stateless analysis service.**

Architecture:

```text
Firebase Auth
     ↓
Next.js Frontend
     │
     ├──────────────→ Firestore
     │                Persistent application state
     │
     ↓
FastAPI
Stateless analysis service
     ↓
OpenRouter
```

The frontend shall:

* load project information from Firestore;
* load firm assets;
* load scenarios;
* send complete analysis inputs to FastAPI;
* receive validated analysis results;
* persist those results back to Firestore.

FastAPI shall **not** independently read project state from Firestore during the MVP.

Firebase Admin database access is therefore unnecessary for ordinary application persistence.

---

# 12. Authentication Status

Firebase Authentication and Firestore are:

> **Supporting MVP infrastructure**

They are not stretch features.

However, they remain lower implementation priority than the working regulatory resilience flow.

Recommended build sequence:

```text
Core local resilience workflow
        ↓
AI pipeline
        ↓
Dependency propagation
        ↓
Remediation workflow
        ↓
Firestore persistence
        ↓
Google Sign-In
        ↓
Deployment protection
```

The product must work locally before authentication is allowed to become an integration blocker.

---

# 13. Google Authentication

Authentication shall use:

```text
Firebase Authentication
        +
Google Sign-In
```

No custom username/password authentication system shall be developed.

---

# 14. Backend Authentication

Development and deployed behaviour shall differ.

## Local Development / Mock Mode

Authentication may be disabled locally.

Example:

```env
REQUIRE_AUTH=false
```

## Deployed Application

Authentication shall be required for endpoints that can invoke AI or generate analysis.

Protected routes include:

```text
/analyse/*
/reports/*
```

Frontend request:

```http
Authorization: Bearer <firebase-id-token>
```

FastAPI shall verify the Firebase ID token before invoking OpenRouter.

Requests with:

* missing token;
* invalid token;
* expired token

shall be rejected.

CORS shall **not** be treated as authentication or API protection.

---

# 15. AI Pipeline

The conceptual responsibilities remain:

```text
Scout
Researcher
Comparative Analyst
Scenario Analyst
Impact Analyst
Remediation Agent
Reviewer
```

However, these shall **not** map one-to-one to live LLM calls.

For the MVP, the primary live pipeline should contain approximately three major AI stages.

## Stage 1 — Comparative + Scenario Analysis

Input:

```text
Curated regulatory development
+
Curated comparator sources
+
Curated Singapore sources
```

Output:

```text
Comparative assessment
+
Singapore scenarios
+
Source references
```

---

## Human Gate

```text
Select
↓
Edit if necessary
↓
Approve ONE working assumption
```

---

## Stage 2 — Impact Analysis

Input:

```text
Lawyer-approved assumption
+
Five synthetic firm artefacts
```

AI identifies semantic direct impacts.

Deterministic code then propagates impact through dependencies.

---

## Stage 3 — Remediation + Review

Input:

```text
Approved assumption
+
Impact findings
+
Affected asset text
+
Evidence
```

Output:

```text
Proposed remediation
+
Adversarial review
+
Outstanding legal questions
```

This keeps live model latency and failure exposure manageable.

---

# 16. No Live Scout or Researcher in MVP

The names `Scout` and `Researcher` remain useful descriptions of future product responsibilities.

They do not perform open-web discovery during the hackathon demo.

For the MVP:

```text
Scout responsibility
→ represented by seeded RegulatoryDevelopment data

Researcher responsibility
→ represented by curated LegalSource data
```

The AI begins from supplied evidence.

---

# 17. Structured API Schema

All JSON exposed across the API boundary shall use:

> **camelCase**

Example:

```json
{
  "assetId": "asset-a",
  "downstreamAssetIds": ["asset-b", "asset-c"]
}
```

Python code may use `snake_case` internally.

Pydantic aliases shall serialize API responses as camelCase.

---

# 18. Strict Status Types

Free-form strings shall not be accepted for application statuses.

Impact statuses:

```text
UNAFFECTED
MONITOR
REVIEW_REQUIRED
UPDATE_REQUIRED
DOWNSTREAM_UPDATE
```

Severity:

```text
LOW
MEDIUM
HIGH
```

Scenario status:

```text
AI_GENERATED_SCENARIO
LAWYER_APPROVED_WORKING_ASSUMPTION
REJECTED
```

Patch status:

```text
PENDING_REVIEW
APPROVED
REJECTED
EDITED
ESCALATED
```

These shall be represented using Python Enums or `Literal` types.

---

# 19. Confidence

Confidence must satisfy:

```text
0.0 ≤ confidence ≤ 1.0
```

Values outside this range must fail validation.

Confidence should indicate model confidence in the particular finding, not legal certainty.

---

# 20. Structured Evidence References

The following shall not be accepted:

```json
{
  "evidence": [
    "UK law says this"
  ]
}
```

Instead:

```text
EvidenceReference
├── sourceId
├── relevantText
└── explanation
```

Example:

```json
{
  "sourceId": "uk-source-01",
  "relevantText": "Relevant extracted passage...",
  "explanation": "This establishes the relevant platform obligation."
}
```

The backend must validate that referenced source IDs exist in the supplied evidence set.

---

# 21. Impact Finding Schema

Conceptually:

```text
ImpactFinding
├── id
├── assetId
├── section
├── status
├── severity
├── reasoning
├── evidence[]
├── confidence
└── downstreamAssetIds[]
```

The AI should identify **direct semantic impacts**.

`downstreamAssetIds` and propagated statuses should be determined or confirmed using deterministic dependency traversal.

---

# 22. LLM Failure Recovery

Every AI stage shall use bounded failure recovery.

Required behaviour:

```text
Initial model call
        ↓
Validate against Pydantic schema
        ↓
Valid?
 ┌──────┴──────┐
YES            NO
 ↓              ↓
Return       ONE repair attempt
                 ↓
             Validate again
                 ↓
          ┌──────┴──────┐
         YES            NO
          ↓              ↓
       Return      Controlled failure
```

No unbounded retry loops are permitted.

For the known demonstration flow, controlled failure may allow the user to switch to deterministic demo data.

---

# 23. AI Timeout

Each live AI stage shall have a finite timeout.

Hackathon target:

```text
20–30 seconds maximum per major LLM request
```

Exact implementation may vary depending on the HTTP client and selected OpenRouter model.

A timeout must result in a controlled UI error rather than an indefinite loading state.

---

# 24. Performance Targets

For the seeded MVP corpus:

### UI Feedback

Loading feedback should appear within approximately:

```text
300 ms
```

after initiating an AI operation.

### Dependency Traversal

Traversal and propagation across the seeded five-document graph should complete within:

```text
< 200 ms
```

under normal local execution.

### Ordinary UI Actions

Non-AI interactions should generally complete within:

```text
< 500 ms
```

excluding network-dependent Firestore operations.

### AI Analysis

Live AI operations are permitted to take several seconds but are subject to the configured timeout.

---

# 25. Mock/Live Equivalence

Mock mode and live mode must return the **same response schemas**.

The frontend must not contain separate rendering logic such as:

```text
if mock:
    render mock result differently
```

Instead:

```text
Mock AI ──┐
          ├──→ Same validated response model → Frontend
Live AI ──┘
```

---

# 26. Required High-Value Tests

The MVP does not require a large test suite.

It does require coverage of the highest-risk behaviours.

## Test 1 — Ground-Truth Scenario

Given the canonical scenario and corpus:

```text
Expected direct and propagated asset statuses
==
Actual statuses
```

---

## Test 2 — Dependency Cycle

Given:

```text
A → B
B → C
C → A
```

dependency traversal must terminate and must not infinitely recurse.

---

## Test 3 — Scenario Approval Enforcement

An:

```text
AI_GENERATED_SCENARIO
```

must not proceed into the production stress-test path until converted into:

```text
LAWYER_APPROVED_WORKING_ASSUMPTION
```

---

## Test 4 — Invalid Model Enum

If the model returns:

```text
VERY_BADLY_AFFECTED
```

instead of an allowed impact status, validation must fail.

---

## Test 5 — Provenance Preservation

Every material impact finding requiring legal evidence must preserve valid references to supplied `LegalSource` objects.

Unknown source IDs must fail validation or be rejected during post-validation checks.

---

## Test 6 — Mock / Live Schema Equivalence

The mock and live AI implementations must satisfy the same response models.

---

## Test 7 — Original Text Preservation

Approving or editing a proposed remediation must not destroy the original firm document text.

The system must retain:

```text
originalText
proposedText
finalReviewedText
```

as distinct values where applicable.

---

## Test 8 — Authentication

When deployed with authentication enabled:

```text
No Firebase token
→ protected endpoint rejected

Invalid token
→ protected endpoint rejected

Valid token
→ request processed
```

---

# 27. Final MVP Definition

The frozen hackathon MVP is:

> **A curated foreign regulatory development and curated Singapore/comparator evidence are analysed by AI to produce plausible Singapore scenarios. A lawyer selects or edits one scenario and approves it as a working assumption. The system tests that assumption against five seeded synthetic firm artefacts, uses AI to identify direct semantic impacts, deterministically propagates those impacts through an explicit upstream→downstream dependency network, proposes remediation, allows lawyer review, and assembles a final Regulatory Resilience Brief.**

The MVP does not depend on:

* live legal research;
* continuous horizon scanning;
* multiple scenarios;
* automatic document modification;
* graph databases;
* vector databases;
* autonomous multi-agent systems.

---

# 28. Final Architecture

```text
                      GOOGLE
                        │
                        ▼
               Firebase Authentication
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                    NEXT.JS                         │
│                                                    │
│ Dashboard                                          │
│ Scenario Review                                    │
│ Stress-Test Workspace                              │
│ Dependency Visualisation                           │
│ Remediation Review                                 │
│ Resilience Brief                                   │
│                                                    │
│ Owns Firestore persistence                         │
└───────────────┬───────────────────────┬────────────┘
                │                       │
                │                       ▼
                │                Cloud Firestore
                │
                │ Firebase ID Token
                ▼
┌────────────────────────────────────────────────────┐
│                    FASTAPI                         │
│                                                    │
│ Stateless analysis service                         │
│ Pydantic validation                                │
│ Firebase token verification                        │
│ Deterministic dependency traversal                 │
│ AI orchestration                                   │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
                   OpenRouter
                       │
                       ▼
                Selected LLM Model
```

---

# 29. Freeze Principle

From this point onward, an implementation idea should only enter the MVP if it is required to demonstrate:

```text
REGULATORY POSITION
        ↓
LAWYER JUDGEMENT
        ↓
DIRECT INTERNAL IMPACT
        ↓
DOWNSTREAM PROPAGATION
        ↓
REMEDIATION
        ↓
HUMAN REVIEW
```

Everything else is secondary.
