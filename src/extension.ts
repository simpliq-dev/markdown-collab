import * as vscode from "vscode";
import { ReviewEditorProvider } from "./review/provider";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    ReviewEditorProvider.register(context),
    vscode.commands.registerCommand("codexCollab.openReview", async () => {
      const uri = activeMarkdownUri();
      if (!uri) {
        await vscode.window.showInformationMessage(
          "Open a Markdown file before starting Collaborative Review."
        );
        return;
      }
      await vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        ReviewEditorProvider.viewType,
        vscode.ViewColumn.Active
      );
    })
  );
}

function activeMarkdownUri(): vscode.Uri | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === "markdown") {
    return editor.document.uri;
  }
  return undefined;
}

export function deactivate(): void {}
