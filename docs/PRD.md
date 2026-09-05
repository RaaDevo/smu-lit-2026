Absolutely. Below is a **hackathon-ready PRD** you can paste into `docs/PRD.md` and then give to Codex/Superpowers.

It keeps your latest flow intact, but makes the **R&T challenge alignment explicit** so the team does not accidentally build a fancy comparative-law research app and forget the resilience part. R&T specifically wants teams to identify which internal tools/processes/documents are affected by regulatory change, understand how they are affected, and propagate necessary updates before outdated material causes harm. 

---

# Product Requirements Document

## Firm Regulatory Resilience Twin

**Working title**

**Hackathon:** SMU LIT Legal-Tech Hackathon 2026
**Challenge:** Rajah & Tann — Designing a Sustainable and Resilient LegalTech
**Prototype domain:** Online harms / online safety regulation

---

# 1. Product Summary

The **Firm Regulatory Resilience Twin** is an AI-assisted legal intelligence and regulatory resilience platform for law firms.

The platform continuously identifies relevant legal and regulatory developments, helps lawyers assess their significance to Singapore, allows the firm to define the regulatory outcome or scenario it wishes to work with, and then **stress-tests the firm's own internal knowledge, documents, workflows and client-facing materials against that outcome**.

Rather than merely answering:

> “What changed in the law?”

the product is designed to answer:

> **“If this is the new or expected legal position, what inside our firm is now outdated, what does it affect, and what should we change?”**

The platform does not autonomously determine future Singapore law or automatically rewrite firm materials.

Legal judgement remains with lawyers.

---

# 2. Problem

Legal teams rely on internal artefacts such as:

* playbooks;
* checklists;
* template clauses;
* client advisories;
* research notes;
* training materials;
* compliance workflows;
* automated tools;
* accumulated internal working practices.

These artefacts encode assumptions about the current regulatory environment.

When legislation, regulatory guidance or judicial interpretation changes, those assumptions may become stale.

The resulting risk is not simply that lawyers fail to notice the regulatory development.

The deeper problem is that firms may not know:

* which internal artefacts rely on the old position;
* which parts of those artefacts are affected;
* which other documents or workflows depend on them;
* which clients may be affected;
* who is responsible for reviewing them;
* what updates should be made;
* whether those updates have propagated through the organisation.

This directly reflects the R&T challenge, which explicitly states that horizon scanning alone is insufficient. 

---

# 3. Product Thesis

> **Other systems tell law firms that the law changed. We show them what inside the firm became stale because it changed — and help them repair it.**

Secondary differentiation:

> **We do not merely monitor regulatory change. We stress-test the firm against it.**

---

# 4. Primary User

## Professional Support Lawyer / Knowledge Management Lawyer

The primary user is responsible for ensuring that the firm's institutional legal knowledge remains current.

They may maintain or oversee:

* practice group playbooks;
* legal templates;
* client-facing advisories;
* internal checklists;
* precedent banks;
* training materials;
* research notes;
* workflow standards.

### Secondary users

The system should also be usable by:

* regulatory practice lawyers;
* partners;
* internal research teams;
* risk and compliance teams;
* in-house legal departments.

---

# 5. Prototype Scope

The hackathon prototype will focus on:

> **Online harms / online safety regulation**

This is a demonstration domain rather than a permanent limitation of the product.

The system architecture should eventually support other regulatory areas.

For the prototype, comparative material may include jurisdictions such as:

* Singapore;
* United Kingdom;
* Australia;
* New Zealand;
* Malaysia.

The platform must clearly distinguish:

**current Singapore law**

from

**foreign legal developments**

from

**AI-generated possible scenarios**

from

**lawyer-approved working assumptions**.

---

# 6. Core User Journey

