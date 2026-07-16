# Decisions

## 2026-07-15 - Use an opt-in custom text editor for Collaborative Review

**Decision:** Register a `CustomTextEditorProvider` for Markdown with contribution priority `option`. Open it through an explicit **Markdown Collab: Open Collaborative Review** command and keep the native source editor immediately available.

**Why:** The rejected sidebar-plus-panel implementation cannot place rendered prose, anchors, and contextual conversations in one coherent interaction surface. VS Code custom text editors use the standard `TextDocument`, support normal text-document save and hot-exit behavior, and synchronize changes made by other editors or extensions. This gives the product a rich document surface without inventing a new file or document model.

**Evidence:** [VS Code Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors) and the official [custom editor sample](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample).

**Reversibility:** Review mode is optional rather than the default Markdown editor. Removing the provider leaves the Markdown file and all conversations intact.

## 2026-07-15 - Put contextual comments and the all-thread list in one review surface

**Decision:** Render Markdown as the dominant document column. Place lightweight conversation markers on anchored blocks and open the focused conversation in an adjacent rail inside the same Webview. Provide an all-thread activity view for scanning open, waiting, draft, and resolved conversations.

**Why:** Contextual comments support local reading; a list supports document-wide triage. Word deliberately offers both contextual and list views, and Google Docs combines anchored comments with an all-comments view and keyboard navigation. The current product needs both, but should not duplicate full controls in an Explorer sidebar.

**Evidence:** [Microsoft Modern Comments](https://support.microsoft.com/en-us/word/modern-comments-in-word) and [Google Docs comments](https://support.google.com/docs/answer/65129?hl=en).

## 2026-07-15 - Preserve several independent drafts and require explicit submission

**Decision:** Maintain composer state per thread. Unsaved composer text is view state; **Save draft** writes `role=D`; **Submit** writes `role=H`; `Ctrl+Enter` submits. Switching threads never implicitly saves or submits.

**Why:** The core use case is several simultaneous prompt/response threads with the human controlling when each turn becomes actionable. Explicit posting is also a central confidence property of modern document comments.

## 2026-07-15 - Treat Webview content as untrusted and avoid implicit network access

**Decision:** Package scripts and styles as local files, use a restrictive content security policy, restrict local resources, render Markdown with raw HTML disabled, validate incoming messages, and do not load remote document resources automatically.

**Why:** Markdown, message text, file paths, and workspace settings are untrusted. The official Webview guidance requires minimum capabilities, CSP, and sanitization. The privacy promise also argues against silently fetching remote images while opening a document.

**Evidence:** [VS Code Webview security guidance](https://code.visualstudio.com/api/extension-guides/webview#security).

## 2026-07-15 - Validate Cursor separately

**Decision:** Keep to stable VS Code APIs compatible with the declared engine, but do not claim Cursor parity until the packaged extension is exercised there.

**Why:** Cursor is VS Code-based and supports importing extensions, but its upstream cadence and custom-editor behavior can diverge. Recent Cursor reports show custom text editors in use as well as editor-specific conflicts and regressions. Compatibility is probable, not guaranteed.

**Evidence:** [Cursor's VS Code migration documentation](https://docs.cursor.com/get-started/migrate-from-vs-code) and a recent [Cursor custom-editor interaction report](https://forum.cursor.com/t/allow-extensions-to-hide-the-preview-markdown-toggle-for-custom-editors/162724).

## 2026-07-16 - Hand off ready comments through an explicit copied prompt

**Decision:** Count open threads whose latest message is `role=H` as **N comments ready**. Provide a small **Copy prompt** action that names the Markdown file and asks the human's current agent conversation to process those comments together as one coherent turn.

**Why:** Cross-extension composer injection is not a supported, portable contract and would be brittle across Codex, Claude, Cursor, and future agents. Clipboard handoff preserves one continuous chat, keeps the human in control of sending, and leaves the extension agent-neutral.

**Boundary:** Copying never sends a prompt, starts a task, attaches a file, or invokes a model. Repository-level `AGENTS.md` and `CLAUDE.md` explain how an agent should process the submitted comments and append responses.

## 2026-07-16 - Use Markdown Collab as the provider-neutral product brand

**Decision:** Use **Markdown Collab** in the extension UI, commands, documentation, privacy language, and agent guidance. Keep the existing `codex-collab` package name and `codexCollab.*` contribution IDs as legacy technical identifiers for update and keybinding compatibility; use the renamed `markdown-collab` repository URL for active links.

**Why:** The file format and workflow support VS Code and Cursor as editors and Codex, Claude, or another file-editing agent. A provider-specific brand understates that scope, while changing published extension identity would create an avoidable migration break.

## 2026-07-16 - Confirm destructive conversation deletion in the review surface

**Decision:** Allow deletion of one conversation and deletion of all conversations from Collaborative Review. Both actions open an explicit confirmation dialog before any mutation is requested. Cancellation must leave the file untouched, and malformed documents remain read-only.

**Why:** File-backed conversations need an intentional way to remove obsolete or sensitive discussion, but deletion is permanent and bypasses the reversible open/closed lifecycle. Keeping the warning in the review surface makes the scope visible and preserves the normal document-version guard.

## 2026-07-16 - Publish complete test kits as compressed tar archives

**Decision:** GitHub Releases remains the primary direct distribution channel. Tagged builds publish a standalone VSIX and a complete `.tar.gz` test kit containing the VSIX, agent guidance, installation README, and checksum.

**Why:** The VSIX remains convenient for installation, while `.tar.gz` is a familiar, portable release format for a developer-oriented audience. Generated binaries stay out of repository history and every published asset is built from the tagged source by CI.

## 2026-07-16 - Protect main with validated pull-request merges

**Decision:** Protect `main` so changes arrive through pull requests, the build/test/package check passes, and review conversations are resolved. Apply the requirements to administrators as well; keep force pushes and branch deletion disabled. Layer an **Admin-only main updates** ruleset over the protection rule so only the `simpliq-dev` administrator can update or merge into `main`.

**Why:** Requiring the same reproducible validation before every merge protects the directly distributed VSIX while retaining a practical single-maintainer workflow with no mandatory second-person approval. The targeted ruleset lets write collaborators continue pushing feature branches and opening pull requests without granting them authority to publish changes to `main`.
