import * as vscode from "vscode";
import {
  createThread,
  MutationResult,
  reanchorThread,
  saveDraft,
  submitHumanMessage,
  toggleStatus,
} from "../core/mutations";
import { buildReviewModel, ReviewModel } from "./model";

type ReviewMessage = {
  type?: unknown;
  requestId?: unknown;
  documentVersion?: unknown;
  threadId?: unknown;
  blockId?: unknown;
  body?: unknown;
  url?: unknown;
};

const THREAD_ID_RE = /^[0-9A-HJKMNP-TV-Z]{5}$/;

export class ReviewEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = "codexCollab.reviewEditor";

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ReviewEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      ReviewEditorProvider.viewType,
      provider,
      {
        supportsMultipleEditorsPerDocument: true,
        webviewOptions: { retainContextWhenHidden: true },
      }
    );
  }

  private constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, "media");
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaRoot],
    };
    panel.webview.html = this.renderShell(panel.webview);

    let ready = false;
    let disposed = false;

    const sendModel = async (): Promise<void> => {
      if (!ready || disposed) {
        return;
      }
      await panel.webview.postMessage({
        type: "reviewModel",
        model: this.modelFor(document),
      });
    };

    const documentChange = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === document.uri.toString()) {
        void sendModel().catch(() => undefined);
      }
    });

    const messageSubscription = panel.webview.onDidReceiveMessage(
      async (raw: ReviewMessage) => {
        const requestId =
          typeof raw?.requestId === "string" ? raw.requestId : undefined;
        try {
          const type = typeof raw?.type === "string" ? raw.type : "";
          if (type === "webviewReady") {
            ready = true;
            await sendModel();
            return;
          }
          if (type === "openSource") {
            await vscode.window.showTextDocument(document, {
              viewColumn: vscode.ViewColumn.Beside,
              preserveFocus: false,
              preview: false,
            });
            return;
          }
          if (type === "openExternal") {
            await this.openExternal(raw.url);
            return;
          }

          if (!this.isCurrentVersion(raw.documentVersion, document)) {
            await panel.webview.postMessage({
              type: "mutationResult",
              requestId,
              ok: false,
              message:
                "The Markdown changed before this action completed. Review the refreshed conversation and try again.",
            });
            await sendModel();
            return;
          }

          const result = this.createMutation(type, raw, document);
          if (!result) {
            await panel.webview.postMessage({
              type: "mutationResult",
              requestId,
              ok: false,
              message:
                "That review action was not recognized or contained invalid data.",
            });
            return;
          }

          if (!result.ok) {
            await panel.webview.postMessage({
              type: "mutationResult",
              requestId,
              ok: false,
              message: result.message,
            });
            return;
          }

          const outcome = await applyMutation(document, result);
          const persisted = outcome.applied && outcome.saved;
          await panel.webview.postMessage({
            type: "mutationResult",
            requestId,
            ok: persisted,
            action: type,
            threadId: result.threadId ?? raw.threadId,
            message: persisted
              ? undefined
              : outcome.applied
                ? "The conversation changed in the editor but VS Code could not save the Markdown file. Save the file manually before an agent reads it."
                : "VS Code could not apply the Markdown edit. The document may have changed; no conversation state was submitted.",
          });
          if (!persisted) {
            await sendModel();
          }
        } catch {
          if (!disposed) {
            await panel.webview.postMessage({
              type: "mutationResult",
              requestId,
              ok: false,
              message:
                "Collaborative Review could not complete that action. No turn was intentionally submitted; refresh the document and try again.",
            });
          }
        }
      }
    );

    panel.onDidDispose(() => {
      disposed = true;
      documentChange.dispose();
      messageSubscription.dispose();
    });
  }

  private modelFor(document: vscode.TextDocument): ReviewModel {
    return buildReviewModel(
      document.getText(),
      vscode.workspace.asRelativePath(document.uri, false),
      document.version
    );
  }

  private createMutation(
    type: string,
    message: ReviewMessage,
    document: vscode.TextDocument
  ): MutationResult | null {
    const text = document.getText();
    const options = { newline: detectNewline(text) } as const;

    if (type === "createThread" && typeof message.blockId === "string") {
      const model = this.modelFor(document);
      const block = model.blocks.find((item) => item.id === message.blockId);
      return block ? createThread(text, block.range.start, options) : null;
    }

    const threadId =
      typeof message.threadId === "string" &&
      THREAD_ID_RE.test(message.threadId)
        ? message.threadId
        : undefined;
    if (!threadId) {
      return null;
    }

    if (type === "saveDraft" && typeof message.body === "string") {
      return saveDraft(text, threadId, message.body, options);
    }
    if (type === "submit" && typeof message.body === "string") {
      return submitHumanMessage(text, threadId, message.body, options);
    }
    if (type === "toggleStatus") {
      return toggleStatus(text, threadId, options);
    }
    if (type === "reanchorThread" && typeof message.blockId === "string") {
      const model = this.modelFor(document);
      const block = model.blocks.find((item) => item.id === message.blockId);
      return block
        ? reanchorThread(text, threadId, block.range.start, options)
        : null;
    }
    return null;
  }

  private isCurrentVersion(
    candidate: unknown,
    document: vscode.TextDocument
  ): boolean {
    return typeof candidate === "number" && candidate === document.version;
  }

  private async openExternal(candidate: unknown): Promise<void> {
    if (typeof candidate !== "string") {
      return;
    }
    let uri: vscode.Uri;
    try {
      uri = vscode.Uri.parse(candidate, true);
    } catch {
      return;
    }
    if (uri.scheme !== "https" && uri.scheme !== "http") {
      return;
    }
    await vscode.env.openExternal(uri);
  }

  private renderShell(webview: vscode.Webview): string {
    const script = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "review.js")
    );
    const style = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "review.css")
    );
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${style}">
  <title>Collaborative Review</title>
</head>
<body>
  <div id="app" aria-busy="true"></div>
  <script src="${script}"></script>
</body>
</html>`;
  }
}

async function applyMutation(
  document: vscode.TextDocument,
  result: Extract<MutationResult, { ok: true }>
): Promise<{ applied: boolean; saved: boolean }> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(result.edit.range.start),
      document.positionAt(result.edit.range.end)
    ),
    result.edit.text
  );
  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    return { applied: false, saved: false };
  }
  return { applied: true, saved: await document.save() };
}

function detectNewline(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}