```text
LEGAL / REGULATORY DEVELOPMENTS
            ↓
      Regulatory Scout
            ↓
     Relevant developments
            ↓
 Comparative relevance analysis
            ↓
 Lawyer selects jurisdictions/sources
            ↓
 Singapore scenario analysis
            ↓
        LAWYER REVIEW
            ↓
 Lawyer selects / modifies assumption
            ↓
       STRESS-TEST FIRM
            ↓
Identify affected internal artefacts
            ↓
Trace dependencies and conflicts
            ↓
Recommend remediation
            ↓
        LAWYER REVIEW
            ↓
 Final Regulatory Resilience Brief
```

---

# 7. Product Modes

## 7.1 Reactive Mode

Used when an actual Singapore legal or regulatory development has occurred.

Example:

> Singapore introduces a new online-safety obligation.

The user asks:

> What does this change inside our firm?

The system analyses the regulatory development and maps it against the firm's internal knowledge base.

### Output

* affected artefacts;
* outdated assumptions;
* downstream dependencies;
* affected client advice;
* required review;
* proposed amendments;
* owners/approvers;
* final resilience report.

---

## 7.2 Proactive Stress-Test Mode

Used when a foreign jurisdiction or emerging regulatory development may provide an indication of possible future direction.

Example:

> The UK introduces a new online-safety requirement.

The platform:

1. analyses the foreign development;
2. evaluates its comparative relevance;
3. researches the Singapore context;
4. produces plausible Singapore scenarios;
5. allows a lawyer to decide which scenario is worth testing;
6. injects that scenario into the Firm Resilience Twin.

The resulting analysis is explicitly hypothetical.

The platform should say:

> **IF Singapore adopted this position...**

not:

> **Singapore will adopt this position.**

---

# 8. Functional Requirements

## FR-1 — Regulatory Scout

The system shall identify relevant legal and regulatory developments.

Sources may include:

* legislation;
* court decisions;
* regulator guidance;
* consultation papers;
* government announcements;
* codes;
* enforcement developments.

For the MVP, this may be triggered manually rather than truly running continuously.

### Output

Each development should include:

* title;
* jurisdiction;
* authority/source;
* date;
* type of development;
* short summary;
* source link;
* relevance explanation;
* status.

Example statuses:

```text
CURRENT SINGAPORE LAW
FOREIGN DEVELOPMENT
PROPOSED LAW
REGULATORY GUIDANCE
COURT DECISION
```

---

# 9. Comparative Relevance Analysis

The user should be able to select one or more comparative jurisdictions or allow the AI to recommend them.

The AI recommendation must be explainable.

It should not merely produce:

> UK — 9/10

Instead:

> **United Kingdom — High relevance**
>
> Similar regulatory objective and mature online-safety framework. Useful for examining possible platform obligations, although the Singapore institutional context differs.

Users must be able to override the ranking.

---

# 10. Comparative Research

For selected jurisdictions, the system should compile relevant:

* laws;
* regulatory frameworks;
* court decisions where relevant;
* regulator guidance;
* policy approaches.

Every important claim should link back to a source.

### Research output

The system should produce a structured brief containing:

```text
Jurisdiction
Development
Legal mechanism
Affected entities
Principal obligations
Enforcement mechanism
Important differences from Singapore
Potential relevance to Singapore
Sources
Confidence
```

---

# 11. Singapore Scenario Analysis

The system should analyse:

```text
Current Singapore position
+
Selected comparative developments
+
Relevant Singapore materials
```

and generate a limited number of possible regulatory scenarios.

Example:

```text
SCENARIO A
Broad statutory duty imposed on covered platforms.

SCENARIO B
Duty applies only to designated/high-risk platforms.

SCENARIO C
Regulator issues non-binding or sector-specific guidance.
```

Each scenario must include:

* evidence;
* assumptions;
* rationale;
* uncertainty;
* key legal questions.

The system must **not present predicted law as existing law**.

---

# 12. Lawyer Judgement Gate

Before firm simulation occurs, the lawyer must choose the assumption being tested.

