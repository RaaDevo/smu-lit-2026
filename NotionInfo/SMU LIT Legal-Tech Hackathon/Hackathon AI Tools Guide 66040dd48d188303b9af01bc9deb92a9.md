# Hackathon AI Tools Guide

# Table of Contents

## Overview

The content here is meant to guide you.

**Note:** There may be inconsistencies or inaccuracies, so please double confirm if required. This guide is not exhaustive—please build upon it and do your own research.

## Hackathon mindset: MVP first

In a hackathon, your aim is to build an **MVP (minimum viable product)**: a basic, working version of your project that includes only the core features needed to solve a specific problem and demonstrate its value.

## Agentic coding tools

> Below are possible agentic coding tools you can use to develop your project. These “vibe coding” tools can turn an English prompt into a functional prototype, while still maintaining technical control over your code. Recommended for the hackathon.
> 
- Claude Code
- Codex
- Cursor
- OpenCode
- VSCode extensions
    - Kilo Code
    - Cline

## Model APIs

Use these alongside agentic coding tools like OpenCode, Kilo Code, or Cline. They provide access to various LLM models for coding usage (e.g. Deepseek, Claude, Codex). These can be good for teams to share via a prepaid pool rather than being bound by individual subscriptions.

- OpenRouter
- OpenCode

> Tip: You can check these websites to find usage data for commonly used LLM models and agentic tools (on OpenRouter).
> 

## LLM models comparison

| Model | Cost | Quality | Note |
| --- | --- | --- | --- |
| Claude | High | High | Use with Claude Code, but tokens run out quickly |
| Codex | Medium | Medium | Subscription-based like Claude |
| Deepseek | Low | Medium–Low | Pay per API usage (OpenRouter / OpenCode / Deepseek); most cost effective |

## Basic prompting

- **Always plan before implementation.** Going straight into implementation without a solid plan often leads to a generic or non-functional project.
- Most AI agents have **Plan** and **Act** mode. Use **Plan** mode to produce your plan before implementation.
- For the Legal-Tech Hackathon: include your **unique viewpoints** when planning. A basic “implement this for me” plus the challenge statement details is usually not enough for a strong hackathon project.
- This is where the **legal perspective** comes in.

## Skills (AI agent skills)

Skills are reusable packages of instructions and context that teach an AI agent how to perform specific, multi-step tasks using a structured workflow.

In short, skills help improve the quality of the code produced.

**Recommended:**

- [Frontend Design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
→ Click for an example
- Test Driven Development