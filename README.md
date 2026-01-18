# Codex Collab

File-backed, in-document threaded chat for Markdown, implemented as a VS Code extension.

The key idea is simple:
- Humans use the **Threads** sidebar UI to read and author messages.
- The “agent” (Codex) **edits the Markdown file directly** by reading/writing thread blocks.
- No external services and no API calls: the UI is a view over what’s already in the file.

## Features (current)

- Explorer sidebar **Threads** view for the active Markdown file
- Create a new thread at the current paragraph
- Expand/collapse threads (including Expand all / Collapse all)
- Full message history rendering (chat-like layout)
- Draft + submit flow (drafts are editable; submit creates the “human” message)
- Pending inference (when last role is `H`)
- Close / re-open thread (`status=open|closed`)
- Jump-to-anchor and re-anchor
- Filters: status (All/Open/Pending/Closed) and stage (All/Draft/Human/Agent) based on the **last** message role

## Thread block format (MVP)

Threads are represented as HTML comment blocks inside Markdown.

Example (simplified):

```md
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
<!-- CMT:MSG id=ABCDE role=H ts=2026-01-18T12:00:00.000Z
Hello from the human.
-->
<!-- CMT:MSG id=ABCDE role=A ts=2026-01-18T12:01:00.000Z
Hello from the agent.
-->
<!-- /CMT:THREAD id=ABCDE -->
```

Notes:
- `status` is **human-owned** and only `open|closed`.
- “Pending” is inferred (last message role is `H`).
- Message bodies escape `<!--` and `-->` to keep the comment structure valid.
- `ref=prev=N` anchors a thread to the prior N Markdown blocks (default `prev=1` if missing). `ref=file` targets the whole file.

## Develop / run locally

Prereqs:
- VS Code
- Node.js + npm

Install deps:

```sh
npm install
```

Build:

```sh
npm run build
```

Run in the Extension Development Host:
- Open this repo in VS Code
- Press `F5` (Run → Start Debugging)
- In the new VS Code window, open any `.md` file and check **Explorer → Threads**

### SMB shares / symlink errors

If you’re working on an SMB share that doesn’t support symlinks, npm may fail when creating `node_modules/.bin/*`.
This repo includes `.npmrc` with `bin-links=false` to avoid those symlinks.

## Repo layout

- `src/extension.ts`: VS Code extension + webview UI
- `src/core/`: parser/serializer for thread blocks
- `tests/`: manual Markdown samples for exercising the UI
- `docs/`: PRFAQ/PRD and ideation transcript

