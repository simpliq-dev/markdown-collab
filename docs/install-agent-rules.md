# Installing the Codex Collab agent rules into your project

Codex Collab (the VS Code extension) stores conversations in your Markdown files.
To make an agent (especially **OpenAI Codex**) reliably read/respond to those threads, you should add the Codex Collab rules to your project.

This repo provides two files:

- `rules/COLLAB-RULES.md` — the canonical “how the agent must behave” rules
- `rules/AGENTS_addendum.md` — a copy/paste addendum you append to your existing `AGENTS.md`

## Option A: Copy the files manually

1) Copy these two files into your repo:
   - `rules/COLLAB-RULES.md`
   - `rules/AGENTS_addendum.md`

2) If you already have an `AGENTS.md`, append the contents of `rules/AGENTS_addendum.md` to the end.

3) If you don’t have an `AGENTS.md`, either:
   - rename `rules/AGENTS_addendum.md` → `AGENTS.md`, or
   - create `AGENTS.md` and paste the addendum content into it.

4) If you store the rules somewhere else (not `rules/`), update the path in the addendum accordingly.

## Option B: Copy from GitHub (quick)

From the root of your repo:

```bash
mkdir -p rules
curl -L -o rules/COLLAB-RULES.md https://raw.githubusercontent.com/simpliq-dev/codex-collab/main/rules/COLLAB-RULES.md
curl -L -o rules/AGENTS_addendum.md https://raw.githubusercontent.com/simpliq-dev/codex-collab/main/rules/AGENTS_addendum.md
```

Then append the addendum into your `AGENTS.md`.

## How to use with Codex (important)

The extension supports multiple concurrent threads, but most agent systems work best when you drive them with a **single serial prompt**.

Recommended prompt pattern:

> “Open `<path/to/file.md>`. For each `CMT:THREAD` where `status=open` and the last `CMT:MSG` has `role=H`, append one new `CMT:MSG` with `role=A` answering the human. Do not modify other content.”

If you want multi-file processing, explicitly list the file paths.
