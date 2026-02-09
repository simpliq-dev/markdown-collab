# AGENTS.md Addendum — codex-collab (MUST READ)

Paste this at the **end** of your existing `AGENTS.md`.

If you don’t have an `AGENTS.md` yet, you can use this file as a minimal standalone `AGENTS.md`.

## codex-collab workflow

codex-collab is a **file-backed collaboration tool**: it embeds “mini chat sessions” as `CMT:THREAD` blocks inside Markdown files.

- The human uses the VS Code UI to read/write messages.
- The agent (Codex) responds by **editing the Markdown file directly**.

## Collab rules (normative)

MUST READ and follow:

- `rules/COLLAB-RULES.md`

If there’s a conflict between these collab rules and other generic agent instructions, treat `rules/COLLAB-RULES.md` as the **behavioural contract** for:

- which threads to act on (pending inference)
- what context to read (`ref=file` vs `ref=prev=N`)
- what the agent is allowed to write (append `role=A` messages only)

## How to trigger an agent run (single-threaded prompt)

Even if there are multiple threads, drive Codex with a single instruction, e.g.:

> “Check `my-file.md` for pending codex-collab threads and respond to each one.”
