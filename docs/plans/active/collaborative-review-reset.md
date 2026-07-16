# Active plan - Markdown Collab review reset

## Outcome

Deliver the opt-in **Markdown Collab** review editor in which rendered prose and anchored, multi-turn conversations feel like one document. Several threads may retain drafts or await agent responses independently, and no turn becomes actionable until the human submits it.

## Product acceptance

- Rendered Markdown is the dominant surface; storage comments and thread IDs are not primary UI.
- Every anchored block exposes a quiet conversation affordance and visible state when threads exist.
- Starting, switching among, and revisiting at least three threads preserves each composer independently.
- The focused rail shows anchored context, full history, clear human/agent identity, waiting/resolved state, and a sticky composer.
- Save draft and Submit are distinct, with `Ctrl+Enter` as explicit submit; no focus change submits a turn.
- An all-thread activity view supports document-wide navigation without duplicating the full conversation UI.
- Source Markdown opens beside review mode without conversion or data loss.
- External file edits refresh the review surface without losing unrelated local composers.
- The top bar exposes **N comments ready** and copies one prompt for processing those comments together in the human's existing agent conversation.

## Implementation slices

### Slice 1 - Review document shell and contextual thread rail

- [x] Add an opt-in `CustomTextEditorProvider` and command/menu entry.
- [x] Build a safe review model from Markdown blocks, resolved anchors, and parsed threads.
- [x] Render a themed document column, inline markers, focused conversation rail, and activity drawer.
- [x] Support create, save draft, submit, close/reopen, and open source through guarded core mutations.
- [x] Preserve per-thread composer/focus state across model updates.

Acceptance:

- [x] Existing fixture renders with five correctly anchored conversations in the browser harness.
- [x] Three independent composers can be populated and revisited without text loss.
- [x] Submitting one thread does not submit or clear another thread's composer.
- [ ] Source and review views observe the same `TextDocument` changes.
- [x] Malformed thread data is visibly read-only.

### Slice 2 - Interaction refinement

- [x] Add keyboard navigation between anchors and threads, intentional focus restoration, and screen-reader labels/live regions.
- [x] Add responsive layouts for wide, narrow, and secondary-editor-group widths.
- [x] Refine empty, waiting, resolved, conflict, and re-anchor states.
- [x] Add a representative daily-use fixture that demonstrates several concurrent conversations without implementation-centric copy.

Acceptance:

- [x] The main workflow is usable without a mouse in the browser interaction harness.
- [x] The document remains readable at narrow editor widths in the browser interaction harness.
- [x] Visual hierarchy remains coherent under simulated VS Code light, dark, and high-contrast theme tokens.

### Slice 2.1 - Portable agent handoff

- [x] Count open threads awaiting an agent response as ready comments.
- [x] Add a host-backed clipboard action with singular/plural prompt text and malformed-document protection.
- [x] Confirm a successful copy with a short-lived **Copied ✓** label and restrained pulse.
- [x] Teach AGENTS.md-aware and Claude agents to process all ready comments as one coherent turn.
- [x] Keep handoff explicit and portable rather than injecting into a vendor chat surface.
- [x] Adopt Markdown Collab as the user-facing brand without breaking legacy extension IDs.

### Slice 3 - Distribution confidence

- [ ] Validate a clean dependency install, build, tests, package contents, and VSIX installation.
- [ ] Exercise the main workflow in supported VS Code.
- [ ] Exercise the same VSIX in current Cursor and record any editor-specific limitations.
- [ ] Update user documentation and screenshots only after UX acceptance.

## Validation contract

- Core and review-model tests run after every mutation/model slice.
- TypeScript build and whitespace checks pass before each self-review checkpoint.
- Webview review checks CSP, untrusted content handling, message validation, keyboard access, focus visibility, and theme tokens.
- A self-review records findings before a slice is considered ready; important findings are fixed and checks rerun.
- Human acceptance remains required for the final interaction quality judgment.

## Current evidence

- TypeScript build, Webview JavaScript syntax, and whitespace checks pass using the Codex-bundled Node runtime.
- All 25 core and review-model regression tests pass, including singular/plural agent-prompt generation.
- A headless rendered-interaction harness confirms the ready label, copy request, and **Copied ✓** feedback state as well as five anchored markers, no visible raw IDs, three preserved composers, isolation when another thread is submitted, keyboard thread navigation, re-anchor targeting, narrow-width readability, rail hiding/restoration, visible mutation notices, and disabled mutation controls for malformed data.
- Rendered screenshots were inspected under simulated VS Code light, dark, and high-contrast tokens; the document/rail hierarchy, focused anchor, controls, and conversation history remain legible in each.
- Production and development dependency audits report zero known vulnerabilities after upgrading the project-local packager and applying non-breaking lockfile fixes.
- VSIX packaging succeeds and includes the runtime Markdown renderer and packaged Webview assets while excluding `.agents`, tests, source, and archived material.
- The lockfile passes `npm ci --dry-run`; the `0.0.9` packaged VSIX installs and enumerates as `simpliq.codex-collab` in an isolated VS Code extension directory.
- `npm run test-kit` produces a portable, checksum-verified folder with the branded VSIX, standalone agent guidance, and installation README. Tagged builds publish the VSIX and complete ZIP through GitHub Releases.
- Official VS Code documentation supports an opt-in custom text editor over the standard `TextDocument`.
- Human screenshots and observation rejected the existing sidebar-plus-panel UX.
- Human testing confirms the reset UI experience is good; the remaining UX uncertainty is the complete clipboard-to-agent response loop.

## Constraints and risks

- The extension remains Markdown-only and file-backed; no external service or hidden conversation store.
- Review mode is not a WYSIWYG prose editor. Source editing remains native.
- Markdown rendering must not enable raw HTML or implicit external resource loading.
- Cursor compatibility is an explicit validation target, not an architectural assumption.
- Package-lock changes must be produced by npm; do not install project tooling globally.

## Resume point

In the real Extension Development Host, use the modified `tests/review_showcase.md` to verify that **Copy prompt** places the expected ready-count sentence on the Windows clipboard, then paste it into the existing agent conversation and verify that all ready comments are handled together with one `role=A` response per thread. Cursor remains a separate later validation target because it is not installed locally.