The user may:

* approve an AI scenario;
* modify a scenario;
* combine scenarios;
* write their own scenario;
* run multiple scenarios.

Example:

> Firm view: Scenario B is the most credible working assumption.

The platform then treats this as:

```text
LAWYER-APPROVED WORKING ASSUMPTION
```

rather than as established law.

---

# 13. Firm Knowledge Base

For the MVP, the product should contain a small synthetic law-firm repository.

Suggested corpus:

### Asset 1

Online Safety Compliance Playbook

### Asset 2

Platform Client Compliance Checklist

### Asset 3

Template Client Advisory

### Asset 4

Standard Contract / Platform Clause Set

### Asset 5

Associate Training / Internal Guidance Document

Each asset should contain:

* ID;
* title;
* type;
* owner;
* version;
* relevant sections;
* assumptions;
* dependencies;
* source/document text.

---

# 14. Firm Regulatory Resilience Twin

The twin represents relationships between:

```text
LEGAL RULES
     ↓
LEGAL ASSUMPTIONS
     ↓
INTERNAL ARTEFACTS
     ↓
DOWNSTREAM ARTEFACTS
     ↓
OWNERS / APPROVERS
```

Example:

```text
Online-safety regulatory assumption
              ↓
Compliance Playbook §4.2
              ↓
Client Checklist Step 6
              ↓
Training Deck Slide 14
```

Governance relationships may also be represented:

```text
Compliance Playbook
      ↓ owned by
Knowledge Lawyer
      ↓ reviewed by
Practice Group
      ↓ approved by
Partner
```

The twin does **not** need a sophisticated production graph database for the MVP.

A simple structured dependency model is sufficient.

---

# 15. Impact Analysis

After a regulatory assumption is injected, the system shall determine:

* which assets are affected;
* which sections are affected;
* what assumption is now inconsistent;
* why the conflict exists;
* downstream dependencies;
* severity;
* confidence;
* whether human legal judgement is required.

### Impact categories

```text
UNAFFECTED
No meaningful dependency on the change.

MONITOR
Related to the change but no current inconsistency.

REVIEW REQUIRED
Potential impact exists but legal judgement is needed.

UPDATE REQUIRED
A clear internal assumption or instruction has become outdated.

DOWNSTREAM UPDATE
The artefact inherits or repeats information from another affected asset.
```

---

# 16. Conflict / Staleness Detection

The system should detect situations such as:

### Direct conflict

New assumption:

> Covered platforms must perform X.

Internal playbook:

> Covered platforms are not required to perform X.

Result:

> **UPDATE REQUIRED**

### Omission

New assumption introduces a required compliance step.

Internal checklist contains no equivalent step.

Result:

> **UPDATE REQUIRED**

### Downstream inheritance

Checklist changes, but training document still teaches the old checklist.

Result:

> **DOWNSTREAM UPDATE**

---

# 17. Remediation Agent

For each affected asset, the system should generate suggested remediation.

Examples:

* replace outdated text;
* insert new checklist step;
* remove obsolete assumption;
* add legal caveat;
* flag client advisory for re-issue;
* modify workflow;
* add review requirement.

The output should preferably use **diff-style presentation**.

Example:

```diff
- Platforms are not required to conduct formal risk assessments.

+ Covered platforms should be assessed for whether the new
+ risk-assessment obligation applies. Where applicable, the
+ compliance workflow must include documented risk assessment.
```

---

# 18. Human Review

The AI must not silently rewrite firm documents.

Every proposed material change should support:

```text
APPROVE
REJECT
EDIT
ESCALATE
```

The system should preserve:

* original content;
* AI recommendation;
* rationale;
* evidence;
* reviewer;
* decision;
* timestamp if available.

---

# 19. Adversarial Review

Before finalising remediation, a review stage should test:

