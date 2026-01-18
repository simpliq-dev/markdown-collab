# Product Requirements Document (PRD)

## Overview

### Goals
- Enable full-fidelity, multi-threaded AI chat anchored to a single Markdown document.
- Preserve all collaboration state inside the file.
- Keep the document primary; threads remain coupled to text.

### Non-Goals
- Do not compress or limit AI reasoning quality.
- Do not introduce external storage or servers.
- Do not auto-manage threads on behalf of the human.
- Diff/change highlighting in v1 (deferred to v2).

## Target User / Persona
- **Primary**: Long-form writers/editors using VS Code and Markdown, collaborating with AI iteratively.

## Glossary
- **Thread**: A structured comment conversation anchored to a paragraph/section.
- **CMT ID**: 5-character Crockford Base32 identifier unique within a file.
- **D**: Draft (non-actionable human text).
- **H**: Submitted human instruction (actionable).
- **A**: Agent response (append-only).
- **In-situ parking**: Closed threads remain at their anchor, visually collapsed.

## REF Semantics (MVP)
- `REF` defines what text a thread refers to for context and (optionally) rewrite scope.
- Supported values:
  - `REF: prev=N` where `N` is a positive integer.
  - `REF: file` for whole-file guidance.
- Defaulting: if `REF` is missing, treat it as `REF: prev=1`.

### `REF: prev=N` block counting
- The referenced target is the **N Markdown blocks immediately preceding** the thread block.
- A “Markdown block” is defined using CommonMark-style block parsing:
  - Paragraph block (one or more lines of prose).
  - Contiguous list block (the entire list counts as 1 block).
  - Fenced code block (counts as 1 block).
  - Blockquote block (counts as 1 block).
  - Heading line (counts as 1 block).
- Thread comment blocks themselves are not counted as Markdown blocks.
- UI should highlight the resolved referenced block(s) so the user can confirm what `prev=N` will target.

### `REF: file`
- Applies to the **entire file** (global guidance), not a section.

## Thread Block Grammar (MVP)

### Goals
- Human-readable in raw Markdown.
- Minimal notation (avoid file/parsing bloat).
- Deterministic parsing and round-trippable serialization.
- Supports multiple threads per referenced block (e.g., multiple thread blocks after the same paragraph).

### Canonical Form
A thread is encoded as a sequence of HTML comments:

1) **Thread header** (single-line HTML comment):
```md
<!-- CMT:THREAD id=K7Q9M status=open ref=prev=1 -->
```

2) **Zero or more message blocks**, each as a single HTML comment whose first line is metadata and whose remaining content is the message body:
```md
<!-- CMT:MSG id=K7Q9M role=H ts=2026-01-17T09:03:00Z
Rewrite to reduce repetition; keep tone.
-->
```

3) **Thread end marker** (required):
```md
<!-- /CMT:THREAD id=K7Q9M -->
```

### Fields
- `id` (required): thread identifier; must match the thread header `id`.
- `status` (required): `open` or `closed` (human-owned; see “Status & Actionability”).
- `ref` (optional): `prev=N` or `file`; if omitted, default `prev=1`.
- `role` (required for messages): `D` (draft), `H` (submitted human), `A` (agent).
- `ts` (optional): ISO-8601 timestamp, tooling-generated.

### Parsing/Behavior Rules
- A thread begins at `CMT:THREAD` and ends at the matching required ` /CMT:THREAD`.
- A thread is “pending” (needs action) iff `status=open` and the last message `role` is `H`.
- Multiple threads may reference the same target block(s) (e.g., multiple thread blocks after the same paragraph); each thread is independent by `id`.

### Escaping Rule (Required)
HTML comment bodies cannot safely contain the sequences `-->` or `<!--` without risking premature termination or nested-comment ambiguity.

- Tooling MUST escape these sequences when writing message bodies to the file:
  - `<!--` becomes `&lt;!--`
  - `-->` becomes `--&gt;`
- Tooling MUST unescape these sequences when rendering/editing message bodies in the UI.

## Status & Actionability (MVP)
This product uses two different concepts:

1) **Thread Status** (stored in-file; human/UI-owned)
- `status=open|closed` is the only persisted status in the Markdown file.
- Humans (via UI) may toggle `open`/`closed`.
- The agent MUST NOT change `status` (no auto-close, no “answered” status).

2) **Actionability State** (computed; not stored)
- “Pending / needs action” is computed from message roles:
  - Pending iff `status=open` and the last message is `role=H`.
  - Not pending if last message is `role=A` or `role=D` (drafts are non-actionable).
- “Answered” is represented structurally by the presence of an `A` message after the most recent `H` message, not by a status field.

## Decisions (Ledger)

### Product & UX
- Threads are full-fidelity chats; UI manages space, not content.
- Document remains primary; threads increase local salience without detaching.
- Closed threads are parked in situ and ignored by the agent; humans can re-open.
- Re-anchoring is human-owned, UI-assisted.

