<p align="right">
  <a href="https://simpliq.io"><img src="imgs/simpliq-icon-128.png" alt="Simpliq" width="64"></a>
</p>

# Markdown Collab

LLMs can be very useful when a technical document needs turning from rough notes into something other people can follow. They can draft a section, work through an argument or find a clearer explanation. Reviewing the result is where things get clumsy.

You spot a weak claim in one paragraph, a missing example in another and a section near the end that changes something near the start. In chat, those become a pile of quoted text and directions about where each change belongs. Separate discussions get mixed together, and you have to keep rebuilding the context.

Markdown Collab lets you have those conversations in the document instead. It is a VS Code-compatible extension that adds Quip/SharePoint-style threaded comments to Markdown.

Read the rendered document, open a thread beside any passage and leave comments as they occur to you. Some can stay as drafts. Others can be submitted and left waiting while you carry on. Each conversation keeps its place and history.

When you are ready for the LLM to respond, Markdown Collab copies a short prompt for your existing Codex, Claude or other agent chat. The agent reads all ready comments together, makes related edits in one turn and replies in the relevant threads.

Everything remains in Markdown. Threads are stored as hidden HTML comments in the file, so they travel with it through git. There is no hosted collaboration service or separate thread database, and Markdown Collab never sends a prompt or connects to a model - you just prompt your agent to review your latest comments in the regular chat window.

Built by [Simpliq](https://simpliq.io).

[See the review flow](#a-typical-review-pass) | [Privacy and trust](#privacy-and-trust)

![Markdown Collab showing a rendered document, anchored thread markers, and a contextual conversation rail](imgs/markdown-collab-review.png)

## [Latest release](https://github.com/simpliq-dev/markdown-collab/releases/latest)

[Download the latest VSIX and `.tar.gz` release kit from GitHub Releases.](https://github.com/simpliq-dev/markdown-collab/releases/latest) The release kit also contains the portable agent skill and a checksum.

## Work through the document together

- Discuss the exact passage that needs attention instead of describing its location in chat.
- Keep several lines of thought open at once without losing the draft or history in any thread.
- Submit a group of ready comments in one turn, giving the LLM the context to make related edits together.
- Bring responses back into the relevant threads so the reasoning stays attached to the document.
- Carry the document and its review history together as one portable, version-controllable Markdown file.
- Stay in control of what is ready, what is sent, and when a conversation is resolved or removed.

## Quick start

1. Download the latest `.vsix` and agent skill, or the complete release kit, from [GitHub Releases](https://github.com/simpliq-dev/markdown-collab/releases/latest).
2. In VS Code or Cursor, run **Extensions: Install from VSIX...** and select the file.
3. Copy the supplied `markdown-collab` skill folder into the project skill directory used by your agent.
4. Open a `.md` file and run **Markdown Collab: Open Collaborative Review** from the Command Palette, editor title icon, or editor context menu.
5. Hover a rendered block and choose **Start conversation**.

## A typical review pass

1. Start conversations beside each part of the document that needs attention.
2. Move between them freely. Each thread keeps its own unfinished text.
3. Save comments as drafts while they are still taking shape. Submit only the turns that are ready for action.
4. When several comments are waiting, choose **Copy prompt** beside **N comments ready**.
5. Paste that prompt into your existing Codex, Claude, or other agent conversation and send it once.
6. The copied prompt invokes the `markdown-collab` skill. The agent can then read the ready comments together, edit the document where appropriate, append responses to the handled threads, and verify that no conversation was lost.

Nothing is sent automatically, and Markdown Collab does not call a model. You decide what is ready and when the agent sees it.

## Install the agent skill

The release kit includes one portable [`markdown-collab` Agent Skill](skills/markdown-collab/SKILL.md). Copy the complete folder unchanged into the project skill directory used by your agent:

- Codex or Cursor: `.agents/skills/markdown-collab/`
- Claude Code: `.claude/skills/markdown-collab/`
- Other Agent Skills clients: use the project skill directory documented by that client.

The skill follows the open [Agent Skills](https://agentskills.io) format and does not contain model- or vendor-specific instructions. Existing `AGENTS.md`, `CLAUDE.md`, rules, and other skills remain untouched.

See [Install the Markdown Collab skill](docs/install-agent-skill.md) for details. The file format itself is documented in [`COLLAB-RULES.md`](rules/COLLAB-RULES.md).

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