* unsupported conclusions;
* incorrect source usage;
* missed dependencies;
* contradictions;
* overconfident predictions;
* scenario/current-law confusion;
* inconsistent proposed amendments;
* areas requiring lawyer judgement.

This may be implemented as a separate AI call rather than a fully autonomous agent.

---

# 20. Final Regulatory Resilience Brief

The system should compile the complete analysis into one concise report.

Suggested structure:

## Regulatory Development

What changed / what scenario was tested.

## Legal Basis

Relevant sources.

## Comparative Analysis

Relevant foreign approaches.

## Lawyer-Approved Assumption

What the firm decided to test.

## Firm Impact

```text
5 assets analysed
2 UPDATE REQUIRED
1 REVIEW REQUIRED
1 DOWNSTREAM UPDATE
1 UNAFFECTED
```

## Affected Materials

For each:

* document;
* section;
* reason;
* severity;
* evidence;
* dependencies.

## Proposed Remediation

Recommended changes.

## Outstanding Questions

Issues requiring legal judgement.

## Required Actions

Who needs to review what.

---

# 21. Dashboard Requirements

The main dashboard should prioritise **decision-making**, not chat.

Potential layout:

```text
┌───────────────────────────────────────────────┐
│ Regulatory Resilience Dashboard              │
├───────────────────────────────────────────────┤
│ 3 Emerging Developments                      │
│ 2 Active Stress Tests                        │
│ 4 Assets Requiring Review                    │
├───────────────────────────────────────────────┤
│ Recent Regulatory Signals                    │
│                                               │
│ UK Online Safety Development       HIGH       │
│ Australian Safety Standard         MEDIUM     │
│ Singapore Consultation             HIGH       │
├───────────────────────────────────────────────┤
│ Firm Resilience                              │
│                                               │
│ 🔴 2 Update Required                         │
│ 🟠 1 Review Required                         │
│ 🟡 1 Downstream Update                       │
└───────────────────────────────────────────────┘
```

---

# 22. Key Visualisation

The most important visual should be the **dependency / impact chain**.

Example:

```text
REGULATORY CHANGE
       │
       ▼
Old legal assumption
       │
       ▼
Compliance Playbook §4.2
       │
       ├───────────────┐
       ▼               ▼
Checklist Step 6   Client Advisory
       │
       ▼
Training Slide 14
```

Affected nodes should make propagation obvious.

The visual should answer within seconds:

> **Why does this one legal change affect these four things?**

---

# 23. AI Architecture

Working conceptual council:

### Scout

Identifies developments.

### Researcher

Finds and grounds legal information.

### Comparative Analyst

Evaluates comparative relevance.

### Scenario Analyst

Generates plausible Singapore outcomes.

### Impact Analyst

Maps lawyer-approved assumptions against firm assets.

### Remediation Agent

Proposes changes.

### Reviewer

Challenges conclusions and patches.

These do **not** all need to be independent autonomous agents.

Implementation may use:

* sequential structured LLM calls;
* deterministic application logic;
* retrieval;
* dependency traversal;
* human checkpoints.

The agent labels represent **responsibilities**, not a requirement to use seven separate autonomous systems.

---

# 24. Model Responsibilities vs Deterministic Logic

## Good AI tasks

Use models for:

* summarising developments;
* legal research synthesis;
* comparative reasoning;
* scenario generation;
* semantic document comparison;
* identifying implicit assumptions;
* explaining impact;
* drafting suggested amendments;
* adversarial review.

## Better handled deterministically

Use ordinary code for:

* dependency traversal;
* status calculations;
* document metadata;
* version tracking;
* UI filtering;
* approvals;
* report assembly where possible;
* audit trail.

Do not use an LLM for something a `for` loop can do reliably.

---

# 25. Grounding Requirements

Legal claims should be associated with:

* source;
* jurisdiction;
* source type;
* quoted/relevant passage where feasible;
* confidence;
* status.

The UI should make provenance visible.

The system must distinguish:

