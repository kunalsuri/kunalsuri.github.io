---
title: "(Re) Understanding the AI Coding Agent Stack"
description: "Why LLMs, System Prompts, Skills, MCP, Mechanical Gates, and Agent Harnesses all seem to overlap—and how they actually fit together as layers."
pubDate: 2026-09-02
category: "Engineering"
tags: ["ai", "agents", "architecture", "tooling"]
draft: true
---

Pick any tech newsletter, developer podcast, or "future of coding" thread, and you'll see a dizzying alphabet soup of buzzwords: **LLMs**, **System Prompts**, **Agent Skills**, **Model Context Protocol (MCP)**, **Composite Workflows**, and **Agent Harnesses**. It reads like a chaotic marketplace of competing AI paradigms.

> It isn't. These tools sit at **different layers** of the same agentic stack. Once you see the layers, the overlap stops feeling confusing and starts feeling obvious.

<br>

## 🧩 The short version

- **Foundation Models (LLMs)** are the reasoning engines. They predict next tokens; they don't execute code or hold state.
- **Context & System Prompts** (`AGENTS.md`, `.cursorrules`) set behavioral guardrails and high-level boundaries.
- **Model Context Protocol (MCP)** is the communication bridge. It provides structured JSON-RPC connections between agents and external tools or databases.
- **Atomic Skills** (`SKILL.md` + scripts) are modular, versioned packages of instructions and deterministic tools loaded on demand.
- **Composite Skills** are workflow orchestrators that chain atomic skills together into end-to-end pipelines.
- **Mechanical Gates** are deterministic linters and test suites that mechanically reject bad code regardless of what the model claims.
- **The Agent Harness** is the complete runtime environment, wrapping the model with sandboxes, test loops, token management, and continuous evaluation.

When someone says *"I'm using Claude with MCP, custom Agent Skills, and a Vitest harness,"* they're not picking between rivals. They're stacking layers.

<br>

## 📦 The stack, top to bottom

Read it from the bottom up: the foundation model generates raw text. Everything above is scaffolding and engineering infrastructure designed to turn stochastic generation into reliable software delivery.

<br>

```text
Human Intent / Objective
        │
Agent Harness & Runtime Loop    ← Scaffolding & Token Management
        │
Mechanical Gates & Evals        ← Deterministic Quality & Linters
        │
Composite Workflow Skills       ← Multi-step Pipelines & Package Managers
        │
Atomic Agent Skills             ← On-demand Instructions + Scripts
        │
Model Context Protocol (MCP)    ← Structured Tool & Resource Protocols
        │
System Prompts & Rules          ← AGENTS.md / Context Scaffolding
        │
Foundation LLM / SLM            ← Core Reasoning Engine
```

<br>

## 🧩 A (not so) deep dive

### 🧠 Foundation LLMs — the raw engine

At the base of the stack sits the **Foundation Model** (such as Gemini, Claude, or GPT).

Its sole job is probabilistic next-token generation. An LLM on its own has no clock, no terminal access, no awareness of whether your project builds, and no memory beyond the current context window.

Expecting a raw foundation model to reliably engineer software without external scaffolding is like expecting an internal combustion engine to drive you home without wheels, a transmission, or brakes.

<br>

### 📜 Context & System Prompts — behavioral guardrails

The first layer around the model is **context framing**.

Files like `AGENTS.md`, `CLAUDE.md`, and `.cursorrules` establish the project's ground rules:

- Code style (e.g., TypeScript strict mode, no `any`)
- Architectural patterns (e.g., Astro islands instead of heavy client routers)
- Operational commands (e.g., token-efficient single-turn test scripts)

```yaml
# AGENTS.md
rules:
  - "Run single-turn verification scripts before finishing."
  - "Never draft and publish in the same conversation turn."
```

This layer prevents the agent from guessing basic project conventions on every prompt.

<br>

### 🔌 Model Context Protocol (MCP) — the universal plug

**Model Context Protocol (MCP)** is an open standard that standardizes how AI agents communicate with data sources and tools.

Instead of custom, ad-hoc integrations for every database, issue tracker, or browser, an MCP server exposes capabilities via a standardized JSON-RPC contract:

```text
AI Coding Agent  ──(MCP JSON-RPC)──>  Local Dev Server / DB / GitHub
```

MCP gives agents structured hands to interact with the world outside their context window.

