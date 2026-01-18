# PLAN - codex-collab

## Current Milestone
- Milestone 6: Thread Authoring UX (chat-like).

## Milestones

### Milestone 1: Core Parsing & Model
**Outcome**
- Reliable in-file thread model.

**Tasks**
- [x] Implement parser (src/core/parser.ts)
- [x] Implement serializer (src/core/serializer.ts)

**Acceptance Checks**
- [x] Parse valid threads
- [x] Preserve formatting on round-trip

---

### Milestone 2: Thread UI & State
**Outcome**
- Create/submit/close/re-open threads.

**Tasks**
- [x] Webview UI scaffold
- [x] Draft (D) editing
- [x] Submit (D→H)
- [x] Close/Re-open

**Acceptance Checks**
- [x] Pending indicator works
- [x] Closed threads ignored

---

### Milestone 3: Re-anchor
**Outcome**
- Human-owned re-anchoring.

**Tasks**
- [x] Re-anchor command
- [x] Move thread block logic

**Acceptance Checks**
- [x] Thread relocates correctly

---

### Milestone 4 (V2): Diff & Highlighting
**Outcome**
- Deferred to v2 for trustworthy rewrites.

**Tasks**
- [ ] Capture pre/post snapshots
- [ ] Compute diff
- [ ] Editor decorations

**Acceptance Checks**
- [ ] Changes highlighted
- [ ] Clear command works

---

### Milestone 5: Navigation
**Outcome**
- Scale to many threads.

**Tasks**
- [x] Thread list filters
- [x] Jump-to-anchor

**Acceptance Checks**
- [x] Navigation accurate

---

### Milestone 6: Thread Authoring UX
**Outcome**
- Use the UI exclusively to create and continue thread conversations (mini chat sessions).

**Tasks**
- [x] Create thread at cursor (insert D block)
- [x] Show full message history per thread (expandable cards)
- [x] Add composer with Save draft / Submit (context-aware)
- [x] Enforce reply gating (no new draft when pending; only after agent reply)
- [x] Add filters by last message role (Draft/Human/Agent)
- [x] Use the first message as the thread summary snippet
- [x] Right-align/soft-shade Human + Draft message cards for chat clarity
- [x] Keep composer text on Save draft; clear on Submit
- [x] Reverse navigation: editor selection expands/highlights thread in sidebar
- [x] Add expand-all / collapse-all controls in the Threads view

**Acceptance Checks**
- [x] New thread inserts below target paragraph with valid IDs
- [x] Full chat history is visible when expanded
- [x] Composer only appears when appropriate and auto-saves file on actions
- [x] Cannot add a new draft when last message is `H` (pending)
- [x] Filters work by last message role (D/H/A) and status (open/closed)
- [x] Thread summary uses first message; H/D cards appear right-aligned with subtle shading
- [x] Composer keeps text on Save draft, clears on Submit, and selection in editor expands the matching thread
- [x] Expand-all/collapse-all toggles thread history display

---

## Repo Commands
- build: n/a (manual testing only; no automation configured)
- test: n/a (manual testing only; no automation configured)
- lint: n/a (manual testing only; no automation configured)
- run: n/a (manual testing only; no automation configured)

## Open Questions (Blockers)
- [x] Codex integration method (agent edits Markdown files directly; extension is file-backed UI only)
- [x] Canonical thread-block grammar (thread header + MSG blocks + required end marker; escape `<!--` and `-->` in message bodies)
- [x] `REF` semantics (MVP: `prev=N` uses Markdown blocks; default `prev=1`; `file` is entire file)
- [x] Status model: `status=open|closed` only (human-owned); actionability (“pending”) inferred from last message role
- [x] Re-validate Milestone 1 parser/serializer after UI scaffold is available (provisional pass requested)

## Decision Log
- Adopt VS Code extension.
- Use in-situ parking.
- Include diff in v1.
- Manual testing only (no build/test/lint/run commands).
- `REF` semantics (MVP): default `prev=1`; `prev=N` counts Markdown blocks; `file` targets entire file.
- Thread block grammar (MVP): `CMT:THREAD` header + `CMT:MSG` blocks + required end marker; escape `<!--` and `-->` in message bodies.
- Status model (MVP): `open|closed` only; “pending” is computed (last message `H`); agent does not update status.
- Codex integration (MVP): agent edits Markdown files directly; extension is file-backed UI only (no LLM/API calls in extension).
- Diff (v1): line-based diff.
- Scope change: Diff/highlight deferred to v2; prior v1 diff decisions are superseded.
- Messaging UX: filters operate on last message role; threads expand inline; composer is context-aware and disabled while pending.

