# Challenge Statements

# **Table of Contents**

# Introduction

The following describes the **4** problem statements that are available for the SMU LIT Legal-Tech Hackathon 2026. The ordering is purely random.  

# Challenge Statement Submission Details

**Submission Deadline: 5th September, 1800**

**Submission Link:** [https://forms.gle/1TjvhBzk6K51UqiVA](https://forms.gle/1TjvhBzk6K51UqiVA)

**Note**: Please use the email you used to sign up for the SMU LIT Legal-Tech Hackathon to submit your challenge statement choice. We will use this to verify your challenge statement choice submission. 

# Problem Statement 1: AITHENA

An SME three years old has accumulated somewhere between forty and eighty signed agreements — customer terms, supplier contracts, a lease, NDAs, a distribution agreement — in a shared drive. Nobody has read them since signing. Two months ago an auto-renewal on a S$40,000 software contract went through unnoticed. Nobody knows what else is in there.

## The challenge

Build a tool that ingests a folder of signed contracts and produces a single, trustworthy answer to "what are we on the hook for, and what is coming up?"

This is the obligation-extraction problem, but with the interesting constraint that the user is not a lawyer and will not verify anything. A dashboard that is 80% accurate and presented with total confidence is worse than useless — it is a false sense of safety. The design problem is as much about conveying uncertainty as extracting facts.

## Must-have (judged)

1. Batch-ingests a set of contracts of mixed format and quality, including at least one scanned document.
2. Extracts, per contract: parties, term, renewal mechanics and notice periods, termination rights, payment obligations, liability caps, and any exclusivity or restrictive covenant.
3. Surfaces a forward calendar — what expires, auto-renews or requires notice in the next 90 days, and the date by which action must be taken.
4. Cross-contract conflict detection: at least one class of conflict (e.g. an exclusivity granted to A that a later agreement with B breaches).
5. Every extracted field links back to the exact page and clause, and carries a confidence signal that distinguishes "found it" from "inferred it."

## Stretch

- Natural-language query across the portfolio: "which of our customer contracts cap our liability below S$50k?"
- Portfolio risk scoring against a benchmark set of positions.
- Detects the contracts that are missing — a vendor with invoices but no signed agreement.

## How we would judge it

Run every team over the same corpus with known ground truth. Score extraction accuracy field by field, and score honesty separately: a team that flags "low confidence" on the fields it got wrong should beat a team that asserts everything with equal confidence.

## Requirements

### Grounding — no un-anchored legal claims

Every legal assertion the tool makes must be traceable to something: a clause in the document, a provision of Singapore law, or a stated market norm. A team may use whatever retrieval or citation-verification approach they like, but "the model said so" is not grounding, and fabricated citations should be treated as a serious defect rather than a rough edge.

### Calibration — the tool must know when to stop

The failure mode that matters in this domain is not a wrong answer. It is a confident wrong answer delivered to the one person who cannot tell. Every build must have a defined competence boundary and must visibly hit it: refuse, caveat, or escalate when the question is high-stakes, fact-dependent, or outside what it can ground.

We suggest the organisers plant at least one deliberately unanswerable or out-of-scope item in the judging material. Teams that hedge appropriately should score above teams that answer confidently and wrongly.

### Escalation — build the handoff, not just the answer

These tools do not replace lawyers; they decide when a lawyer is needed and make that lawyer's first hour cheap. Each build should produce, at its boundary, a handoff brief: a short structured summary a real lawyer could pick up and act on in under a minute, containing the issue, the relevant documents and clauses, what the tool already established, and the specific question that needs human judgement.

## Data and resources

All three options can be built entirely on public and synthetic material. No proprietary or confidential data is required, and we would ask that teams not use any real client documents.

### Singapore legal sources (free, public)

- Singapore Statutes Online — sso.agc.gov.sg
- Singapore Law Watch — judgments and legal news
- MOM, IRAS, ACRA and PDPC published guidelines and advisories
- Singapore Academy of Law public resources

### Open contract corpora

- CUAD (Contract Understanding Atticus Dataset) — 510 commercial contracts with 41 annotated clause types
- LegalBench — legal reasoning evaluation tasks
- SEC EDGAR material-contract exhibits
- Y Combinator's SAFE and standard startup document set

---

# Problem Statement 2: SAL

**Problem Statement:**

Generative AI is transforming legal research, but large language models (LLMs) are notorious for "hallucinations"—fabricating fake case law or misinterpreting judicial precedents. Subscribers to any case law database demand absolute accuracy.

**The Challenge:** Design an automated, scalable evaluation framework or benchmarking tool that can test and score the quality, accuracy, and citation integrity of legal AI outputs. This solution should solve the "Who audits the auditor?" dilemma. The system, methodology, or tool should evaluate the quality, bias, and accuracy of the database's AI outputs.

Your solutions must account for:

- **The "Hallucination" Problem:** How does it catch fake cases?
- **Contextual Accuracy:** Does the AI actually understand *why* a case matters, or is it just matching keywords?
- **Scalability:** Can this evaluation happen instantly across thousands of user queries daily?

---

# Problem Statement 3: R&T

## Adoption challenge

- **Pain point:** Law firms invest significant time, resources and funding into introducing new technologies, tools and processes. Despite their potential value, many initiatives struggle to achieve widespread adoption. Lawyers may continue using familiar methods or find new systems difficult to integrate into their daily workflows. Creation of engaging short form topic specific educational video resources is a resource-consuming challenge.
- **Why it is important:** Success of new solutions on whether people choose to adopt and consistently use it. Poor adoption can limit the value of new technologies, processes and transformation initiatives, reducing their intended impact.
- **What a successful solution would achieve:** A successful solution would increase awareness, encourage sustained usage, reduce resistance to change, and help law firms maximise value from new technologies, processes and ways of working.
- **Problem statement:** How might law firms encourage their lawyers to successfully adopt and integrate new technologies, tools, processes and ways of working into their daily activities? How can generative audio-video technology be utilised to simulate user-system interactions for short based educational clips that are based on real life use cases?

## Designing a Sustainable and Resilient LegalTech

- **Pain Point**: Law firms, in-house teams, and compliance functions are build around regulation. Checklists, workflows, playbooks, template clauses, client advisories, training materials, and automated compliance tools are all constructed on the assumption that the rules they encode will remain stable long enough to be useful. Often, they do not. A new amendment is gazetted, a regulator issues revised guidance, a court reinterprets a statutory provision, or a parallel jurisdiction adopts a conflicting standard — and suddenly the tool that was built to ensure compliance is itself a source of risk.
- **Importance**: In Singapore alone, well over thousand subsidiary legislation instruments were gazetted, and many more consultation papers, circulars, notices, and guidelines are issued. Furthermore, with the rapid development of technology, new regulatory developments are rapidly emerging. Every undetected gap between what the rules require and what a firm's tools still assume is a latent source of error, in advice, filings, documentation, and the workflows that lawyers may unknowingly follow without questioning.
- **Successful solution**: The challenge is not simply one of awareness. Firms can track regulatory updates; there is no shortage of horizon-scanning services and alert platforms. A strong submission should demonstrate how tools / practices are structurally resilient to change by demonstrating the following:
    - identifying which of a firm's existing tools, processes, documents, and accumulated working practices are affected by a given change,
    - understanding in what way they are affected, and;
    - propagating the necessary updates before the outdated version causes harm.
- **Problem statement**: How might legal teams build tools, systems, or practices that are resilient to regulatory change — not just responsive to it?

---

# Problem Statement 4: Min Law

**Problem Statement**

Self-represented persons (SRPs) in the Small Claims Tribunals (SCT) increasingly turn to publicly available generative AI (GenAI) tools for help navigating the claims process. Without appropriate guidance, however, they risk misunderstanding relevant information, filing incomplete or poorly organised claims, or having their existing assumptions reinforced rather than objectively assessed.

**The Challenge**

**How might we help such SRPs to use GenAI effectively and responsibly during pre-filing and case preparation?** The solution should provide interactive guidance, for example, a system prompt, plug-in or custom AI assistant, to help SRPs navigate SCT processes and organise their claims, while mitigating hallucinations and confirmation bias, and promoting responsible use of GenAI, in line with the Courts' Guide on the Use of Generative Artificial Intelligence Tools by Court Users.