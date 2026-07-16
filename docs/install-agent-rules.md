# Installing Markdown Collab agent guidance

Markdown Collab stores submitted conversations in the Markdown file. The editor extension never calls a model, so the agent working in your existing chat needs a small repository instruction file explaining how to find and answer ready comments.

Choose the standalone file for your agent:

- `agent-guidance/AGENTS.md` for Codex and other AGENTS.md-aware agents.
- `agent-guidance/CLAUDE.md` for Claude.

Copy the selected file to the root of the Markdown project under its original filename. Each file is self-contained; it does not depend on this repository's build framework or require the longer `rules/COLLAB-RULES.md`.

If your project already has an `AGENTS.md` or `CLAUDE.md`, merge the short Markdown Collab workflow into that file rather than replacing unrelated project guidance.

The extension's **Copy prompt** action then produces a message such as:

> 3 comments are ready for review in docs/brief.md. Process them together as one coherent turn.

Paste that into the existing agent conversation and send it once. The agent should read every ready comment before editing, make coordinated changes, and append one `role=A` response to each thread it handled.

`rules/COLLAB-RULES.md` remains the detailed protocol reference for maintainers and unusual edge cases.
