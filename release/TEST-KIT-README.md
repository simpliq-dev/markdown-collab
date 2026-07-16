# Markdown Collab {{VERSION}} test kit

This folder contains everything needed to test Markdown Collab on another machine without installing an unknown third-party service.

## Contents

- `{{VSIX_NAME}}` — the VS Code-compatible extension package.
- `AGENTS.md` — standalone instructions for Codex and other AGENTS.md-aware agents.
- `CLAUDE.md` — standalone instructions for Claude.
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

## Install the agent guidance

Copy one file into the root of the Markdown project you want to review:

- Use `AGENTS.md` for Codex or another AGENTS.md-aware agent.
- Use `CLAUDE.md` for Claude.

If the project already has a file with that name, merge the Markdown Collab section into it rather than replacing existing project instructions.

## Test the workflow

1. Open a `.md` file.
2. Run **Markdown Collab: Open Collaborative Review**.
3. Start or open several anchored conversations.
4. Save drafts or submit comments independently.
5. Confirm that deleting one conversation and deleting all conversations each require a separate warning confirmation; cancel the warning to preserve the document.
6. Choose **Copy prompt** beside **N comments ready**.
7. Paste the copied sentence into the existing agent conversation and send it once.
8. Confirm the agent processes all ready comments together and appends one response to each handled thread.

## Verify the package

Expected SHA-256 for `{{VSIX_NAME}}`:

```text
{{SHA256}}
```

On PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 .\{{VSIX_NAME}}
```

## Remove the test build

Open Extensions, find **Markdown Collab**, and choose **Uninstall**. All conversations remain in the Markdown files as HTML comments.
