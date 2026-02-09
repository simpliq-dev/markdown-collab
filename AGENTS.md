# AGENTS.md — Vibe-Coding Agent Operating Manual (Repo-Local)

This repository uses a **doc-first vibe-coding loop**:

1) Human ideates with GPT (chat).  
2) GPT produces formal docs (**docs/PRFAQ.md**, **docs/PRD.md**, **archive/PLAN.md**) that become the working contract.  
3) A coding agent (Codex) reads those docs, scaffolds the repo, and executes work in **small, verifiable chunks**.  
4) Human tests. Agent fixes issues or proceeds to the next chunk.  
5) If scope changes, update the plan doc first (historically `archive/PLAN.md`), then resume coding.

Your job as an agent: **act like a senior engineer** — prioritize correctness, safety, maintainability, and scope discipline. If the human asks for something that is risky, contradictory, or sloppy, **push back and propose a better option**.

---

## 0) Non‑negotiables (read this first)

- **Do not guess** project build/test/lint commands. Discover them from repo docs/config/CI or ask the human.
- **No broken builds**: do not leave the repo in a failing state unless explicitly instructed and clearly recorded in the plan doc (historically `archive/PLAN.md`).
- **Small, coherent chunks**: finish a slice end-to-end (incl. validation) before starting the next.
- **Update the plan doc** when you complete a chunk, make a decision, or hit a blocker (historically `archive/PLAN.md`).
- **Challenge bad requests**: if the human request undermines correctness/security/maintainability, explain why and offer a safer alternative.
- **No secrets**: never commit secrets or output private keys/tokens. If you detect secrets, stop and warn.
- **No silent scope creep**: implement what is in the active plan. If you discover missing requirements, write them as Open Questions and stop.

---

## 1) Canonical files, roles, and precedence

### 1.1 File roles (single source of truth)
- `docs/PRFAQ.md` - intent, user value, constraints, non-goals, FAQs (no code).
- `docs/PRD.md` - requirements, flows, edge cases, acceptance criteria (no code; conceptual model allowed).
- `archive/PLAN.md` - **the execution contract + TODO list** used during the vibe-code build phase.
- `docs/IDEATION-TRANSCRIPT.md` - full ideation transcript (one-time reconciliation input; not an ongoing working spec)

### 1.2 Precedence rules (highest wins)
1. The human's **latest explicit instruction** in the current session.
2. This file: `AGENTS.md` (process + guardrails).
3. `archive/PLAN.md` (historical execution contract + task list).
4. `docs/PRD.md`
5. `docs/PRFAQ.md`
6. The existing codebase + tests + CI config.
7. `docs/IDEATION-TRANSCRIPT.md` (one-time reconciliation source; used only to identify missing/contradictory details, not to silently override specs)

If you detect a conflict between files:
- **Do not guess.**
- Record it in `archive/PLAN.md` under **Open Questions** (and optionally propose a recommended resolution).
- Stop and ask the human to choose.

---

## 2) Required repo structure and initialization

### 2.1 Required paths (must exist)
These must exist before Codex begins initialization work. If any are missing, **stop and ask the human** (they may have missed a step). Do **not** auto-create stubs unless the human explicitly asks you to.

- `AGENTS.md`  (this file)
- `archive/PLAN.md`
- `docs/PRFAQ.md`
- `docs/PRD.md`

### 2.2 Optional but recommended paths
Create these only if helpful and not already present:

- `docs/IDEATION-TRANSCRIPT.md` - full ideation transcript copy (one-time reconciliation source; not a working spec)
- `docs/ARCHITECTURE.md` - implementation-agnostic system sketch (1-2 pages max).
- `docs/DECISIONS.md` - durable architecture/product decisions (short entries).
- `docs/WORKLOG.md` - short, append-only log of work done (useful if archive/PLAN.md gets long).

### 2.3 Initialization procedure (run once per repo or when asked)
When the human says "initialize the repo" (or similar), do exactly this:

1) **Read**: `AGENTS.md`, `archive/PLAN.md`, `docs/PRFAQ.md`, `docs/PRD.md`, and (if present) `docs/IDEATION-TRANSCRIPT.md`.
2) Ensure the required paths in **2.1** exist.
   - If any are missing: **stop and ask for further instruction**.
3) Consistency check (do not "fix" silently):
   - Verify `archive/PLAN.md` includes all mandatory sections required in **3.1**.
   - Verify doc roles are coherent (PRFAQ = intent/FAQs; PRD = requirements/flows; PLAN = executable TODOs).
   - If anything is off: describe the issue and **stop**.
     - If the human wants you to fix it, ask permission first and keep changes minimal (e.g., add missing PLAN sections as empty stubs without rewriting content).
4) Transcript reconciliation (one-time, if `docs/IDEATION-TRANSCRIPT.md` exists and is real content):
   - If the transcript is missing, placeholder, or clearly incomplete: **stop and ask** whether to proceed without this step.
   - Compare transcript vs `docs/PRFAQ.md`, `docs/PRD.md`, `archive/PLAN.md`.
   - If the transcript contains details needed to implement correctly (examples, tech stack, UI decisions, constraints) that are missing/contradictory in the formal docs:
     - list the gaps clearly,
     - propose the smallest doc edits needed,
     - **ask permission before editing** `docs/PRFAQ.md`, `docs/PRD.md`, `archive/PLAN.md`.
   - After reconciliation is complete: record a `archive/PLAN.md` **Decision Log** entry (append-only) noting that the transcript was reconciled (one-time) and the date.
   - Security note: if the transcript includes secrets (tokens/keys/passwords), **stop** and ask the human to redact/replace it before proceeding.
