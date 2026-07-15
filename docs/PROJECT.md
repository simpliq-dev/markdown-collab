# Project state - codex-collab

## Purpose

codex-collab turns a Markdown file into a durable human-agent collaboration document. The prose and every anchored conversation travel together in the same file, while VS Code provides a calm review experience for sustained, multi-turn work.

The primary user is someone editing substantial Markdown with an agent and wanting several independent discussions to remain active without surrendering control over when any prompt becomes actionable.

## Experience contract

- **The document remains one Markdown file.** Conversation blocks are canonical in-file data; there is no thread database, hosted service, or hidden sidecar state required to reconstruct submitted work.
- **Collaborative Review is a document surface, not an extra card panel.** It renders the Markdown as a readable document and places thread markers directly beside their anchored content.
- **Text and discussion stay visually coupled.** Selecting a marker opens its complete conversation in a contextual rail, highlights the anchor, and keeps the document in view.
- **Several conversations can be in flight.** Each thread can retain its own unsaved composer state or file-backed draft while the human moves between threads.
- **Submission is explicit.** Typing does not create an agent turn. The human chooses when to save a draft and when to submit it; `Ctrl+Enter` is the deliberate submit shortcut.
- **The conversation is full-fidelity from the first turn.** History, authorship, pending state, anchored context, and a substantial composer are present from creation onward.
- **Raw Markdown remains available.** Collaborative Review is an opt-in custom text editor over the same `TextDocument`; opening the source editor never converts or forks the file.
- **The interface is document-first and calm.** Internal IDs and storage metadata are secondary. The dominant visual hierarchy is prose, contextual discussion, and clear next action.

## Interaction model

1. Open a Markdown file in **Collaborative Review**.
2. Hover or focus a rendered Markdown block to reveal **Start conversation**.
3. Starting a conversation focuses a substantial composer anchored to that block. The human may type, leave, and start or revisit other threads without losing work.
4. **Save draft** persists a `role=D` message in the Markdown file but does not make it actionable to the agent.
5. **Submit** converts or appends the turn as `role=H`. That thread becomes waiting while other threads remain independently editable or submit-ready.
6. An agent that edits the file appends `role=A` responses. The review surface updates without replacing unrelated composer state.
7. The human can continue, resolve/reopen, re-anchor, browse all conversations, or open the Markdown source.

## Durable boundaries

- The extension is agent-neutral and does not call an LLM API.
- Persist only `open|closed`; infer waiting/pending when the latest submitted message is human-authored.
- Preserve the existing `CMT:THREAD` / `CMT:MSG` grammar unless a backward-compatible migration earns its cost.
- No real-time multi-user transport, external notifications, account system, PR/MR review, or separate conversation database.
- Collaborative Review is not a WYSIWYG Markdown authoring surface. Substantive prose editing remains in the native text editor; review mode owns conversation interaction and small document-linked actions.
- Workspace content is untrusted input. The Webview uses a restrictive content security policy, external packaged scripts/styles, escaped or safely rendered Markdown, and no implicit network loading.

## Current reality

The parser, serializer, anchor resolver, and guarded mutation core are useful and covered by 19 passing regression tests. They already support backward-compatible parsing, deterministic thread creation, independent draft/submit state, close/reopen, re-anchoring, malformed-document protection, and CRLF preservation.

The first Webview renovation did not meet the experience contract. It reproduced the old card UI in an Explorer view and a larger editor panel, duplicated controls, exposed implementation metadata, and separated the conversation from the rendered document. Its state-preservation and mutation plumbing may be reused, but its presentation model is superseded.

The active reset is tracked in [plans/active/collaborative-review-reset.md](plans/active/collaborative-review-reset.md). Consequential rationale is in [DECISIONS.md](DECISIONS.md), and superseded material remains under [archive](archive/README.md) and [plans/archive](plans/archive/).

## Success evidence

- A user can understand where conversations belong without reading raw `CMT` blocks or thread IDs.
- Creating, switching among, drafting, and independently submitting at least three anchored threads feels natural in one document surface.
- Selecting a thread and selecting its anchor are visibly and predictably connected.
- Unsaved text in multiple composers survives thread switching and document refreshes.
- Existing valid files remain backward compatible; malformed thread data is visible and never silently mutated.
- Keyboard-only operation, focus indication, theme adaptation, and basic screen-reader structure are intentional.
- Automated core and review-model tests, TypeScript build, Webview security checks, and human workflow acceptance pass in VS Code.
- Cursor is validated separately and any editor-specific limitations are documented rather than assumed away.
