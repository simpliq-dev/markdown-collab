# COLLAB-RULES.md — Markdown Collab agent rules (normative)

This file defines the **Markdown Collab** read/respond rules for a *file-backed* collaboration workflow where conversations live **inside Markdown files** as HTML comment blocks.

It works with Codex, Claude, and other agentic systems that can read and write files reliably.

## Quick start (what to do when comments are ready)

Markdown Collab treats each `CMT:THREAD` block as a **mini chat session embedded in Markdown**.

When a human says something like:
- “comments are ready” / “respond to threads” / “process pending threads”

Do this:

1) Use the **named Markdown file(s)**.
   - If the human didn’t specify files, use the **active Markdown file** (or ask which file).
2) Find all `CMT:THREAD` blocks and determine which are **pending** (Section 2).
3) For each pending thread (top-to-bottom in file order):
   - Read context per `ref` (Section 3).
   - Append **exactly one** new `CMT:MSG` with `role=A` **before** the thread end marker.
4) Do **not** change non-thread Markdown unless explicitly requested.

> Important: You can have many threads in a file, but the agent run is still best driven by a **single, serial prompt** (see “Single-threaded prompt” section).

## 0) Core principles (non‑negotiables)

- **File-backed only**: the Markdown file is the source of truth. No hidden state.
- **Human uses UI; agent edits files**: the human uses the editor UI; the agent’s output is direct edits to the Markdown file.
- **Minimise churn**: smallest edits needed; do not reformat unrelated content.
- **Don’t guess**: if required context is missing, ask clarifying questions.
- **Safety**: never introduce or echo secrets/tokens; redact if detected.

## 1) Thread block grammar (MVP)

Threads exist as HTML comments inside Markdown.

### 1.1 Thread wrapper

```md
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
... one or more message blocks ...
<!-- /CMT:THREAD id=ABCDE -->
```

Rules:
- `id` is a short stable identifier.
- `status` is **human-owned** and is only `open|closed`.
  - The agent must not change it unless explicitly instructed.
- `ref` is one of:
  - `ref=prev=N` where `N` is a positive integer (default is `1` if missing)
  - `ref=file` meaning the entire file is reference context
- The end marker is required: `<!-- /CMT:THREAD id=... -->`.

### 1.2 Message blocks

```md
<!-- CMT:MSG id=ABCDE role=H ts=2026-01-18T12:00:00.000Z
Message body...
-->
```

Rules:
- `role` is one of:
  - `D` = Draft (human UI working state; not yet submitted)
  - `H` = Human (submitted)
  - `A` = Agent (your response)
- `ts` is ISO-8601.
- Message bodies must not break comment structure:
  - Escape `<!--` as `&lt;!--`
  - Escape `-->` as `--&gt;`

## 2) Status vs actionability (pending inference)

Two concepts:
- **Thread status**: `status=open|closed` (explicitly set by the human/UI)
- **Actionability (“pending”)**: inferred from the last message

v1 inference:
- A thread is **pending** if `status=open` and the **last** message role is `H`.
- A thread is **not pending** if the last role is `A` or `D` or there are no messages.
- `status=closed` threads are not actionable by default.

## 3) What the agent should read (context rules)

When responding in a thread, gather context based on `ref`:

### 3.1 `ref=file`
- Reference context is the **entire file**.

### 3.2 `ref=prev=N`
- Interpret the Markdown file as a sequence of “Markdown blocks” (definition below).
- Find the thread’s anchor (where the thread block appears).
- Reference context is the **previous `N` Markdown blocks** immediately before the anchor.
- If `N` is missing, treat it as `1`.

#### Definition: “Markdown block” (locked for v1)

For `ref=prev=N`, a “Markdown block” is computed:
- **Excluding all thread ranges** (`CMT:THREAD ... /CMT:THREAD`) so thread comments don’t count as blocks.
- As a contiguous unit by Markdown-ish structure, in priority order:
  1) A fenced code block (opening fence → closing fence inclusive).
  2) A single heading line (`# ...`).
  3) A contiguous blockquote block (`>` lines).
  4) A contiguous list block (list items and their continuation lines).
  5) Otherwise, a paragraph block (contiguous non-blank lines).

If fewer than `N` blocks exist before the anchor, use all available preceding blocks.

### 3.3 Scope and ordering

- Default scope is the **specified Markdown file only**.
- Multi-file processing requires explicit file paths.
- Process threads in **file order** (top-to-bottom).

## 4) What the agent should write (response rules)

### 4.1 Default behaviour

When asked to “review comments” / “respond” / “process threads”, do:

1) Parse the Markdown file to find all `CMT:THREAD` blocks.
2) Determine pending threads per Section 2.
3) For each pending thread:
   - Read context per Section 3.
   - Read the full message history.
   - Append exactly one new `CMT:MSG` block with `role=A` before the end marker.
4) Don’t edit existing message blocks, don’t rewrite anchors, don’t touch unrelated Markdown.

### 4.2 Draft handling

- Drafts (`role=D`) are human-owned.
- Do not convert draft content to submitted content.
- If the last role is `D`, the thread is not pending; do not respond unless explicitly asked.

### 4.3 Multiple questions / partial answers

- Prefer a short structured response (bullets) inside the new `A` message.
- If any requirement is ambiguous, ask clarifying questions rather than guessing.

## 5) Single-threaded prompt (important)

Even though the extension supports **many threads**, agent systems work best when you drive them with a **single serial instruction**.

Recommended prompt pattern:

> “Open `<path/to/file.md>`. For each `CMT:THREAD` where `status=open` and the last `CMT:MSG` has `role=H`, append one new `CMT:MSG` with `role=A` answering the human. Do not modify other content.”

If you want it to process multiple files, explicitly enumerate them.

## 6) Safety / guardrails

- Never take destructive actions (mass rewrites, renames, deletions) unless explicitly instructed.
- Never introduce secrets, tokens, private keys, or credentials.
- If you detect secrets in the file, stop and ask the human to redact them.
- If the file cannot be parsed safely (malformed thread blocks), do not attempt partial edits; ask the human to fix the file.
