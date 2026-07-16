<p align="right">
  <a href="https://simpliq.io"><img src="imgs/simpliq-icon-128.png" alt="Simpliq" width="64"></a>
</p>

# Markdown Collab

Threaded conversations for Markdown files, kept in the file itself.

When a document needs serious review, a single agent chat gets awkward. You lose where a question came from, comments compete for attention, and submitting one point can interrupt another. Markdown Collab lets you start several conversations beside the text they refer to, keep a separate draft in each one, and send a group of ready comments to your existing agent chat in one turn.

It is built for people who want the convenience of Quip- or SharePoint-style discussions without putting their Markdown in a hosted discussion system. The document stays portable, inspectable, and under your control.

Built by [Simpliq](https://simpliq.io).

[![Latest release](https://img.shields.io/github/v/release/simpliq-dev/markdown-collab?label=latest%20release)](https://github.com/simpliq-dev/markdown-collab/releases/latest)

**[Download the latest release](https://github.com/simpliq-dev/markdown-collab/releases/latest)** · [A typical review pass](#a-typical-review-pass) · [Privacy and trust](#privacy-and-trust)

![Markdown Collab showing a rendered document, anchored thread markers, and a contextual conversation rail](imgs/markdown-collab-review.png)

## Latest release

[Download the latest VSIX and `.tar.gz` release kit from GitHub Releases.](https://github.com/simpliq-dev/markdown-collab/releases/latest)

## What you can do with it

- Rendered Markdown with comments anchored beside the relevant text
- Full multi-turn human/agent conversations, not disposable notes
- Independent unsaved composers and file-backed drafts for every thread
- Explicit **Submit turn** action—changing focus never submits
- **N comments ready** status and one-click handoff prompt copying
- Resolve, reopen, re-anchor, delete one conversation, or delete all with confirmation
- No hosted service, account, thread database, telemetry, or model API
- Agent-neutral workflow for Codex, Claude, and other file-editing agents

## Quick start

1. Download the newest VSIX or complete `.tar.gz` release kit from [Releases](https://github.com/simpliq-dev/markdown-collab/releases).
2. In VS Code or Cursor, run **Extensions: Install from VSIX...** and choose the downloaded `.vsix`.
3. Copy the supplied `AGENTS.md` or `CLAUDE.md` into the root of the project containing your Markdown files. If one already exists, merge in the Markdown Collab section.
4. Open a `.md` file and run **Markdown Collab: Open Collaborative Review** from the Command Palette, editor title icon, or editor context menu.
5. Hover a rendered block and choose **Start conversation**.

## A typical review pass

1. Open a Markdown file and start Collaborative Review.
2. Select a block and start a conversation. The thread stays beside the text it refers to.
3. Open another conversation when a different point needs attention. Each thread keeps its own unfinished draft.
4. Save a draft if you are still thinking. Choose **Submit turn** (`Ctrl+Enter`) when the comment is ready for the agent.
5. When several comments are ready, choose **Copy prompt** beside **N comments ready**.
6. Paste the short prompt into your existing agent conversation and send it once. The agent can then work through the ready comments with the document's instructions and context.

Nothing is sent automatically, and Markdown Collab does not call a model. You choose which comments to submit and when to hand them to the agent.

## Give your agent the project guidance

The release kit includes standalone guidance files:

- [`AGENTS.md`](agent-guidance/AGENTS.md) for Codex and other AGENTS.md-aware agents
- [`CLAUDE.md`](agent-guidance/CLAUDE.md) for Claude

See [Install agent guidance](docs/install-agent-rules.md) for merge instructions. The complete portable grammar is documented in [`COLLAB-RULES.md`](rules/COLLAB-RULES.md).

## The document remains the source of truth

Submitted discussion is stored as HTML comments, so normal Markdown renderers hide it while the source remains readable and version-controllable:

```md
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
<!-- CMT:MSG id=ABCDE role=H ts=2026-07-16T12:00:00.000Z
Please pressure-test this claim.
-->
<!-- CMT:MSG id=ABCDE role=A ts=2026-07-16T12:01:00.000Z
The claim needs a narrower scope and a supporting source.
-->
<!-- /CMT:THREAD id=ABCDE -->
```

The native Markdown source editor remains available at any time. Collaborative Review is an opt-in view over the same file, not a conversion or separate document.

## What it does not do

- It does not host your conversations or create a separate thread database.
- It does not replace the normal Markdown source editor.
- It does not inject text into Codex or Cursor chat; you copy the handoff prompt and send it yourself.
- It does not promise Cursor support that has not been tested locally.

## Compatibility

- **VS Code:** current test target; packaged VSIX installation is validated.
- **Cursor:** designed around stable VS Code extension APIs and installable from VSIX, but not yet exercised locally by the maintainers.
- **Agents:** works with Codex, Claude, or another agent that can follow repository instructions and edit files.

The published technical extension ID remains `simpliq.codex-collab` for update compatibility; the product name is Markdown Collab.

## Privacy and trust

Markdown Collab does not contact an external service, send telemetry, invoke a model, or maintain a separate conversation database. Workspace content is treated as untrusted: raw HTML is disabled in the review renderer, remote images are not loaded automatically, external links require a click, and the Webview uses a restrictive content security policy. See [`PRIVACY.md`](PRIVACY.md).

## Develop locally

Prerequisites: VS Code, Node.js, and npm.

```sh
npm install
npm test
```

Open this repository in VS Code and press `F5` to launch an **Extension Development Host**. In that new window, open `tests/review_showcase.md` and run **Markdown Collab: Open Collaborative Review**.

Useful commands:

```sh
npm run build      # compile TypeScript
npm run test       # build and run regression tests
npm run package    # create a VSIX
npm run test-kit   # create the portable release folder
```

Tagged builds run the test suite and publish a VSIX plus a complete `.tar.gz` release kit through [GitHub Releases](https://github.com/simpliq-dev/markdown-collab/releases). Maintainer details are in [`docs/publish.md`](docs/publish.md).

## Project status

Markdown Collab is still early and is distributed directly through GitHub rather than the VS Code Marketplace. VS Code is the editor we validate locally. Cursor should work through the same extension APIs, but we have not tested it locally yet. Issues and focused feedback can be shared through the repository's [issue tracker](https://github.com/simpliq-dev/markdown-collab/issues).

## About Simpliq

[Simpliq](https://simpliq.io) builds practical tools and workflows that make complex knowledge work simpler.

## License

[MIT](LICENSE)