### Data & Persistence
- Single canonical store: Markdown file.
- Thread structure encoded as HTML comments.
- No external DB.

### Agent Authority
- Agent scans for open threads with latest submitted human turn.
- Agent may reply and/or rewrite when authorized.
- Agent cannot initiate, move, close, or re-open threads.

### Agent Integration (Operational Model)
- The agent (“Codex”) reads and writes the Markdown file directly.
- The VS Code extension does not call an LLM API; it provides UI for humans and reflects whatever is in the file.
- The extension must tolerate out-of-band edits (agent edits, manual edits, merges) by re-parsing on file change.

### Identifiers
- `CMT: <5-char ALL CAPS Crockford Base32>`; file-local uniqueness; UI collision-checked.
- UI provides one-click copy.

### Platform
- VS Code extension with Webview UI.
- No local webserver.

## Feature Specs (Prioritized)

---
### F1. Thread Parsing & Rendering (P0)

**User Story**
As a writer, I want existing threads to appear reliably so I can continue work.

**Scope**
- Parse CMT headers, STATUS, REF, and D/H/A blocks.
- Render threads in a dedicated view.

**Non-Goals**
- No auto-repair of malformed threads.

**Preconditions**
- User has a Markdown file open.

**UX Flow**
1. File opens.
2. Extension parses threads.
3. Thread list renders with open/closed states.

**UI Contract**
- View: Thread List Panel.
- Controls: Filter (Open/Closed/Pending).
- Validation: Malformed blocks flagged non-destructively.

**Data Model Impact**
- Entity: Thread { id, status, ref, messages[] }.
- Source of truth: file text.

**Interfaces**
- Internal parser API: `parseThreads(text) -> Thread[]`.

**Edge Cases**
- Duplicate IDs (UI flags).
- Partial blocks.

**Acceptance Criteria**
- Given a valid thread, when file opens, then thread appears.
- Given STATUS=closed, then agent ignores it.

---
### F2. Draft & Submit Flow (P0)

**User Story**
As a writer, I want to draft thoughts safely and submit when ready.

**Scope**
- Create thread with D block from the UI at the cursor.
- Add new D blocks to existing threads (reply flow).
- Convert D → H on submit.

**Non-Goals**
- No auto-submit.

**UX Flow**
1. User clicks “New Thread” at the target paragraph.
2. Types draft (D) in the UI.
3. Clicks Submit → H created.
4. After an agent reply, user can click “Reply” to add another D block.

**UI Contract**
- Button: Submit.
- State: Pending (awaiting agent).
- Error: Prevent double submit.

**Data Model Impact**
- Message { role: D|H|A, content } appended.

**Interfaces**
- Command: `submitDraft(threadId, directive)`.

**Acceptance Criteria**
- Given D exists, when submit, then H replaces D.

---
### F3. In-situ Parking & Re-open (P0)

**User Story**
As a writer, I want resolved threads to disappear but be recoverable.

**Scope**
- Collapse closed threads.
- Re-open sets STATUS=open.

**Non-Goals**
- No physical relocation.

**UX Flow**
1. Close thread.
2. Thread collapses.
3. Re-open restores.

**UI Contract**
- Toggle: Close/Re-open.

**Acceptance Criteria**
- Closed threads ignored by agent.
- Re-open restores actionability.

---
### F4. Re-anchoring (P0)

**User Story**
As a writer, I want to re-attach a thread after rewrites.

**Scope**
- One-click re-anchor.
- Move thread block.

**UX Flow**
1. Select thread.
2. Activate re-anchor.
3. Click paragraph.

**UI Contract**
- Mode: Re-anchor cursor.
- Error: Invalid target.

**Data Model Impact**
- Thread block moved in file.

**Acceptance Criteria**
- Thread appears below new paragraph.

---
### F5. Diff & Change Highlighting (V2)

**User Story**
As a writer, I want to trust AI rewrites.

**Scope**
- Deferred to v2.

**Non-Goals**
- Semantic diff.
- Word/character diff in v2.

**UX Flow**
1. Agent rewrite occurs.
2. Highlights appear.
3. User clears.

**UI Contract**
- Decorations in editor.

**Acceptance Criteria**
- Changes are visibly highlighted.

---
### F6. Navigation & Visibility (P1)

**User Story**
As a writer, I want to navigate threads at scale.

**Scope**
- Thread list.
- Jump to anchor.
- Pending indicators.

**Acceptance Criteria**
- Jump scrolls to correct location.

## Non-Functional Requirements
- Performance: Parse within 100ms for typical chapters.
- Security: No external data exfiltration.
- Privacy: File-local only.
- Reliability: Deterministic operations; no hidden state.

## Spec Gap Audit
- N/A for MVP: agent edits the file directly (no API/clipboard ingestion path in the extension).
- Diff algorithm choice (v2).
- Handling of malformed comment blocks.

## Open Questions
- [BLOCKER] How does Codex integration occur (manual paste vs API)?
- Should thread parsing be incremental or full-file each time?
