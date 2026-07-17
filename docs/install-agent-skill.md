# Installing the Markdown Collab skill

Markdown Collab stores submitted conversations in the Markdown file. The editor extension never calls a model, so the agent working in your existing chat needs the `markdown-collab` skill to identify ready comments, preserve conversation history, and append responses safely.

The release kit contains one Agent Skills package at `skills/markdown-collab/`. Copy that complete folder unchanged into the project skill directory used by your agent:

- Codex or Cursor: `.agents/skills/markdown-collab/`
- Claude Code: `.claude/skills/markdown-collab/`
- Other clients that support the open Agent Skills format: use the project skill directory documented by that client.

Installing the skill does not require changing or replacing an existing `AGENTS.md`, `CLAUDE.md`, rule, or other skill. Some clients snapshot available skills when a conversation starts; open a new agent conversation if the newly installed skill is not found immediately.

The extension's **Copy prompt** action produces a message such as:

> Use the markdown-collab skill. 3 comments are ready for review in docs/brief.md. Process them together as one coherent turn. Preserve every existing Markdown Collab conversation unless I explicitly ask you to delete it.

Paste that into the existing agent conversation and send it once. The skill instructs the agent to read every ready comment before editing, make coordinated changes, append one `role=A` response to each handled thread, and verify that no existing conversation was removed or rewritten.

`rules/COLLAB-RULES.md` remains the detailed protocol reference for maintainers and unusual edge cases.
