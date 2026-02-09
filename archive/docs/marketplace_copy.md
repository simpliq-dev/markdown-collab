# codex-collab — VS Code Marketplace Listing Copy (draft)

Use/adjust any of the following for the Marketplace listing + GitHub README.

---

## Extension name (Marketplace)
**codex-collab**

## Subtitle / short tagline (1-liner)
**File-backed threaded chat for Markdown.**

Alternative options:
- **In-document threads for Markdown (stored in the file).**
- **A sidebar Threads view for Markdown comment blocks.**

## package.json `description` (short)
Pick one:
1) **In-file threaded chat for Markdown (file-backed threads in HTML comments).**
2) **Threaded comments for Markdown stored directly in the document.**
3) **A file-backed Threads sidebar for Markdown collaboration.**

---

## Marketplace “Overview” (README top section)

### What it is
codex-collab adds **file-backed threads** to Markdown in VS Code.
Start a thread on any paragraph and keep a small conversation in a sidebar—while the thread data stays **inside your Markdown file** as HTML comment blocks.

### Why this exists
Sometimes you want a lightweight “conversation next to the text” without introducing a separate service, database, or review tool.

This is especially handy when collaborating with **OpenAI Codex**:
- the human uses the VS Code UI
- Codex reads/writes the thread blocks directly by editing the Markdown file

(It can also work with other agentic systems that can read/write files.)

### Key properties
- **No external services**: threads are stored in the file; the extension makes no network calls.
- **Portable**: send the `.md` file to someone else and the threads come with it.
- **Simple model**:
  - `status=open|closed` is human-owned.
  - “Pending” is inferred when the last message role is `H`.

> Disclaimer: This project is not affiliated with VS Code, GitHub, OpenAI, or “Codex”.

---

## Using with Codex (required for best results)

The extension supports multiple concurrent threads, but you typically still drive Codex with a **single serial prompt**.

Recommended prompt pattern:

> “Open `<path/to/file.md>`. For each `CMT:THREAD` where `status=open` and the last `CMT:MSG` has `role=H`, append one new `CMT:MSG` with `role=A` answering the human. Do not modify other content.”

### Install the agent rules into your repo

codex-collab works best when your repo includes a small set of rules that teach Codex how to read/respond to the thread blocks.

Copy these files into your project:
- `rules/COLLAB-RULES.md`
- `rules/AGENTS_addendum.md` (append into your existing `AGENTS.md`)

Links:
- Install guide: https://github.com/simpliq-dev/codex-collab/blob/main/docs/install-agent-rules.md
- Rules:
  - https://github.com/simpliq-dev/codex-collab/blob/main/rules/COLLAB-RULES.md
  - https://github.com/simpliq-dev/codex-collab/blob/main/rules/AGENTS_addendum.md

---

## Features (bullet list)
- Explorer sidebar **Threads** view for the active Markdown file
- Create a new thread at the current paragraph
- Expand/collapse threads (including Expand all / Collapse all)
- Chat-style message history rendering
- Draft + submit flow (drafts editable; submit produces a human message)
- “Pending” inference when last role is `H`
- Close / re-open threads (`status=open|closed`)
- Jump-to-thread and re-anchor (move a thread to another paragraph)
- Filters: status (All/Open/Pending/Closed) and stage (All/Draft/Human/Agent)

---

## Quick start (short)
1) Open any `.md` file
2) In the Explorer sidebar, open **Threads**
3) Click **New thread** (or select a paragraph first)

---

## Suggested screenshots (3–4)
1) Threads sidebar showing multiple threads + status/stage filters
2) One thread expanded showing chat history + composer
3) Pending thread example (last message = Human)
4) Re-anchor banner + the thread moved under a new paragraph

### How screenshots appear on the Marketplace page

VS Code Marketplace renders your extension page from your packaged `README.md`.
So to show screenshots, add them as Markdown images in `README.md`, for example:

```md
## Screenshots

![Threads view](imgs/01-threads-view_1600.png)
```

## Suggested animated GIF (10–20s storyboard)
- Create thread → type message → Submit → show it becomes pending
- Close thread → it appears in Closed filter
- Re-open thread → reply from Agent appears

---

## Suggested categories / keywords
- Category: **Other** ("Productivity" is not a valid VS Code Marketplace category)
- Keywords to mention in README: markdown, threads, comments, sidebar, collaboration, file-backed

---

## Known limitations (honest, short)
- Markdown only (currently activates on Markdown files)
- Threads are stored as HTML comments; they may be visible in raw Markdown
- No syncing across files/workspaces beyond what your version control / file sharing provides

---

## Thread block format (for README)
```md
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
<!-- CMT:MSG id=ABCDE role=H ts=2026-02-08T12:00:00.000Z
Hello from the human.
-->
<!-- CMT:MSG id=ABCDE role=A ts=2026-02-08T12:01:00.000Z
Hello from the agent.
-->
<!-- /CMT:THREAD id=ABCDE -->
```

Roles:
- `D` = Draft
- `H` = Human
- `A` = Agent