```text
FACT
Current verified legal position.

FOREIGN DEVELOPMENT
Actual development outside Singapore.

INFERENCE
System interpretation.

SCENARIO
Hypothetical future state.

LAWYER VIEW
Human-selected working assumption.
```

---

# 26. Non-Goals

The hackathon MVP is **not** intended to:

* predict Singapore court outcomes with certainty;
* replace lawyers;
* automatically rewrite the firm's document repository;
* provide autonomous legal advice to clients;
* monitor every jurisdiction;
* support every area of law;
* ingest the entire firm's real confidential corpus;
* build a production-grade knowledge graph;
* build a perfect legal-search engine;
* model the entire firm's organisational behaviour.

---

# 27. MVP

The first working vertical slice MUST demonstrate:

```text
1 regulatory development / scenario
             ↓
comparative research
             ↓
lawyer-selected working assumption
             ↓
5 synthetic firm artefacts analysed
             ↓
affected artefacts identified
             ↓
dependencies shown
             ↓
remediation proposed
             ↓
human review
             ↓
final resilience brief
```

### Required MVP features

* one online-harms scenario;
* synthetic firm document corpus;
* structured legal development;
* comparative relevance selection;
* scenario analysis;
* lawyer decision gate;
* firm impact analysis;
* dependency visualisation;
* affected-section evidence;
* proposed remediation;
* approval/rejection;
* final summary.

---

# 28. Stretch Features

Only pursue once the vertical slice works.

### Regulatory Scout automation

Periodic web research.

### Multiple simultaneous scenarios

Compare:

```text
Scenario A vs Scenario B
```

and show how the firm impact differs.

### Multi-jurisdiction comparison

Allow lawyers to modify comparative weights.

### Firm process modelling

Show:

* owners;
* approval sequence;
* bottlenecks;
* missing responsibility.

### Propagation tracking

Show whether all downstream documents were updated.

### Document upload

Allow users to add arbitrary firm material.

### Version comparison

Show historical versions and updates.

### Firestore persistence

Save projects, reviews and reports.

### Authentication

Multi-user firm workflow.

---

# 29. Demo Scenario

Prototype example:

> A major comparator jurisdiction introduces or materially changes an online-safety requirement concerning platform risk management.

The system:

1. surfaces the foreign development;
2. identifies relevant comparator jurisdictions;
3. researches the Singapore position;
4. produces possible Singapore regulatory approaches;
5. law firm selects one scenario;
6. clicks **Stress Test Firm**;
7. system discovers affected materials;
8. graph lights up;
9. proposed remediation appears.

### Magic moment

The judge sees:

```text
5 firm assets analysed

🔴 2 Update Required
🟠 1 Review Required
🟡 1 Downstream Update
🟢 1 Unaffected
```

Then clicks the affected playbook:

```text
REGULATORY ASSUMPTION
          ↓
Playbook §4.2
          ↓
Checklist Step 6
          ↓
Training Slide 14
```

The product immediately demonstrates the difference between:

> regulatory monitoring

and

> regulatory resilience.

---

# 30. Demo Success Criteria

Within approximately **60–90 seconds**, the judge should understand:

1. a legal development occurred;
2. the AI researched it;
3. the lawyer remained in control of legal judgement;
4. the system stress-tested the firm's internal knowledge;
5. it found exactly what became stale;
6. it traced downstream dependencies;
7. it proposed actionable repairs.

---

# 31. Hackathon Success Metrics

The MVP succeeds if:

### Relevance

The product clearly demonstrates all three R&T requirements:

```text
IDENTIFY
what is affected

UNDERSTAND
how it is affected

PROPAGATE
the required updates
```

### Technical feasibility

A complete end-to-end scenario runs reliably.

### Innovation

The Firm Regulatory Resilience Twin provides more than regulatory alerts.

### Presentation

The core value can be understood in under one minute.

---

# 32. Existing Repository

