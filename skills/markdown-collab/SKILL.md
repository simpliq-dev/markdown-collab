---
name: markdown-collab
description: Process submitted Markdown Collab conversations embedded in Markdown as CMT:THREAD and CMT:MSG HTML comments. Use when the human says comments are ready, asks to review or respond to Markdown Collab threads, or explicitly asks to use the markdown-collab skill.
---

# Process Markdown Collab conversations

Treat the Markdown file as the source of truth. Process all submitted comments for the requested turn together, edit the surrounding document only when requested, and append one agent response to each handled thread.

## Preserve every conversation

- Treat every existing `CMT:THREAD` wrapper and `CMT:MSG` as human-owned collaboration history.
- Never delete, replace, truncate, resolve, close, re-anchor, reorder, or rewrite an existing conversation unless the human explicitly asks for that exact operation in the current request.
- Do not interpret requests such as “review the comments”, “apply the comments”, “resolve the feedback”, or “clean up the document” as permission to remove conversations.
- Preserve drafts (`role=D`), closed threads, answered threads, headers, footers, IDs, references, statuses, timestamps, and earlier messages exactly.
- Keep each thread with the passage it follows when editing that passage. If a requested restructure would make the anchor ambiguous, stop and ask instead of moving or deleting the thread on your own.
- If the human explicitly requests deletion, delete only the named conversation or stated scope. Ask before acting when the scope is ambiguous.

## Process one turn

1. Open the Markdown file named in the prompt. If no file is named and the intended file is not unambiguous, ask for the path.
2. Parse all `CMT:THREAD` blocks before editing. Stop without changing the file if a wrapper, message, or closing marker is malformed.
3. Record every thread ID and the existing messages in each thread so preservation can be checked after editing.
4. Select threads where `status=open` and the latest `CMT:MSG` has `role=H`. Do not act on drafts, closed threads, or threads already answered by a later `role=A`.
5. Read all selected comments, their full histories, and their anchored Markdown before acting. Handle them as one turn so related edits share context.
6. Make the requested document edits when authorised. Do not change unrelated Markdown.
7. Append exactly one `role=A` message immediately before the closing marker of each handled thread. Use the existing thread ID and a current ISO-8601 timestamp:

```md
<!-- CMT:MSG id=ABCDE role=A ts=2026-07-17T12:00:00.000Z
Concise description of what changed, the answer, or the blocker.
-->
```

Escape `<!--` as `&lt;!--` and `-->` as `--&gt;` inside message bodies.

## Check the result

Before reporting completion, re-read the file and verify:

- every original thread ID still appears exactly once;
- every pre-existing message remains present and unchanged;
- only the expected new `role=A` messages were added to conversation blocks;
- no draft, closed, answered, or unrelated thread was changed;
- requested prose edits did not strand a thread away from the passage it follows; and
- each selected thread received exactly one response.

If the prompt's ready-comment count differs from the file, trust the current file and mention the discrepancy. If any preservation check fails, restore the affected conversation before doing anything else and do not claim success until the file passes all checks.
