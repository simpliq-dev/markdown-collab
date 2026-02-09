# Codex Collab — VS Code Marketplace Listing Copy (draft)

Use/adjust any of the following for the Marketplace listing + GitHub README.

---

## Extension name (Marketplace)
**Codex Collab**

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
Codex Collab adds **file-backed threads** to Markdown in VS Code.
Start a thread on any paragraph and keep a small conversation in a sidebar—while the thread data stays **inside your Markdown file** as HTML comment blocks.

### Why this exists
Sometimes you want a lightweight “conversation next to the text” without introducing a separate service, database, or review tool.
This is especially handy when collaborating with an AI assistant that edits Markdown: the assistant can read/write the thread blocks directly.

### Key properties
- **No external services**: threads are stored in the file; the extension makes no network calls.
- **Portable**: send the `.md` file to someone else and the threads come with it.
- **Simple model**:
  - `status=open|closed` is human-owned.
  - “Pending” is inferred when the last message role is `H`.

> Disclaimer: This project is not affiliated with VS Code, GitHub, OpenAI, or “Codex”.

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

## Suggested animated GIF (10–20s storyboard)
- Create thread → type message → Submit → show it becomes pending
- Close thread → it appears in Closed filter
- Re-open thread → reply from Agent appears

---

## Suggested categories / keywords
- Category: **Productivity** (or keep **Other** if you want to avoid overclaiming)
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
