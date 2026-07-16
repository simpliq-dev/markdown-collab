# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Replaced the Explorer card list and separate conversation panel with an opt-in Collaborative Review custom editor.
- Rendered Markdown and contextual thread markers as one document surface, with a focused conversation rail and all-thread activity view.
- Preserved independent composer state across multiple conversations and kept draft/save distinct from explicit submission.
- Added a ready-comment count and one-click prompt copy for processing several submitted comments in one continuous external agent conversation.
- Added repository guidance for AGENTS.md-aware and Claude agents to respond safely to ready comments.

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
