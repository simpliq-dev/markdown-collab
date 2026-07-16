# Superseded plan - Webview maturity renovation

This plan is preserved as evidence of the first renovation. Human acceptance on 2026-07-15 rejected its sidebar-plus-focused-panel presentation as visually and experientially too similar to the prototype. The parser, mutation, anchor, and state-preservation work remains reusable; the UI architecture is superseded by [Collaborative Review reset](../active/collaborative-review-reset.md).

## Completed technical work

- Added executable parser/serializer regression coverage and strict diagnostics for malformed thread structures.
- Prevented mutations of malformed or ambiguous threads and tested legal state transitions.
- Extracted document operations and reference resolution into testable core modules.
- Preserved unsaved composer state across incremental Webview refreshes.
- Added source-editor gutter markers, anchor highlighting, navigation, and re-anchoring.
- Split the Explorer thread list from a focused conversation panel.

## Rejected acceptance outcome

- The Explorer remained a card-heavy interaction surface rather than compact navigation.
- The focused panel was effectively a larger copy of one card, with raw IDs, role codes, timestamps, and generic controls.
- Rendered document content and conversation were not part of one surface.
- Focusing the panel could make the Explorer claim no Markdown file was open.
- The result exposed technical capability but did not deliver the expected Quip/SharePoint-like experience.

## Validation at supersession

- TypeScript build passed.
- Nineteen core regression tests passed.
- Human UX acceptance failed.
