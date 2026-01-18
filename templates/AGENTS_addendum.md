# AGENTS.md Addendum — Codex Collab Read/Respond Rules

This is an **addendum** intended to be pasted at the end of an existing `AGENTS.md`.
It is designed to stand alone even if the surrounding `AGENTS.md` is generic.

## Collab Rules (Read This)

When working in this repository (or any project using the same file-backed thread format), the agent must also follow:

- `templates/COLLAB-RULES.md`

### Precedence within this addendum

If your base `AGENTS.md` contains general guidance and the collab workflow requires more specific behavior, treat `templates/COLLAB-RULES.md` as the **normative behavioral contract** for:

- Which threads to act on (pending inference)
- What context to read (`ref=file` vs `ref=prev=N`)
- What the agent is allowed to write (append `role=A` messages only)
- Safety and non-goals (no hidden state; no external services)

If there is a conflict between these collab rules and another local doc, do not guess: record an open question in the project’s planning tracker (if one exists) and ask the human to choose.