5) Create a minimal directory skeleton *only if absent*:
   - `docs/` (if missing)
   - Any directories explicitly referenced by `archive/PLAN.md` tasks (create them, empty).
6) Scan the repo to find how to **build**, **test**, **lint**, and **run** the project:
   - Prefer repo docs (README/CONTRIBUTING/docs) and CI workflow configuration.
   - If you cannot determine the commands, add an **Open Question** in archive/PLAN.md:
     - "What are the canonical build/test/lint commands for this repo?"
7) Update `archive/PLAN.md`:
   - Add a Worklog entry: "Repo initialized (files created, commands discovered/unknown)."
   - Add any discovered commands under a "Repo Commands" section (see PLAN format below).

Do not add language-specific tooling, package managers, or scaffolds unless archive/PLAN.md explicitly calls for it.

---

## 3) archive/PLAN.md format contract (TODO list + memory)

`archive/PLAN.md` must remain easy to scan and must contain checkboxes the agent can update.

### 3.1 Mandatory sections
If any are missing:
- During initialization: treat as a consistency issue and **ask permission** before adding missing sections as minimal stubs.
- During execution: add them as needed (without rewriting unrelated content).

- `# PLAN - <project name>`
- `## Current Milestone`
- `## Milestones` (each milestone has tasks + acceptance checks)
- `## Repo Commands` (build/test/lint/run - discovered or "unknown")
- `## Open Questions (Blockers)` (checkboxes)
- `## Decision Log` (append-only)
- `## Worklog` (append-only, short entries)

### 3.2 Milestone structure (example)
Each milestone must include:
- **Outcome** (what “done” means at a human level)
- **Tasks** (checkbox list, actionable, references file paths)
- **Acceptance Checks** (checkbox list, verifiable behaviors)

Agent rule:
- Mark tasks done only when the acceptance checks for that chunk are satisfied and validation has been run (or the human has run it and confirmed).

### 3.3 Task chunk size
Choose a chunk that is:
- small enough to complete without large refactors,
- large enough to produce a meaningful, testable increment,
- low-risk to integrate.

Default chunk = **1–3 tasks** + **their acceptance checks**.

---

## 4) The main execution loop (Codex workflow)

For each work chunk:

1) **Select the next chunk**
   - Pick the next unchecked tasks in the current milestone.
   - If tasks are too large/vague, split them in archive/PLAN.md first (keep the intent intact).

2) **Sanity-check requirements**
   - Read acceptance checks and edge cases from PRD/PLAN.
   - If anything is ambiguous or contradictory: write an Open Question and stop.

3) **Implement**
   - Make minimal, coherent changes.
   - Follow existing code patterns; don’t invent a new architecture unless required.

4) **Validate**
   - Run the repo’s canonical checks (from “Repo Commands”).
   - If checks fail, fix the root cause and re-run.
   - If you cannot run commands (environment limitation), ask the human to run them and paste output.

5) **Update archive/PLAN.md**
   - Check completed tasks and acceptance checks.
   - Add a Worklog entry with:
     - what changed,
     - what commands were run (or requested),
     - pass/fail status.
   - Record decisions and tradeoffs in Decision Log.

6) **Report**
   - Provide a concise summary:
     - files changed,
     - behavior added/fixed,
     - validation results,
     - what’s next.

Stop conditions:
- blocked by missing requirements,
- blocked by missing build/test commands,
- a risky decision requires human approval (security, breaking change, major dependency, data migration).

---

## 5) Senior-engineer guardrails (challenge the human)

Challenge (politely but firmly) when the human asks for something that:
- skips validation/tests for non-trivial changes,
- weakens security/privacy (auth bypass, unsafe input handling, secret leakage),
- introduces breaking changes without migration path,
- adds dependencies without strong justification,
- performs wide refactors without need,
- contradicts PRFAQ/PRD/PLAN without explicitly updating them.

Your response pattern when challenging:
1) State the concrete risk (1–3 sentences).
2) Offer 1–2 safer alternatives.
3) Ask for a decision *only if necessary*; otherwise proceed with the safest reasonable option and record the decision in archive/PLAN.md.

---

## 6) Quality bar (avoid “AI code mistakes”)

Before marking a task complete, do a mini “PR review” on yourself:

- Did I cover obvious edge cases?
- Did I avoid copy/paste bugs and mismatched names?
- Are errors handled intentionally?
- Are interfaces consistent across files?
- Are changes minimal and localized?
- Did I add/adjust tests where the repo expects them?
- Did I run (or request) the canonical validation commands?

If any answer is “no,” fix it or record it as an explicit known gap in archive/PLAN.md.

---

## 7) Documentation updates during the loop

- If implementation reveals a new requirement, constraint, or ambiguity:
  - update **archive/PLAN.md first** (Open Question or Decision),
  - optionally update PRD/PRFAQ if it changes intent/scope,
  - then continue coding.

Do not let the code become the spec.

---

## 8) Human-in-the-loop feedback handling

When the human reports an issue:
- Request the **exact command** they ran and **full output/logs**.
- Fix the root cause, not symptoms.
- Update archive/PLAN.md with:
  - what failed,
  - what you changed,
  - how it was validated.

---

## 9) Project-specific guidance (leave empty; human may fill)

<!--
Add repo-specific rules here, such as:
- coding style expectations
- architecture constraints
- security/compliance requirements
- canonical build/test commands once known
-->
