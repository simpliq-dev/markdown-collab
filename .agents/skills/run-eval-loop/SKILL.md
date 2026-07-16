---
name: run-eval-loop
description: "Run a bounded, logged, keep-or-discard improvement loop for a difficult task with a trustworthy evaluator. Use for performance tuning, model or prompt optimization, algorithm search, scored artifact improvement, or repeated experiments where a baseline, comparable metric or rubric, protected evaluation, editable surface, resource budget, and stopping rule exist. Do not use for ordinary feature work, vague polish, or subjective product judgment without a credible evaluator."
---

# Run an evaluation loop

Optimize against trustworthy evidence without allowing the experiment to redefine success.

## Confirm prerequisites

Before starting, establish:

- the intended outcome and why the evaluator represents it;
- a reproducible baseline;
- the fixed or protected evaluator, fixtures, and constraints;
- the files or parameters the experiment may change;
- isolation from unrelated human work, preferably a dedicated branch or worktree;
- the primary score plus important guardrail metrics;
- time, compute, cost, and iteration budgets;
- keep, discard, crash, and stopping rules;
- the results-log location and format.

If these cannot be established honestly, use `validate-and-refine` or ask for the missing decision. Obtain approval before material external spend or risky execution.

## Protect evaluation integrity

- Do not modify the evaluator, held-out fixtures, or constraints during a run unless the human explicitly starts a new evaluation version.
- Keep the evaluation surface separate from the editable solution surface.
- Watch for metric gaming and regressions hidden by the primary score.
- Combine deterministic metrics with stable rubric or artifact inspection when subjective quality matters.
- Treat evaluator noise as evidence; repeat runs when needed to distinguish improvement from variance.

## Iterate

1. Run and log the baseline.
2. Inspect scores, artifacts, and failure evidence.
3. Choose one focused hypothesis addressing the largest current limitation.
4. Make the smallest change that tests the hypothesis.
5. Run the evaluator within the agreed budget.
6. Log the change, result, guardrail metrics, and interpretation.
7. Keep the change only when the evidence justifies its complexity and tradeoffs.
8. Restore only the experiment's own changes when discarding; never overwrite unrelated work.
9. Select the next hypothesis from accumulated evidence and continue.

Prefer simpler solutions when results are materially equivalent. Periodically challenge whether the loop is exploiting the benchmark rather than improving the real outcome.

## Maintain resumable results

Keep a machine-readable or compact structured log containing:

- experiment identifier or commit;
- hypothesis and focused change;
- primary and guardrail results;
- status: baseline, keep, discard, crash, or inconclusive;
- short interpretation and next candidate.

Do not flood agent context with full logs. Save raw output to files and read targeted summaries or failure tails.

## Stop

Stop at the agreed threshold or budget, when the evaluator becomes invalid, when safety or cost boundaries intervene, or when remaining gains do not justify complexity. Human-review the best candidate and its real artifact before promotion beyond the isolated run.
