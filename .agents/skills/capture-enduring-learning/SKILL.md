---
name: capture-enduring-learning
description: "Capture demonstrated project lessons that may deserve reuse across future projects while separating portable guidance from local implementation. Use when the human labels feedback enduring, a workflow repeatedly reduces friction or risk, a project correction appears broadly reusable, or framework evolution identifies a promotion candidate. Do not promote changes into external templates, log incidental preferences, or duplicate ordinary project history."
---

# Capture enduring learning

Record evidence for later promotion without confusing project-specific evolution with portable guidance.

## Qualify the candidate

Capture a proposal when at least one is true:

- the human explicitly asks to preserve it for future projects;
- two or more meaningful project examples show the same benefit or friction; or
- one high-risk event justifies a consistent cross-project safeguard.

Do not interrupt primary work to hunt for lessons. Capture at a natural checkpoint unless the human asks immediately. Prefer extending an existing proposal over adding an overlapping one.

Before assigning a new ID, compare the candidate's trigger, portable rule, and promotion target with existing entries. Update an existing entry when it would drive substantially the same future behavior. A local fact that is neither enduring nor an exclusion belongs outside this ledger; preserve it in ordinary project state only when it is independently useful.

## Maintain the proposal ledger

Use `.agents/ENDURING-PROPOSALS.md`. If it does not exist, instantiate the bundled [proposal template](assets/ENDURING-PROPOSALS.template.md). Keep one stable ID per proposal and record:

- status and source framework/template version;
- concrete project evidence and cost or benefit;
- project-local files, PRs, or behavior that implemented the lesson;
- the portable proposed change in implementation-ready language;
- boundaries, counterexamples, and details that must remain project-specific;
- likely promotion target such as `AGENTS.md`, an existing skill, a new skill, script, or template documentation; and
- validation already performed and a concrete observable check still needed before promotion.

The ledger is a proposal log, not a second worklog. Link to existing evidence instead of copying lengthy history.

## Preserve the distinction

- Mark explicit human endorsement as `accepted-for-round-up`, not `promoted`.
- Record project-specific residue even when it seems obvious; later reviewers must be able to explain why it is excluded.
- Do not infer that every framework diff is enduring. Unlogged differences must remain visible for round-up classification.
- Do not edit a personal/shared template or install a cross-project skill during capture. Promotion requires the round-up workflow and human review.

## Finish the capture

Check that another agent can reconstruct the evidence, portable rule, exclusions, and target from the ledger plus linked repository artifacts. Report the proposal IDs added or updated without claiming wider adoption.
