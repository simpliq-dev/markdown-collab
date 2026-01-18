# PROMPT-HELPER.md — Vibe-Coding Prompts (ChatGPT ↔ VS Code Codex)

This file is a **copy/paste prompt cookbook** for the workflow:

1) Ideate in ChatGPT (Auto).  
2) In the same chat, switch to GPT Pro and generate formal docs.  
3) Copy docs + AGENTS.md into repo.  
4) Switch to Codex in VS Code and run the execution loop (PLAN.md-driven).

---

## Conventions used in prompts

- Replace anything inside `<ANGLE_BRACKETS>` with your project specifics.
- File paths are **canonical**. Do not rename them unless you also update AGENTS.md + PLAN.md.

Canonical files:
- `docs/PRFAQ.md`
- `docs/PRD.md`
- `PLAN.md`
- `AGENTS.md` (standardized; you copy it in)
- `docs/IDEATION-TRANSCRIPT.md` (optional but recommended; one-time reconciliation input; redact secrets before saving)

---

## 1) Ideation (ChatGPT, Auto)

### 1.1 Tighten the idea (repeat as needed)
**Prompt:**
```text
I’m riffing an idea. Your job is to pressure-test and tighten it.

Start by extracting:
1) Target user
2) The single most painful problem
3) The smallest lovable solution
4) 3 success metrics
5) 5 non-goals
6) Biggest risks/unknowns

Then ask me the 5 most important questions to eliminate ambiguity.
Here are my notes:
<PASTE NOTES>
```

### 1.2 Freeze the “tight idea” (end of ideation)
**Prompt:**
```text
Freeze the current idea into a crisp spec seed:

- One-sentence value proposition
- Target user + job-to-be-done
- Problem statement (max 2 sentences)
- Proposed solution (max 8 bullets)
- Non-goals (max 8 bullets)
- Success metrics (3 measurable)
- Risks/unknowns (top 5)
- Kill criteria (what would make us stop)

Return only markdown.
```

---

## 2) Convert the chat into formal docs (same chat, switch to GPT Pro)

### 2.1 Generate PRFAQ.md, PRD.md, PLAN.md (core prompt)
**Prompt:**
```text
Turn the full ideation chat above into the following files:

1) docs/PRFAQ.md
2) docs/PRD.md
3) PLAN.md

You MUST produce implementation-ready specs. Do an internal extraction pass BEFORE writing the files:
- Decision Ledger: anything explicitly decided in chat (product, UX, data/persistence, security/privacy, stack/hosting/version).
- Open Questions: anything not specified that you would otherwise have to guess. Mark which are "Blockers for coding".
- Spec Gap Audit: the top missing specifics that would block implementation (as questions).

Output requirements (strict):
- Output each file as:
  - a heading line exactly: FILE: <path>
  - then a fenced markdown code block with the complete file contents.
- After the code blocks, ALSO create downloadable files for each path if your interface supports it.
  - If downloads are not supported, write: DOWNLOADS: NOT AVAILABLE

Hard rules:
- Do not invent requirements not supported by the ideation chat.
- Do not fill gaps with assumptions. If it's not specified, it must be an Open Question.
- If the chat DOES specify a detail, you MUST preserve it (names, flows, constraints, exact behaviors).

docs/PRFAQ.md must include:
- Press release (problem, user, what changes, why now)
- FAQ including: constraints, non-goals, pricing/ops assumptions if relevant, and "why not / why it fails" questions
- Explicit "Out of Scope" section
- Success metrics (3 measurable)

docs/PRD.md must include (no code; examples/tables are OK):
- Overview (goals, non-goals)
- Target user/persona + glossary (define important terms used in the PRD)
- Decisions (from the Decision Ledger; explicit and concrete)
- Feature Specs (one section per feature, prioritized), each with:
  - User story + priority
  - Scope (what's included) + explicit non-goals for the feature
  - Preconditions/permissions (who can do it)
  - UX flow (step-by-step) including empty/loading/error states
  - UI contract (implementation-ready): screens/views, fields/controls, validation rules, error messages, user-visible copy requirements
  - Data model impact (conceptual): entities/records, required fields, identifiers/relationships, and source of truth for key data
  - Interfaces/contracts (conceptual): routes and/or API endpoints, request/response shapes (JSON examples OK), auth expectations, error cases
  - Edge cases + failure modes
  - Acceptance criteria checklist (testable; prefer Given/When/Then bullets)
- Non-functional requirements (performance, security, privacy, reliability)
- Spec Gap Audit (the questions from your internal audit)
- Open Questions (include which are Blockers)

PLAN.md must be a TODO list with checkboxes:
- A "Current Milestone" section
- A "Milestones" section where each milestone has:
  - Outcome
  - Tasks (checkboxes; actionable; include file paths)
  - Acceptance checks (checkboxes; concrete and verifiable)
- "Repo Commands" section listing build/test/lint/run commands:
  - If unknown, write them as TODOs and also list them under Open Questions
- "Open Questions (Blockers)" with checkboxes
- "Decision Log" (append-only)
- "Worklog" (append-only)

Final self-check (do this before outputting):
- Every PRD Feature Spec includes: UX flow + UI contract + data impact + interfaces + acceptance checklist.
- Anything you could not specify without guessing appears under Open Questions.
- PLAN milestones map cleanly to PRD features and acceptance checks are concrete.

Proceed now.
```

### 2.2 Regenerate only PLAN.md (when scope stays but tasks need fixing)
**Prompt:**
```text
Regenerate PLAN.md only, using the current docs/PRD.md as the source of truth.

Requirements:
- Keep it checkbox-driven (tasks + acceptance checks).
- Split work into milestones that each produce a verifiable increment.
- Include Open Questions, Decision Log, Worklog, Repo Commands.

Output exactly:
FILE: PLAN.md
```


