# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.12] - 2026-07-17

### Changed

- Replaced separate `AGENTS.md` and `CLAUDE.md` setup files with one portable `markdown-collab` Agent Skill.
- Updated copied handoff prompts to invoke the skill explicitly and remind the agent that conversations may only be deleted on an explicit human request.
- Updated release kits to include the skill and tagged releases to publish a standalone skill archive.

### Fixed

- Added a required preservation check so an agent must verify that every existing thread and message survives document edits.

## [0.0.11] - 2026-07-16

### Changed

- Published the first stable direct GitHub Release with clean, non-test-only asset names.
- Added a latest-release link and badge to the repository README.
- Replaced the Explorer card list and separate conversation panel with an opt-in Collaborative Review custom editor.
- Rendered Markdown and contextual thread markers as one document surface, with a focused conversation rail and all-thread activity view.
- Preserved independent composer state across multiple conversations and kept draft/save distinct from explicit submission.
- Added a ready-comment count and one-click prompt copy for processing several submitted comments in one continuous external agent conversation.
- Added repository guidance for AGENTS.md-aware and Claude agents to respond safely to ready comments.
- Adopted **Markdown Collab** as the provider-neutral user-facing brand while retaining legacy technical IDs for compatibility.
- Replaced the mixed AGENTS addendum with standalone drop-in `AGENTS.md` and `CLAUDE.md` guidance files.
- Added per-conversation and document-wide conversation deletion, each protected by an explicit confirmation warning.
- Reworked the repository README around installation, daily use, the current review UI, privacy, and direct GitHub Release distribution.
- Changed complete release-kit archives from ZIP to `.tar.gz` while retaining a separately downloadable VSIX.
- Added standalone `AGENTS.md` and `CLAUDE.md` files as GitHub Release assets for quick agent setup.

### Security

- Added safe Markdown rendering, strict Webview resource policy, stale-document mutation guards, and review-model regression coverage.

## [0.0.1] - 2026-02-05

### Added
- Initial public scaffold: Markdown thread blocks + Threads explorer view.

## [0.0.3] - 2026-02-05

### Added
- Initial public release: Updated README.md with usage instructions.

## [0.0.8] - 2026-02-05

### Added
- Initial public release: Updated README.md with screenshot.
