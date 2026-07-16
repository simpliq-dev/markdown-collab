# Claude guidance

Read and follow `AGENTS.md`, including its Collaborative Review protocol.

When the human says that comments are ready in a Markdown file:

- Process every open `CMT:THREAD` whose latest message is a submitted human `role=H` message as one coherent turn.
- Read all anchors and comments before editing so changes can share context across threads.
- Make authorized document edits and append one concise `role=A` response to each handled thread.
- Ignore drafts (`role=D`) and closed or already-answered threads. Preserve IDs, anchors, history, and unrelated content.

Use `rules/COLLAB-RULES.md` for the exact file grammar.
