# Decisions

## 2026-07-15 - Use an opt-in custom text editor for Collaborative Review

**Decision:** Register a `CustomTextEditorProvider` for Markdown with contribution priority `option`. Open it through an explicit **Codex Collab: Open Collaborative Review** command and keep the native source editor immediately available.

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
