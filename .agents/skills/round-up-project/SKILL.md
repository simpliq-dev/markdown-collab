---
name: round-up-project
description: "Review a project's enduring-proposal ledger and actual framework diff, then prepare human-reviewed improvements to a personal or shared kick-off template. Use at a deliberate project or major-phase closeout, when the human asks for a retrospective or template evolution, or before archiving a mature project. Do not silently promote local conventions, overwrite a versioned template, or modify external framework assets without explicit authority."
---

# Round up a project

Promote proven learning while leaving project-specific residue behind.

## Establish the comparison

1. Read `.agents/ENDURING-PROPOSALS.md`, project `AGENTS.md`, repository skills, relevant decisions, validation evidence, and framework-related history.
2. Identify the source kick-off template and version. Prefer an explicit path or recorded provenance; do not guess an external write target from a similarly named folder.
3. Compare the project's actual framework files with the source template. Use the proposal ledger as an index, not as a substitute for the diff.
4. Surface framework differences that have no proposal entry. Classify them as project-specific, incidental, or missing candidates before any promotion.

## Adjudicate each proposal

For every proposal, recommend `promote`, `defer`, `reject`, or `keep-project-only` based on:

- strength and breadth of evidence;
- clarity of triggers, workflow, outputs, boundaries, and non-goals;
- overlap with existing template guidance or skills;
- safety and context cost across unrelated future projects; and
- validation or forward-testing quality.

Prefer extending an existing artifact over adding an overlapping skill. Do not promote local paths, infrastructure identities, product taste, secrets, or one project's release/security policy as universal guidance.

## Prepare a versioned template change

- Summarize the proposed enduring delta separately from excluded project-local changes.
- If the template uses versioned directories, preserve the source and prepare the next version rather than mutating history. Otherwise follow its documented versioning convention.
- Carry complete skill folders and assets together. Update template indexes and documentation only where needed.
- Validate skills, links, metadata, and representative trigger/non-trigger cases. Forward-test consequential workflow skills when practical.

## Require human review

Template evolution, shared skills, governing instructions, permissions, safety boundaries, and review processes are human-gated. Present:

- source and proposed target versions;
- proposal decisions and evidence;
- the exact enduring diff;
- explicit exclusions and unresolved questions; and
- validation results.

Do not write outside the project until the human approves the target and change. After approved promotion, mark ledger entries `promoted` with the target version; preserve rejected or deferred decisions so later round-ups do not rediscover them blindly.
