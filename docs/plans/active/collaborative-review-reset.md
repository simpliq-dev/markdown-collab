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
- The top bar exposes **N comments ready** and copies one prompt that invokes the `markdown-collab` skill, processes those comments together, and preserves all conversation history unless deletion is explicitly requested.

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
- [x] Teach agents to process all ready comments as one coherent turn.
- [x] Keep handoff explicit and portable rather than injecting into a vendor chat surface.
- [x] Adopt Markdown Collab as the user-facing brand without breaking legacy extension IDs.

### Slice 2.2 - Intentional conversation deletion

- [x] Add guarded core mutations for deleting one conversation or every conversation while preserving surrounding Markdown.
- [x] Require an explicit warning confirmation before either deletion request reaches the extension host.
- [x] Keep malformed documents read-only and discard stale local composer state only after the corresponding conversation disappears.
- [x] Cover cancellation, confirmed requests, mutation behavior, line endings, and malformed input in automated checks.

### Slice 2.3 - Portable skill and conversation preservation

- [x] Replace separate `AGENTS.md` and `CLAUDE.md` setup files with one vendor-neutral Agent Skills package.
- [x] Invoke the `markdown-collab` skill explicitly in every copied handoff prompt.
- [x] Require explicit human authority before any thread or message deletion.
- [x] Require a post-edit check that every original thread and message remains intact.
- [x] Validate the skill package, copied prompt, release-kit contents, and a realistic preservation scenario.

### Slice 3 - Distribution confidence

- [x] Validate a clean dependency install, build, tests, package contents, release download, and isolated VSIX installation.
- [ ] Exercise the main workflow in supported VS Code.
- [ ] Exercise the same VSIX in current Cursor and record any editor-specific limitations.
- [x] Update user documentation and screenshots after UX acceptance.

## Validation contract

- Core and review-model tests run after every mutation/model slice.
- TypeScript build and whitespace checks pass before each self-review checkpoint.
- Webview review checks CSP, untrusted content handling, message validation, keyboard access, focus visibility, and theme tokens.
- A self-review records findings before a slice is considered ready; important findings are fixed and checks rerun.
- Human acceptance remains required for the final interaction quality judgment.

## Current evidence

- TypeScript build, Webview JavaScript syntax, and whitespace checks pass using the Codex-bundled Node runtime.
- All 29 core and review-model regression tests pass, including singular/plural skill-invoking prompts, the portable skill's preservation contract, and guarded deletion mutations.
- A headless rendered-interaction harness confirms the ready label, copy request, and **Copied ✓** feedback state as well as five anchored markers, no visible raw IDs, three preserved composers, isolation when another thread is submitted, per-thread and delete-all confirmations, cancellation without a mutation request, confirmed deletion requests, keyboard thread navigation, re-anchor targeting, narrow-width readability, rail hiding/restoration, visible mutation notices, and disabled mutation controls for malformed data.
- Rendered screenshots were inspected under simulated VS Code light, dark, and high-contrast tokens; the document/rail hierarchy, focused anchor, controls, and conversation history remain legible in each.
- Production and development dependency audits report zero known vulnerabilities after upgrading the project-local packager and applying non-breaking lockfile fixes.
- VSIX packaging succeeds and includes the runtime Markdown renderer and packaged Webview assets while excluding `.agents`, the separately distributed product skill, tests, source, and archived material.
- The lockfile passes `npm ci --dry-run`; the `0.0.10` packaged VSIX installs and enumerates as `simpliq.codex-collab` in an isolated VS Code extension directory.
- `npm run test-kit` produces a portable, checksum-verified folder with the branded VSIX, portable Agent Skill, and installation README. Tagged builds publish the VSIX, complete `.tar.gz` archive, and a standalone skill archive through GitHub Releases.
- The Agent Skills validator accepts `skills/markdown-collab/SKILL.md`; a fresh-agent forward test processed the one actionable thread in the five-thread fixture, preserved all five IDs and eight pre-existing messages, and changed no draft, closed, answered, anchor, or unrelated prose content.
- The public [`v0.0.10-test.1` prerelease](https://github.com/simpliq-dev/markdown-collab/releases/tag/v0.0.10-test.1) passed its clean GitHub Actions build. The VSIX and `.tar.gz` assets were downloaded back from GitHub, their published SHA-256 digests matched, the archive contents were inspected, and the downloaded VSIX installed as `simpliq.codex-collab@0.0.10` in an isolated VS Code profile.
- The stable [`v0.0.11` release](https://github.com/simpliq-dev/markdown-collab/releases/tag/v0.0.11) publishes the renamed repository's current assets as `markdown-collab-0.0.11.vsix` and `markdown-collab-0.0.11.tar.gz`, with standalone `AGENTS.md` and `CLAUDE.md` attachments and no test-only download naming.
- Official VS Code documentation supports an opt-in custom text editor over the standard `TextDocument`.
- Human screenshots and observation rejected the existing sidebar-plus-panel UX.
- Human testing confirms the reset UI is working well; the remaining UX uncertainty is the complete clipboard-to-agent response loop.

## Constraints and risks

- The extension remains Markdown-only and file-backed; no external service or hidden conversation store.
- Agent processing must treat existing thread blocks as durable human-owned history. Applying feedback is never implicit permission to delete it.
- Review mode is not a WYSIWYG prose editor. Source editing remains native.
- Markdown rendering must not enable raw HTML or implicit external resource loading.
- Cursor compatibility is an explicit validation target, not an architectural assumption.
- Package-lock changes must be produced by npm; do not install project tooling globally.

## Resume point

Validate the new `markdown-collab` skill and release kit, then install the next packaged VSIX for final human acceptance of the complete clipboard-to-agent response loop. Cursor behavior remains a separate validation target because Cursor is not installed locally.
