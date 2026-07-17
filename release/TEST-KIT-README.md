# Markdown Collab {{VERSION}} release kit

This folder contains everything needed to install and use Markdown Collab on another machine without installing an unknown third-party service.

## Contents

- `{{VSIX_NAME}}` — the VS Code-compatible extension package.
- `skills/markdown-collab/` — one portable Agent Skill for Codex, Cursor, Claude Code, and other Agent Skills clients.
- `SHA256SUMS.txt` — checksum for verifying the VSIX after transfer.

The extension's published technical ID remains `simpliq.codex-collab` for update compatibility; the user-facing product is Markdown Collab.

## Install the extension

### VS Code

1. Open the Command Palette.
2. Run **Extensions: Install from VSIX...**.
3. Select `{{VSIX_NAME}}`.
4. Reload VS Code when prompted.

### Cursor

Use the same **Extensions: Install from VSIX...** command. Cursor compatibility is expected because Markdown Collab uses stable VS Code extension APIs, but this build has not yet been exercised in Cursor.

## Install the agent skill

Copy the complete `skills/markdown-collab` folder, without editing its contents, into the project skill directory used by your agent:

- Codex or Cursor: `.agents/skills/markdown-collab/`
- Claude Code: `.claude/skills/markdown-collab/`
- Other Agent Skills clients: the project skill directory documented by that client.

Leave any existing `AGENTS.md`, `CLAUDE.md`, rules, and other skills unchanged. Open a new agent conversation after installing if the client does not refresh its skill list immediately.

## Try the workflow

1. Open a `.md` file.
2. Run **Markdown Collab: Open Collaborative Review**.
3. Start or open several anchored conversations.
4. Save drafts or submit comments independently.
5. Confirm that deleting one conversation and deleting all conversations each require a separate warning confirmation; cancel the warning to preserve the document.
6. Choose **Copy prompt** beside **N comments ready**.
7. Paste the copied sentence into the existing agent conversation and send it once.
8. Confirm the copied prompt explicitly invokes the `markdown-collab` skill.
9. Confirm the agent processes all ready comments together, appends one response to each handled thread, and preserves every existing conversation unless you explicitly request deletion.

## Verify the package

Expected SHA-256 for `{{VSIX_NAME}}`:

```text
{{SHA256}}
```

On PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 .\{{VSIX_NAME}}
```

## Remove the release

Open Extensions, find **Markdown Collab**, and choose **Uninstall**. All conversations remain in the Markdown files as HTML comments. Remove the installed `markdown-collab` skill folder separately if it is no longer needed.