The current skeleton should be treated as infrastructure.

## KEEP

* Next.js;
* React;
* TypeScript;
* Tailwind;
* FastAPI;
* Pydantic;
* frontend/backend API layer;
* OpenRouter service;
* environment configuration;
* mock mode;
* CORS;
* tests;
* GitHub CI;
* Vercel frontend;
* optional Firebase integration.

## ADAPT

* `/analyse`;
* AI service prompts;
* API models;
* generic result UI;
* demo data.

## REMOVE

Anything that assumes the generic starter's original analysis workflow and provides no value to this product.

## NEW

* regulatory development model;
* comparative analysis;
* scenarios;
* firm assets;
* dependency relationships;
* impact findings;
* remediation patches;
* reviewer decisions;
* resilience report;
* dependency visualisation.

---

# 33. Proposed Data Model

```text
RegulatoryDevelopment
├── id
├── title
├── jurisdiction
├── type
├── status
├── date
├── summary
└── sources[]

Source
├── id
├── title
├── authority
├── url
├── jurisdiction
└── relevant_text

ComparativeAssessment
├── jurisdiction
├── relevance
├── reasoning
└── sources[]

Scenario
├── id
├── title
├── description
├── assumptions[]
├── evidence[]
├── uncertainty
└── status

FirmAsset
├── id
├── title
├── type
├── content
├── owner
├── version
└── assumptions[]

Dependency
├── source_asset
├── target_asset
├── relationship
└── explanation

ImpactFinding
├── asset
├── section
├── status
├── severity
├── reasoning
├── evidence[]
├── confidence
└── downstream_assets[]

ProposedPatch
├── impact
├── original_text
├── proposed_text
├── reasoning
└── status

ReviewDecision
├── reviewer
├── decision
├── note
└── timestamp

ResilienceBrief
├── development
├── scenario
├── findings[]
├── patches[]
├── unresolved_questions[]
└── required_actions[]
```

---

# 34. Team Allocation

### Law Member 1 — Singapore analysis

* current Singapore legal position;
* regulatory context;
* validate scenarios;
* verify claims.

### Law Member 2 — comparative research

* UK;
* Australia;
* NZ;
* Malaysia;
* relevance methodology.

### Law Member 3 — firm simulation

Create realistic synthetic:

* playbook;
* checklist;
* advisory;
* clauses;
* training material;

and manually define what *should* be affected in the demo scenario.

This gives the team a **ground-truth expected result** against which the AI can be tested.

### Tech Member 1

Backend / AI pipeline:

* research pipeline;
* structured outputs;
* scenario generation;
* impact analysis;
* remediation.

### Tech Member 2

Frontend / product:

* dashboard;
* development selection;
* scenario review;
* twin visualisation;
* impact views;
* approval workflow;
* final report;
* deployment.

Both tech members integrate continuously.

---

# 35. Core Product Principle

At every stage, ask:

> **Does this help us determine what inside the firm becomes stale and what should happen next?**

If not, it is probably secondary.

The comparative research is not the product.

The prediction is not the product.

The agents are not the product.

The dashboard is not the product.

The core product is:

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

---

This is now detailed enough that I'd **freeze the conceptual direction here** and feed this to Superpowers rather than continuing to mutate the architecture conversationally.

Your next Codex instruction should essentially be:

```text
Use superpowers:brainstorming.

Read docs/PRD.md.

This PRD represents our current approved product direction.

Critically review it against the R&T challenge and our existing repository.

Do not implement yet.

Identify only:
1. contradictions or unresolved product decisions;
2. anything that does not directly contribute to the MVP;
3. technical risks that would prevent the vertical slice from being completed;
4. the smallest version of the Firm Regulatory Resilience Twin that still demonstrates the product thesis.

Do not expand scope.
```

After that review, **approve/fix the PRD → `/impeccable shape` → `superpowers:writing-plans` → build.**
