# COLLAB-RULES.md (Template)

This file defines the **Codex Collab** read/respond rules for a *file-backed* collaboration workflow where conversations live inside Markdown files as HTML comment blocks.

This is intended to be **referenced from `AGENTS.md`** so that “how the agent should behave” lives in one place.

## Quick Start (What This Tool Is / What You Do)

Codex Collab treats each `CMT:THREAD` block as a **mini chat session embedded in Markdown**.

When asked to “run Codex” / “respond” / “process threads”, do this:

1) Use the **active Markdown file** (unless the user explicitly provides other file paths).
2) Find all `CMT:THREAD` blocks and determine which are **pending** (Section 2).
3) For each pending thread (top-to-bottom in file order):
   - Read context per `ref` (Section 3).
   - Append exactly one new `CMT:MSG` with `role=A` before the thread end marker.
4) Do not change any non-thread Markdown unless explicitly requested.

## 0) Core Principles (Non‑Negotiables)

- **File-backed only**: the Markdown file is the source of truth. No hidden state, no external services.
- **Human uses UI; agent edits files**: the human interacts via a UI, but the agent’s output is *direct edits to the Markdown file*.
- **Do not guess**: if required context is missing, ask clarifying questions *inside the thread* (as an `A` message) or to the human (as chat), depending on the workflow.
- **Minimize churn**: make the smallest edits needed; do not reformat unrelated content.
- **No secrets**: never introduce or echo secrets; redact if detected.

## 1) Thread Block Grammar (MVP)

Threads exist as HTML comments inside Markdown.

### 1.1 Thread wrapper

```
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
... one or more message blocks ...
<!-- /CMT:THREAD id=ABCDE -->
```

Rules:
- `id` is a short stable identifier.
- `status` is **human-owned** and is only `open|closed`. The agent must not change it unless explicitly instructed.
- `ref` is one of:
  - `ref=prev=N` where `N` is a positive integer (default is `1` if missing)
  - `ref=file` meaning the entire file is the reference context
- The **end marker is required**: `<!-- /CMT:THREAD id=... -->`.

### 1.2 Message blocks

```
<!-- CMT:MSG id=ABCDE role=H ts=2026-01-18T12:00:00.000Z
Message body...
-->
```

Rules:
- `role` is one of:
  - `H` = Human message (submitted)
  - `A` = Agent message (the agent’s response)
  - `D` = Draft (human UI working state; not yet “submitted”)
- `ts` is ISO-8601.
- Message bodies must not break comment structure:
  - Escape `<!--` as `&lt;!--`
  - Escape `-->` as `--&gt;`

## 2) Status vs Actionability

This system has two different concepts:
- **Thread status** (`status=open|closed`): explicitly set by the human/UI.
- **Actionability** (“pending”): inferred (not stored) from message history.

Recommended v1 inference:
- A thread is **pending** if `status=open` and the **last** message role is `H`.
- A thread is **not pending** if the last role is `A` or `D` or there are no messages.
- `status=closed` threads are not actionable by default.

## 3) What the Agent Should Read (Context Rules)

When responding in a thread, the agent must gather context based on `ref`:

### 3.1 `ref=file`
- The reference context is the **entire file content** (excluding no content; thread blocks are allowed to be read too).

### 3.2 `ref=prev=N`
- Interpret the Markdown file as a sequence of “Markdown blocks” (defined below).
- Find the thread’s anchor location (where the thread block appears in the file).
- The reference context is the **previous `N` Markdown blocks** immediately before the anchor.
- If `N` is missing, treat it as `1`.

#### Definition: “Markdown block” (locked for v1)

For `ref=prev=N`, a “Markdown block” is the unit the UI uses for anchoring. It is:

- Always computed **excluding all thread ranges** (`CMT:THREAD ... /CMT:THREAD`) so thread comments do not count as blocks.
- The contiguous block determined by Markdown structure, in this priority order:
  1) A fenced code block (from opening fence line to closing fence line, inclusive).
  2) A single heading line (`# ...`).
  3) A contiguous blockquote block (lines starting with `>`).
  4) A contiguous list block (list items and their continuation lines).
  5) Otherwise, a paragraph block (contiguous non-blank lines).

If fewer than `N` blocks exist before the anchor, use all available preceding blocks.

## 3.3 Scope and ordering (to avoid guessing)

- Default scope is the **active editor Markdown file only**.
- If the user wants multi-file processing, they must explicitly name the file paths.
- When processing threads, use **file order** (top-to-bottom by thread position).

## 4) What the Agent Should Write (Response Rules)

### 4.1 Default behavior

When asked to “run Codex” / “respond” / “process threads”, the agent should:

1) Parse the active Markdown file to find all `CMT:THREAD` blocks.
2) For each thread, determine actionability per Section 2.
3) For each actionable thread:
   - Read context per Section 3.
   - Read the full message history of that thread.
   - Produce exactly one new `CMT:MSG` block with `role=A`.
   - Append it **before** the thread end marker.
4) Do not edit any existing human text outside the thread blocks unless explicitly requested.

### 4.2 Draft handling

- Drafts (`role=D`) are **human-owned** working state.
- The agent must **not** convert a draft to submitted content.
- If the last role is `D`, the thread is not pending; do not respond unless explicitly asked.

### 4.3 Multiple questions / partial answers

If the human message contains multiple requests:
- Prefer a short structured response (bullets) inside the `A` message.
- If any requirement is ambiguous, ask clarifying questions rather than guessing.

### 4.4 Formatting for “sounds good when spoken” (optional)

If the project is audiobook-first:
- Prefer short sentences.
- Avoid dense inline code unless necessary.
- Use bullets sparingly and keep them short.

## 5) Safety / Guardrails

- Never execute destructive actions (mass rewrites, renames, deletions) unless explicitly instructed.
- Never introduce secrets, tokens, private keys, or credentials.
- If you detect secrets in the file, stop and ask the human to redact them.
- If the file cannot be parsed safely (e.g., malformed thread blocks), do not attempt partial edits; ask the human to fix the file or point you at a known-good file.

## 6) Compatibility Notes

- This ruleset assumes a UI exists for humans, but the agent itself only reads/writes Markdown.
- If the project uses additional docs/specs, this file should be treated as the **behavioral contract** for agent runs.
