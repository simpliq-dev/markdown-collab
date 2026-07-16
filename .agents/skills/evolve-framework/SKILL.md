---
name: evolve-framework
description: "Assess and improve the project's agent framework when repeated workflows, recurring corrections, duplicated procedural reasoning, stale guidance, avoidable tool friction, unsafe inconsistency, or an explicit retrospective suggests that durable context, AGENTS.md, a skill, script, hook, test, or other executable check should evolve. Use after meaningful recurrence or for a high-risk procedure needing consistency. Do not use for isolated mistakes, speculative process ideas, or routine feature work."
---

# Evolve the framework

Turn demonstrated friction into the smallest validated improvement. Be curious about abstraction without becoming process-generative.

## Gather evidence

Identify the concrete pattern and its cost. Prefer two or more meaningful examples, unless one high-risk failure is sufficient. Distinguish:

- a model mistake from missing project context;
- a one-off circumstance from a repeatable workflow;
- a procedural problem from an unenforced mechanical invariant;
- repository-local knowledge from a broadly reusable personal workflow.

Do not interrupt the primary task solely to search for abstractions. Reflect at natural checkpoints or when explicitly requested.

When the evidence suggests a lesson may transfer beyond this repository, use `capture-enduring-learning` to record the portable proposal, its limits, and its project-local evidence. An explicit human instruction to preserve a practice can establish a candidate even when recurrence is still limited. Recording a candidate is not promotion.

## Choose the smallest durable form

- Put stable project intention, vocabulary, constraints, or taste in project documentation.
- Put consequential rationale in a decision record.
- Put a repeatable judgment-driven workflow in a skill.
- Put deterministic repeated operations in a script.
- Put invariants in tests, schemas, hooks, lint rules, or CI.
- Put universally applicable repository behavior in `AGENTS.md` only when it must be present for most tasks.
- Persist nothing when the pattern is incidental, obvious to a capable agent, or cheaper to rediscover.

Prefer correcting or extending an existing artifact over creating an overlapping one.

## Design a skill only when earned

Before creating or changing a skill:

1. Define representative trigger requests and requests that must not trigger it.
2. Define the stable inputs, workflow, outputs, and validation evidence.
3. Search existing skills for overlap.
4. Keep metadata precise and the body concise; place optional detail in references and deterministic work in scripts.
5. Use the available skill-creation guidance and validator.
6. Forward-test complex or consequential skills on realistic tasks when practical.

Do not create a skill merely because a task occurred twice if the procedure is still unstable or trivial.

## Review and validate the change

Explain:

- the observed evidence;
- why this persistence surface is appropriate;
- what behavior should improve;
- how the change will be checked;
- whether it is project-local or a candidate for wider reuse.

Validate against representative examples or executable checks. Compare before and after behavior where practical. Keep changes version-controlled and reversible.

Require human review before changing `AGENTS.md`, this skill, permissions, safety boundaries, release or deployment processes, destructive operations, external communications, or cross-project/user-level skills. Never silently promote repository learning outside the repository.
