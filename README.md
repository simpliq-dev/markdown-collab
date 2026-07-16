# markdown-collab

Document-first threaded conversations stored inside Markdown.

Markdown Collab adds an opt-in **Collaborative Review** editor to VS Code-compatible editors. It renders the Markdown as a readable document, places conversation markers beside anchored content, and keeps complete multi-turn discussions in a contextual rail. The prose and submitted conversation state remain in one portable `.md` file.

## Why it exists

Long-form human-agent work rarely fits a single serial prompt. Markdown Collab lets you keep several discussions active around one document, revisit unfinished prompts, and decide exactly when each turn becomes actionable to the agent.

- No hosted conversation service or separate thread database
- No LLM API calls from the extension
- No WYSIWYG conversion or proprietary document format
- No implicit submission when you switch focus

## Development experience

The current repository build is undergoing a substantial Collaborative Review redesign. The existing parser and file format remain backward compatible; the new review surface has not yet been released to the Marketplace.

1. Open a Markdown file in a VS Code-compatible editor.
2. Use the comment-discussion icon in the editor title, right-click and choose **Markdown Collab: Open Collaborative Review**, or run that command from the Command Palette.
3. Hover a rendered block and use **+** to start a conversation.
4. Move between thread markers or **All conversations**. Each thread retains its own unfinished composer.
5. Use **Save draft** to persist a non-actionable `D` turn in the Markdown file, or **Submit turn** / `Ctrl+Enter` to create an actionable human `H` turn.
6. The top bar counts submitted comments as **N comments ready**. Choose **Copy prompt**, paste the short handoff into your existing agent conversation, and send once so the comments are handled together.
7. Use **Open source** whenever you want the native Markdown editor beside the review surface.

When the latest submitted turn is human-authored, that conversation shows **Waiting** until an agent appends an `A` response to the file. Other threads remain independently editable.

## Thread format

Threads are HTML comments, so normal rendered Markdown hides the storage layer:

```md
<!-- CMT:THREAD id=ABCDE status=open ref=prev=1 -->
<!-- CMT:MSG id=ABCDE role=H ts=2026-01-18T12:00:00.000Z
Please pressure-test this claim.
-->
<!-- CMT:MSG id=ABCDE role=A ts=2026-01-18T12:01:00.000Z
The claim needs a narrower scope and a supporting source.
-->
<!-- /CMT:THREAD id=ABCDE -->
```

- `status` is `open|closed` and remains human-controlled.
- `role=D` is a saved draft, `role=H` is a submitted human turn, and `role=A` is an agent response.
- Waiting is inferred when the last message is `H`.
- `ref=prev=N` anchors a thread to preceding Markdown blocks; `ref=file` targets the whole document.
- Comment delimiters in message bodies are escaped to protect the file grammar.

## Use with an agent

The extension is agent-neutral. Any agent that can read and edit files can respond by appending one valid `role=A` message to each open thread whose latest message is `role=H`. **Copy prompt** does not start another chat or call an API; it prepares a short message for the agent conversation you already have open. Repository guidance tells compatible agents to read all ready comments together before editing.

Copy one standalone guidance file into the root of the Markdown project you want an agent to review:

- [AGENTS.md](agent-guidance/AGENTS.md) for AGENTS.md-aware agents such as Codex
- [CLAUDE.md](agent-guidance/CLAUDE.md) for Claude

See [Install agent guidance](docs/install-agent-rules.md) for copy instructions. The detailed grammar remains in [COLLAB-RULES.md](rules/COLLAB-RULES.md).

## Develop locally

Prerequisites: VS Code, Node.js, and npm.

```sh
npm install
npm test
```

Open the repository itself in the VS Code desktop application, then press `F5`. VS Code launches a separate window titled **Extension Development Host** with the development build loaded. In that new window, open `tests/review_showcase.md` and run **Markdown Collab: Open Collaborative Review** from the Command Palette or the comment-discussion icon in the editor title.

Additional commands:

```sh
npm run build
npm run watch
npm run package
```

The repository uses `.npmrc` with `bin-links=false` so dependency installation also works on SMB shares that do not support symlinks.

## Privacy and security

Markdown Collab does not send telemetry or contact an external service. Collaborative Review treats workspace text as untrusted: raw HTML is not rendered, remote images are not loaded automatically, external links require an explicit click, and the Webview uses a restrictive content security policy. See [PRIVACY.md](PRIVACY.md).

## Project state

- [Current intent and experience contract](docs/PROJECT.md)
- [Consequential decisions](docs/DECISIONS.md)
- [Active reset plan](docs/plans/active/collaborative-review-reset.md)
- [Archived design material](docs/archive/README.md)

Core parsing, serialization, mutations, and anchor resolution live in `src/core/`. The custom editor host and review model live in `src/review/`; packaged Webview assets live in `media/`.
