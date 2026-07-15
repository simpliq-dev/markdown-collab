---
name: manage-project-state
description: "Create, refresh, or audit the minimum durable project state needed when complexity, consequential decisions, documentation drift, multi-session work, context limits, handoff, or resumption risk makes conversation and code alone insufficient. Use before a substantial pause or continuation session and when intent, taste, decisions, architecture, validation state, or next actions are becoming hard to reconstruct. Do not use for small self-contained tasks or to generate ceremonial documentation."
---

# Manage project state

Make the repository safely understandable and resumable with the fewest durable artifacts.

## Audit before writing

Read existing project guidance, relevant documentation, code, tests, configuration, git state, and active work before creating anything. Determine whether a capable fresh agent can answer:

1. What is the project trying to achieve, for whom, and why?
2. What taste, decision biases, constraints, and anti-goals should shape tradeoffs?
3. What consequential choices are settled, and why?
4. What currently exists and what evidence says it works?
5. What remains unfinished, blocked, uncertain, or risky?
6. What is the next useful action and how should it be validated?

Write only to close important gaps.

## Select the smallest state surface

- Use `docs/PROJECT.md` for durable intention, users, taste, scope, vocabulary, constraints, non-goals, and success evidence.
- Use `docs/DECISIONS.md` for consequential choices whose rationale may otherwise be lost or re-litigated.
- Use `docs/plans/active/<topic>.md` for substantial unfinished work with dependent steps, evidence, blockers, validation, and a resume point.
- Use `docs/ARCHITECTURE.md` only when system boundaries, runtime flow, data, security, or invariants are no longer economical to infer.
- Prefer tests, schemas, scripts, hooks, and CI for mechanically enforceable truth.

Use the templates in `assets/` only when the corresponding artifact is justified. Adapt them, remove unused sections and comments, and never copy placeholders mechanically.

## Keep sources distinct

- Record intended behavior and taste separately from current implementation reality.
- Record durable rationale separately from current task state.
- Record current execution state separately from git history.
- Link to authoritative code, tests, issues, or external sources rather than duplicating volatile detail.
- Update an existing source of truth instead of adding a competing document.
- Mark uncertainty honestly. Do not invent decisions to make a document look complete.

## Create a safe resume point

For substantial unfinished work, ensure the repository captures:

- current intention and boundaries;
- accepted decisions relevant to the work;
- current working state and meaningful files;
- validation performed and exact results or limitations;
- unresolved blockers and assumptions;
- the next useful action and its acceptance evidence.

Keep this concise enough that a fresh agent can rehydrate quickly. Do not append a worklog for every conversational turn.

## Reconcile drift

If documents, code, tests, and human direction disagree, identify the conflict and its practical impact. Fix stale low-risk execution state directly. Ask the human before changing consequential intent or accepted rationale.

Use `evolve-framework` when the state problem reveals a recurring weakness in the framework rather than a one-time project update.
