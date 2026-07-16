# AGENTS.md - Adaptive Project Framework

This repository may begin as an idea and evolve into a maintained product. Help the human move fluidly through understanding, exploration, prototyping, building, validation, and refinement. These are working modes, not phase gates.

## Enduring principles

- Preserve the human's underlying intention, taste, and constraints. Challenge local choices that undermine them.
- Prefer evidence over speculation. Inspect the workspace, research unstable facts, and use small reversible experiments when they can answer a question safely.
- Use the lightest process that keeps the work coherent. Do not create documents, plans, skills, or abstractions merely to satisfy this framework.
- Treat code, tests, rendered artifacts, logs, user observation, and production evidence as complementary sources of truth. Reconcile conflicts rather than applying a blind precedence list.
- Make the largest coherent change that can be completed and validated confidently. Leave the workspace clean and understandable.
- Keep consequential actions reviewable and reversible. Never discard unrelated human work.
- Treat `.agents` as version-controlled agent workspace. Keep it writable under the repository's ordinary inherited permissions; enforce consequential framework changes through git review and human gates rather than special deny ACLs or read-only handling of the directory.

## Adaptive workflows

Use the repository skills when their descriptions match the work. They are guidance, not mandatory stages.

- `explore-project`: clarify a new or materially uncertain project and identify the next useful evidence.
- `manage-project-state`: introduce or refresh durable project memory only when complexity or resumption risk warrants it.
- `manage-development-environment`: choose between project-local, sidecar, and trusted host-level tooling while keeping the host clean and dependencies reproducible.
- `validate-and-refine`: test meaningful behavior and improve it using evidence from the real artifact or environment.
- `run-eval-loop`: run bounded keep-or-discard optimization only when a trustworthy evaluator exists.
- `evolve-framework`: turn demonstrated recurring friction into the smallest useful documentation, skill, script, or check.
- `capture-enduring-learning`: record demonstrated lessons that may transfer beyond this repository without promoting them prematurely.
- `round-up-project`: review project evidence and framework differences at a deliberate closeout before proposing human-approved template changes.

Invoke a skill explicitly when the human requests it or its workflow is critical. Otherwise activate skills when their trigger descriptions clearly apply. Do not force every task through every skill.

## Understanding and decisions

- Build shared understanding proportionate to the cost of being wrong.
- Ask when ambiguity materially affects product behavior, UX, architecture, security, privacy, data, cost, external systems, or irreversible work.
- Before asking, inspect available evidence and existing decisions. Group tightly related questions when that helps the human see the decision context.
- For low-risk and reversible details, proceed with a reasonable assumption and surface it when it affects the result.
- Use prototypes to learn, not to evade necessary decisions. Label disposable work and do not let it silently become production architecture.

## Emergent project memory

Do not require blank project artifacts. Use `manage-project-state` when information pressure appears. Typical signals include work spanning sessions, decisions being revisited, intent or taste becoming hard to reconstruct, several dependent workstreams, or an unsafe handoff.

Create only the smallest artifact that resolves the observed problem. Prefer updating an existing source of truth over adding another. Durable rationale belongs in decisions; current execution state belongs in an active plan; mechanically enforceable truth belongs in tests, scripts, hooks, schemas, or CI.

## Validation and refinement

- Define success before validating, using the human's request and repository evidence.
- Run the most relevant available checks. For visual or interactive behavior, inspect and exercise the actual artifact when tools permit.
- Fix root causes and re-run affected checks. Do not claim validation that was not performed.
- Use a scored improvement loop only when the score is meaningful, the evaluator is protected from manipulation, and a stopping rule or resource budget is explicit.

## Resumption

Use conversation context for small continuous work. Before a likely context or session boundary on substantial unfinished work, ensure the repository records enough to resume safely: intention, accepted decisions, current working state, validation performed, unresolved blockers, and the next useful action. Do not create ceremonial worklogs for self-contained tasks.

## Framework evolution

Stay alert for repeated workflows, recurring corrections, avoidable friction, or project knowledge that could be captured more effectively. At natural checkpoints, use `evolve-framework` when there is real evidence for improvement.

Be curious but not prolific: do not interrupt the primary task for process work, create speculative skills, or preserve incidental patterns. Prefer improving an existing artifact over adding an overlapping one. Explain the evidence and validation for any proposed framework change.

When a lesson may be useful beyond the current repository, use `capture-enduring-learning` to separate the portable proposal from its project-specific evidence and implementation. At a deliberate project or phase closeout, use `round-up-project` to compare that proposal log with the actual framework diff and prepare a human-reviewed next template version.

Treat changes to this file, permissions, safety rules, release processes, and framework-evolution behavior as human-reviewed changes. Keep repository-local improvements local unless the human approves promotion to a wider personal or shared framework.

## Closeout

Report the outcome, meaningful files changed, validation and its result, assumptions or remaining risks, and the next useful action only when one exists.

## Collaborative Review protocol

Markdown files may contain anchored `CMT:THREAD` conversations created by this extension. When the human says that comments are ready for review:

1. Open the named Markdown file and find every open thread whose latest message has `role=H`. These are the submitted comments for the turn.
2. Read all submitted comments and their anchored passages before acting. Treat them as one coherent turn so edits and answers can share context across threads.
3. Make the requested document edits when authorized, then append exactly one `role=A` message to every thread handled. Keep responses concise and state what changed or what blocks completion.
4. Preserve thread IDs, anchors, earlier messages, and unrelated Markdown. Never act on `role=D`, convert a draft to submitted, respond to a closed thread, or append a duplicate agent response.
5. If the prompt's displayed count differs from the file, trust the current file and mention the discrepancy in the chat response.

The canonical grammar and mutation rules are documented in `rules/COLLAB-RULES.md`.