## Worklog
- Initial design and v1 lock-in.
- 2026-01-17: Repo initialized (required docs present; PLAN header fixed; transcript reviewed; repo commands not yet discoverable from code/config).
- 2026-01-17: Repo commands clarified as n/a; proceed with manual testing.
- 2026-01-17: `REF` semantics locked (MVP): `prev=N` counts Markdown blocks; `REF: file` targets entire file.
- 2026-01-17: Thread block grammar locked (MVP): required thread end marker; message-body escaping for `<!--` and `-->`.
- 2026-01-17: Status model locked (MVP): `open|closed` only; pending is inferred from last message `H`; agent does not change status.
- 2026-01-17: Codex integration locked (MVP): agent edits files directly; extension provides UI over file contents.
- 2026-01-17: Diff choice locked (v1): line-based diff.
- 2026-01-17: Diff/highlight moved to v2 scope.
- 2026-01-17: Updated PRD/PRFAQ/PLAN to defer diff/highlighting to v2.
- 2026-01-17: Implemented thread parser/serializer scaffolding in `src/core/` (no automated validation; manual review pending).
- 2026-01-17: Milestone 1 provisional pass requested; defer manual validation until UI scaffold exists.
- 2026-01-17: Added VS Code extension scaffold with Threads webview (package.json, tsconfig, extension entry).
- 2026-01-17: Added `.npmrc` with `bin-links=false` to support installs on SMB shares.
- 2026-01-17: Updated build scripts to call TypeScript via `node` (works without npm bin links).
- 2026-01-17: Added Markdown test content and activated extension on Markdown files.
- 2026-01-17: Added VS Code launch config for extension debugging.
- 2026-01-17: User confirmed Threads view renders and refresh command appears in Extension Host.
- 2026-01-17: Added sample thread blocks to `tests/test_file1.md` for UI testing.
- 2026-01-17: Fixed view contribution to declare Threads as a webview view (prevents tree data provider error).
- 2026-01-17: Added draft editing UI in webview (editable D messages) with save-back to Markdown file.
- 2026-01-17: Normalized draft parsing/saving to avoid trailing newline growth in message bodies.
- 2026-01-17: Added Submit action (D→H) in the Threads webview.
- 2026-01-17: Submit now captures current draft textarea content in the same action.
- 2026-01-17: Auto-save the Markdown file after draft save/submit edits.
- 2026-01-17: Added Close/Re-open action to toggle thread status from the Threads view.
- 2026-01-17: Milestone 2 UI & state verified in Extension Host (draft, submit, close/re-open).
- 2026-01-17: Implemented re-anchor UI flow (select thread → click target paragraph) with block-based relocation.
- 2026-01-17: Adjusted re-anchor spacing to normalize blank lines on move.
- 2026-01-17: Milestone 3 re-anchor flow verified in Extension Host.
- 2026-01-17: Added jump-to-anchor (click thread ID to scroll editor to thread block).
- 2026-01-17: Added thread list filters (All/Open/Pending/Closed) in the Threads view.
- 2026-01-17: Milestone 5 navigation verified in Extension Host.
- 2026-01-17: Re-anchor now trims blank lines at the removal site to avoid leftover gaps.
- 2026-01-17: Re-anchor removal now preserves a single blank line only when one existed.
- 2026-01-17: Updated Threads UI (summary from first message, H/D card styling, composer clears, selection sync, expand/collapse all). Manual validation pending.
- 2026-01-17: Adjusted expand/collapse controls, draft composer retention, and draft styling. Manual validation pending.
- 2026-01-17: Milestone 6 acceptance checks validated in Extension Host.
- 2026-01-18: Added `README.md` and `.gitignore` for basic repo hygiene and local dev instructions.
- 2026-01-18: Added `templates/COLLAB-RULES.md` and `templates/AGENTS_addendum.md` templates for Codex read/respond rules.
- 2026-01-17: Milestone 1 parser/serializer validated via UI flows; blocker closed.
- 2026-01-17: Added UI actions for creating new threads and appending reply drafts.
- 2026-01-17: Normalized new-thread insertion spacing to a single blank line between blocks (avoids extra EOF blank lines).
- 2026-01-17: Planned next UX slice for chat-like threads (inline history + composer + last-role filters + reply gating).
- 2026-01-17: Implemented inline history, expandable threads, composer gating, and last-role filters (pending validation).