<br>

### ⚡ Atomic Agent Skills — modular expertise on demand

Shoving thousands of lines of documentation into a system prompt causes **context rot** and wastes tokens.

**Agent Skills** solve this through *progressive disclosure*. A skill is a self-contained directory with a `SKILL.md` file and dedicated scripts. The agent only loads the skill when relevant:

```text
skills/markdown-link-auditor/
├── SKILL.md            ← Instructions & schema
└── scripts/
    └── audit_links.py  ← Deterministic async crawler
```

The model doesn't need to reinvent URL verification in memory; it triggers the script and inspects the structured output.

<br>

### 🔄 Composite Skills — orchestrating pipelines

Real-world development is rarely a single step. **Composite skills** (or workflow skills) chain multiple atomic skills into an automated pipeline.

A composite skill like `/run-full-audit` can act as both an **orchestrator** and a **package manager**:

1. It verifies whether required atomic skills exist in `.agents/skills/` or `.claude/skills/`.
2. If missing, it asks the user for approval to pull them from a centralized skill repository.
3. It executes each atomic step in sequence (e.g., `sync-instructions` → `link-audit` → `publish-gate`), returning a consolidated summary report.

<br>

### 🛡️ Mechanical Gates — deterministic guardrails

A core rule of agentic engineering: **never trust an LLM to self-evaluate without mechanical enforcement.**

A **mechanical gate** is a script or compiler check that executes independently of the model. For instance, in content and code pipelines:

- `astro check` guarantees zero type errors.
- `verify-post.mjs` checks frontmatter, catches unresolved placeholder markers, and rejects malformed headings.

If a gate fails, the model receives the exact failure output and must self-correct until the deterministic test passes.

<br>

### 🏗️ The Agent Harness — the complete environment

The **Agent Harness** is the overarching runtime framework that ties everything together. It manages:

- **Token Efficiency:** Slicing large build outputs and chaining multiple checks into single-turn commands.
- **State Machine Isolation:** Enforcing distinct phases between drafting, editorial review, and final release.
- **Evaluation Suites:** Running automated SWE-bench style regression tests on prompts and skills across model updates.

<br>

---

## 🤔 So which layer should I use?

You don't pick one layer—you leverage each layer for its intended strength:

| Layer | Primary Role | What happens if you skip it? |
| --- | --- | --- |
| **Foundation LLM** | Reasoning & code synthesis | No code generation. |
| **System Rules** (`AGENTS.md`) | Repository conventions | Inconsistent style, wrong libraries used. |
| **MCP Servers** | Tool & data connectivity | Agent cannot query external systems safely. |
| **Atomic Skills** | Modular, scripted tasks | Context bloat, hallucinated commands. |
| **Composite Skills** | Multi-step workflows | Manual turn-by-turn user babysitting. |
| **Mechanical Gates** | Hard pass/fail validation | Broken builds and malformed content ship to production. |
| **Agent Harness** | End-to-end runtime lifecycle | Token waste, runaway costs, and fragile agent loops. |

<br>

## Mental model

Keep this cheat sheet handy:

```text
Layer                  Role                             Example
────────────────────────────────────────────────────────────────────────────────
Agent Harness          End-to-end runtime scaffolding   Single-turn verification scripts
Mechanical Gates       Deterministic validation         astro check, verify-post.mjs
Composite Skills       Pipeline orchestration           /run-full-audit
Atomic Skills          On-demand toolkits               markdown-link-auditor
MCP                    Standardized tool protocol       Local Postgres / Dev MCP server
System Rules           Persistent context framing       AGENTS.md, CLAUDE.md
Foundation Model       Raw probabilistic reasoning      Claude 3.7, Gemini 2.5, GPT-4o
```

<br>

> The modern AI coding stack isn't a collection of competing hacks. It's a cohesive architecture of layers that turn raw language models into deterministic, enterprise-grade software engines.

<br>

## References

1. [Anthropic Agent Skills Standard](https://github.com/anthropics/anthropic-skills)
2. [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
3. [AGENTS.md Standard](https://agents.md)
4. [Astro Documentation](https://docs.astro.build/)
5. [TypeScript Documentation](https://www.typescriptlang.org/docs/)
6. [SWE-bench: Evaluating Language Models on Software Engineering](https://www.swebench.com/)

<br>