---

## 3) Codex initialization (VS Code, codex chat)

### 3.1 Initialize a fresh repo from docs (first Codex message)
**Prompt:**
```text
Initialize this repository following AGENTS.md.

Steps:
1) Read AGENTS.md, PLAN.md, docs/PRFAQ.md, docs/PRD.md, and (if present) docs/IDEATION-TRANSCRIPT.md.
2) Ensure required paths exist.
   - If anything required is missing, STOP and ask for further instruction (do not create stubs unless explicitly told to).
3) Consistency-check the docs against AGENTS.md expectations (PLAN mandatory sections, coherent doc roles).
   - If anything is off, STOP and ask for further instruction (and ask permission before making any doc fixes).
4) If docs/IDEATION-TRANSCRIPT.md exists and contains real content: compare it to PRFAQ/PRD/PLAN.
   - Identify any missing details that would force guessing during implementation (examples, tech stack, UI decisions, constraints).
   - Propose the smallest doc edits to reconcile, and ask permission before editing PRFAQ/PRD/PLAN.
5) Discover canonical build/test/lint/run commands from repo docs/config/CI.
   - If unknown, add Open Questions in PLAN.md.
6) Update PLAN.md Worklog with what you did (and any blockers).

After initialization, do NOT start implementing features yet.
Stop and report readiness + any blockers you need answered.
```

---

## 4) Codex kickoff: choose chunk + choose model

### 4.1 Ask Codex to choose the next chunk and recommend model
**Prompt:**
```text
Read AGENTS.md and PLAN.md.

1) Identify the next best chunk of work (1–3 tasks + their acceptance checks).
2) Recommend which model to use for this chunk:
   - codex (lighter / shorter tasks)
   - codex-max (longer / multi-file / higher risk tasks)
3) Briefly justify the recommendation.
Do not start implementing yet.
```

---

## 5) Codex execution: implement a chunk

### 5.1 Execute the next chunk (standard)
**Prompt:**
```text
Read AGENTS.md and PLAN.md.

Implement the next chunk (the next 1–3 unchecked tasks in the Current Milestone).

Rules:
- Make minimal, correct changes.
- Follow existing conventions.
- Validate using the repo’s canonical commands (from PLAN.md Repo Commands).
- Fix failures (root cause) and re-validate.
- Update PLAN.md: checkboxes, Worklog, Decision Log (if any), Open Questions (if blocked).
Stop when the chunk’s acceptance checks are satisfied and validation is green, or when blocked.
```

### 5.2 Continue to the next chunk
**Prompt:**
```text
Continue with the next chunk in PLAN.md (next 1–3 unchecked tasks).

Same rules: implement → validate → update PLAN.md → stop when green or blocked.
```

---

## 6) Feedback loops

### 6.1 Build/test failure (human → Codex)
**Prompt:**
```text
A command failed.

Command:
<PASTE EXACT COMMAND>

Output:
<PASTE FULL OUTPUT>

Fix the root cause, re-run the same command(s) until green, and update PLAN.md Worklog + Validation notes.
```

### 6.2 Feature not as expected (human → Codex)
**Prompt:**
```text
The feature behavior is not as expected.

Expected:
<DESCRIBE EXPECTED BEHAVIOR>

Actual:
<DESCRIBE ACTUAL BEHAVIOR>

Reconcile with docs/PRD.md and PLAN.md acceptance criteria:
- If docs are wrong/incomplete, propose the smallest doc change (PRD + PLAN).
- If implementation is wrong, fix implementation + tests.
Update PLAN.md accordingly.
```

---

## 7) Non-coding ideation mid-cycle (VS Code, GPT non-Codex)

### 7.1 Ideate a new feature without coding
**Prompt:**
```text
Do not write code.

Given the current PRD intent, propose:
- 3 feature enhancements (ranked)
- For the top one: user story, acceptance criteria, edge cases, and risks
- Explicit non-goals
Keep it concrete and small enough to fit into 1–2 milestones.
```

### 7.2 Convert new idea into doc + plan edits (GPT Pro)
**Prompt:**
```text
Update docs/PRD.md and PLAN.md to incorporate the new feature decision below.

Rules:
- Do not rewrite unrelated sections.
- Add acceptance criteria and edge cases for the new/changed behavior.
- Update PLAN.md milestones/tasks/acceptance checks accordingly.
- Record the change in PLAN.md Decision Log.

New feature decision:
<PASTE DECISION / NOTES>

Output format:
- FILE: docs/PRD.md (only changed sections, but include enough surrounding context to place changes)
- FILE: PLAN.md (complete updated file)
```

---

## 8) Context reset / new session recovery (Codex)

### 8.1 Rehydrate from files only (new Codex session)
**Prompt:**
```text
You have no prior chat context.

Read AGENTS.md, PLAN.md, docs/PRFAQ.md, docs/PRD.md.

Then:
1) State the Current Milestone.
2) List the next 3 unchecked tasks.
3) Start implementing the first chunk (1–3 tasks) with validation and PLAN updates, per AGENTS.md.
Stop when green or blocked.
```

---

## 9) “Stop me before I do something dumb” prompt (senior-engineer check)

### 9.1 Risk review before a big change (any model)
**Prompt:**
```text
Before implementing, do a senior-engineer risk review.

Given AGENTS.md + PLAN.md + PRD:
- Identify the top 5 risks (security, breaking changes, data loss, maintainability).
- For each risk: a mitigation and a low-risk alternative.
- Identify any missing acceptance criteria or tests that must exist before shipping.

Do not write code yet.
```
