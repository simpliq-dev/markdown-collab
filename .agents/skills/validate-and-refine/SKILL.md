---
name: validate-and-refine
description: "Validate meaningful product or code behavior and improve it through evidence-led iteration. Use after implementation or prototype changes, when the human asks to test, review, debug, polish, or refine, when visual or interactive artifacts need inspection, or when acceptance is uncertain. Do not use for pure discussion, trivial text edits, or measurable optimization better handled by run-eval-loop."
---

# Validate and refine

Test the actual outcome, identify the largest meaningful gap, and iterate until the requested quality bar is met or a real limitation is exposed.

## Establish the contract

1. Derive success conditions from the human request, durable project intent, accepted decisions, and existing executable contracts.
2. Inspect repository commands, tests, CI, fixtures, runtime setup, and available browser or artifact tools.
3. State material assumptions only when they affect what will count as success.

Do not manufacture acceptance criteria merely to create the appearance of certainty.

## Establish current evidence

Run the relevant baseline checks before changing more work when practical. Select evidence appropriate to the artifact:

- unit, integration, end-to-end, regression, lint, type, build, or security checks;
- browser interaction, screenshots, responsive states, accessibility, and console output;
- logs, traces, metrics, database state, or API responses;
- representative fixtures and user journeys;
- direct inspection of generated documents, images, reports, or other artifacts;
- focused human testing where judgment or access cannot be automated.

Record what actually ran and what could not run.

## Refine

1. Identify the largest failure or uncertainty relative to the intended outcome.
2. Diagnose the root cause using repository and runtime evidence.
3. Make one coherent change or tightly related set of changes.
4. Re-run affected checks and inspect the actual artifact.
5. Check for regressions in adjacent behavior proportionate to risk.
6. Repeat while meaningful gaps remain and further work is authorized.

Use qualitative judgment for qualities such as clarity, usability, coherence, and taste. Do not hide subjective tradeoffs behind weak numeric proxies.

## Stop and report

Stop when the outcome and relevant checks pass, when the next evidence requires the human, or when a genuine blocker or scope decision appears.

Report:

- behavior validated or improved;
- checks and observations with their results;
- meaningful files changed;
- remaining limitations, assumptions, or risks;
- precise human test instructions only when they add value.

Use `run-eval-loop` instead when repeated iterations can be compared using a trustworthy evaluator and explicit stopping rule.
