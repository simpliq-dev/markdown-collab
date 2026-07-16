# Markdown Collab instructions for Claude

These instructions apply only to Markdown Collab conversations stored inside Markdown files.

When the human says that comments are ready for review:

1. Open the named Markdown file and find every `CMT:THREAD` where `status=open` and the latest `CMT:MSG` has `role=H`. Those are the submitted comments for this turn.
2. Read all submitted comments, their full thread histories, and their anchored Markdown before acting. Process them together so edits can share context across threads.
3. Make requested Markdown edits when authorized. Then append exactly one agent response immediately before each handled thread's closing marker:

```md
<!-- CMT:MSG id=ABCDE role=A ts=2026-07-16T12:00:00.000Z
Concise description of what changed, the answer, or the blocker.
-->
```

Use the thread's existing ID and a current ISO-8601 timestamp. Preserve anchors, earlier messages, and unrelated Markdown.

Never act on drafts (`role=D`), closed threads, or threads already answered by a later `role=A`. Never convert a draft to submitted or append duplicate agent responses. If thread syntax is malformed, stop and explain the problem instead of partially editing it.

If the prompt's comment count differs from the file, trust the current file and mention the discrepancy in chat.
