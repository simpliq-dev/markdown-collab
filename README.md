<p align="right">
  <a href="https://simpliq.io"><img src="imgs/simpliq-icon-128.png" alt="Simpliq" width="64"></a>
</p>

# Markdown Collab

The usual setup for writing a technical document with an LLM is a Markdown file open in VS Code and a chat beside it. You ask for a section, make a few changes, and carry on.

It gets harder as the document grows. You might be tightening one paragraph, questioning an assumption somewhere else, and leaving another point for later. Chat gives those discussions nowhere to live. Before long you are referring to “the paragraph under…” or pasting parts of the document back into the prompt.

Markdown Collab is a VS Code-compatible extension that adds threaded conversations to the Markdown file, a bit like comments in Quip or SharePoint. Each thread sits beside the passage it belongs to, and several discussions can stay open at once.

When comments are ready, Markdown Collab gives you one short prompt to paste into your existing Codex, Claude, or other agent chat. With the supplied project guidance, the agent can handle them together, edit the document, and reply in the relevant threads.

The file remains Markdown. Conversations are stored inside it as hidden HTML comments. There is no hosted discussion service or separate thread database, and Markdown Collab never sends a prompt or connects to a model.

Built by [Simpliq](https://simpliq.io).

[See the review flow](#a-typical-review-pass) | [Privacy and trust](#privacy-and-trust)

![Markdown Collab showing a rendered document, anchored thread markers, and a contextual conversation rail](imgs/markdown-collab-review.png)

## [Latest release](https://github.com/simpliq-dev/markdown-collab/releases/latest)

[Download the latest VSIX and `.tar.gz` release kit from GitHub Releases.](https://github.com/simpliq-dev/markdown-collab/releases/latest) The release kit also contains the agent guidance and a checksum.

## Work through the document together

- Discuss the exact passage that needs attention instead of describing its location in chat.
- Keep several lines of thought open at once without losing the draft or history in any thread.
- Submit a group of ready comments in one turn, giving the LLM the context to make related edits together.
- Bring responses back into the relevant threads so the reasoning stays attached to the document.
- Carry the document and its review history together as one portable, version-controllable Markdown file.
- Stay in control of what is ready, what is sent, and when a conversation is resolved or removed.

## Quick start

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/simpliq-dev/markdown-collab/releases/latest).
2. In VS Code or Cursor, run **Extensions: Install from VSIX...** and select the file.
3. Copy the supplied `AGENTS.md` or `CLAUDE.md` into the root of the project containing your Markdown files. If one already exists, merge in the Markdown Collab section.
4. Open a `.md` file and run **Markdown Collab: Open Collaborative Review** from the Command Palette, editor title icon, or editor context menu.
5. Hover a rendered block and choose **Start conversation**.

## A typical review pass

1. Start conversations beside each part of the document that needs attention.
2. Move between them freely. Each thread keeps its own unfinished text.
3. Save comments as drafts while they are still taking shape. Submit only the turns that are ready for action.
4. When several comments are waiting, choose **Copy prompt** beside **N comments ready**.
5. Paste that prompt into your existing Codex, Claude, or other agent conversation and send it once.
6. With the supplied project guidance, the agent can read the ready comments together, edit the document where appropriate, and append responses to the handled threads.

Nothing is sent automatically, and Markdown Collab does not call a model. You decide what is ready and when the agent sees it.

## Give your agent the project guidance

The release kit includes two standalone guidance files:

- [`AGENTS.md`](agent-guidance/AGENTS.md) for Codex and other AGENTS.md-aware agents
- [`CLAUDE.md`](agent-guidance/CLAUDE.md) for Claude

Copy the appropriate file into the project you want to review. If that project already has an agent-instruction file, merge the Markdown Collab section into it rather than replacing the existing instructions.

See [Install agent guidance](docs/install-agent-rules.md) for details. The file format itself is documented in [`COLLAB-RULES.md`](rules/COLLAB-RULES.md).

## The document remains the source of truth

Submitted conversations are stored as HTML comments. Normal Markdown renderers hide them, while the source remains readable and version-controllable:

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

Collaborative Review is an opt-in view over the same file. The normal Markdown source editor remains available at any time.

## Current boundaries

Markdown Collab is currently an early, GitHub-distributed extension. VS Code is the only editor tested locally. Cursor can install the same VSIX through its VS Code-compatible extension APIs, but has not been tested locally.

- The extension does not inject text into an agent chat; copying and sending the handoff remains explicit.
- It is not yet distributed through the VS Code Marketplace.
- The published extension ID remains `simpliq.codex-collab` so existing installations can update without changing identity.

Issues and focused feedback are welcome through the repository's [issue tracker](https://github.com/simpliq-dev/markdown-collab/issues).

## Privacy and trust

Markdown Collab does not contact an external service, send telemetry, invoke a model, or maintain a separate conversation database.

Workspace content is treated as untrusted: raw HTML is disabled in the review renderer, remote images are not loaded automatically, external links require a click, and the Webview uses a restrictive content security policy. See [`PRIVACY.md`](PRIVACY.md).

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

## About Simpliq

[Simpliq](https://simpliq.io) builds practical tools and workflows that make complex knowledge work simpler.

## License

[MIT](LICENSE)
