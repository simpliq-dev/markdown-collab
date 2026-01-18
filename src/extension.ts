import * as vscode from "vscode";
import { parseThreads } from "./core/parser";
import { ParseError, Thread } from "./core/types";

const VIEW_ID = "codexCollab.threadsView";

type ThreadItem = {
  id: string;
  status: string;
  pending: boolean;
  ref: string;
  messageCount: number;
  lastRole?: string;
  summary?: string;
  draftBody?: string;
  range: OffsetRange;
  messages: ThreadMessageItem[];
  hasDraft: boolean;
};

type OffsetRange = {
  start: number;
  end: number;
};

type ViewModel =
  | { state: "no-document" }
  | { state: "not-markdown"; fileName: string }
  | {
      state: "ready";
      fileName: string;
      threads: ThreadItem[];
      errors: ParseError[];
      pendingReanchorId?: string;
      filter: ThreadFilter;
      expandedThreadId?: string;
      roleFilter: RoleFilter;
      selectedThreadId?: string;
      expandAll?: boolean;
    };

type ThreadFilter = "all" | "open" | "closed" | "pending";

type ThreadMessageItem = {
  role: string;
  body: string;
  ts?: string;
};

type RoleFilter = "all" | "draft" | "human" | "agent";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ThreadsViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codexCollab.refreshThreads", () => {
      provider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => provider.refresh())
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const activeDoc = vscode.window.activeTextEditor?.document;
      if (activeDoc && event.document === activeDoc) {
        provider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor.document.languageId !== "markdown") {
        return;
      }
      if (provider.hasPendingReanchor()) {
        void provider.handleReanchorSelection(
          event.textEditor,
          event.selections[0]
        );
        return;
      }
      provider.handleEditorSelection(event.textEditor, event.selections[0]);
    })
  );
}

export function deactivate(): void {
  // No-op.
}

class ThreadsViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private pendingReanchorId: string | null = null;
  private filter: ThreadFilter = "all";
  private expandedThreadId: string | null = null;
  private roleFilter: RoleFilter = "all";
  private selectedThreadId: string | null = null;
  private expandAll = false;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    view.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === "saveDraft") {
        await saveDraftMessage(message.threadId, message.body);
        this.render();
        return;
      }
      if (message?.type === "submitDraft") {
        await submitDraftMessage(message.threadId, message.body);
        this.render();
        return;
      }
      if (message?.type === "toggleStatus") {
        await toggleThreadStatus(message.threadId);
        this.render();
        return;
      }
      if (message?.type === "beginReanchor") {
        this.pendingReanchorId = message.threadId ?? null;
        if (this.pendingReanchorId) {
          vscode.window.showInformationMessage(
            `Re-anchor ${this.pendingReanchorId}: click the target paragraph in the editor.`
          );
        }
        this.render();
        return;
      }
      if (message?.type === "cancelReanchor") {
        this.pendingReanchorId = null;
        this.render();
        return;
      }
      if (message?.type === "jumpToThread") {
        await jumpToThread(message.threadId);
        return;
      }
      if (message?.type === "setFilter") {
        this.filter = message.filter ?? "all";
        this.render();
        return;
      }
      if (message?.type === "setRoleFilter") {
        this.roleFilter = message.filter ?? "all";
        this.render();
        return;
      }
      if (message?.type === "expandAll") {
        this.expandAll = true;
        this.render();
        return;
      }
      if (message?.type === "collapseAll") {
        this.expandAll = false;
        this.expandedThreadId = null;
        this.render();
        return;
      }
      if (message?.type === "createThread") {
        const id = await createThreadAtCursor();
        if (id) {
          this.expandedThreadId = id;
        }
        this.render();
        return;
      }
      if (message?.type === "toggleThread") {
        if (this.expandAll) {
          this.expandAll = false;
          this.expandedThreadId = message.threadId ?? null;
        } else {
          this.expandedThreadId =
            this.expandedThreadId === message.threadId
              ? null
              : message.threadId ?? null;
        }
        this.render();
        return;
      }
    });
    this.render();
  }

  refresh(): void {
    this.render();
  }

  hasPendingReanchor(): boolean {
    return !!this.pendingReanchorId;
  }

  async handleReanchorSelection(
    editor: vscode.TextEditor,
    selection: vscode.Selection
  ): Promise<void> {
    if (!this.pendingReanchorId) {
      return;
    }
    const targetId = this.pendingReanchorId;
    this.pendingReanchorId = null;
    await reanchorThread(editor.document, selection.active, targetId);
    this.render();
  }

  handleEditorSelection(
    editor: vscode.TextEditor,
    selection: vscode.Selection
  ): void {
    const document = editor.document;
    if (document.languageId !== "markdown") {
      return;
    }
    const result = parseThreads(document.getText());
    const offset = document.offsetAt(selection.active);
    const thread = result.threads.find(
      (item) => offset >= item.range.start && offset <= item.range.end
    );
    const nextSelectedId = thread?.id ?? null;
    if (nextSelectedId === this.selectedThreadId) {
      return;
    }
    this.selectedThreadId = nextSelectedId;
    if (nextSelectedId && !this.expandAll) {
      this.expandedThreadId = nextSelectedId;
    }
    this.render();
  }

  private render(): void {
    if (!this.view) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const model = buildViewModel(
      editor?.document,
      this.pendingReanchorId,
      this.filter,
      this.expandedThreadId,
      this.roleFilter,
      this.selectedThreadId,
      this.expandAll
    );
    this.view.webview.html = renderHtml(model);
  }
}

function buildViewModel(
  document?: vscode.TextDocument,
  pendingReanchorId?: string | null,
  filter: ThreadFilter = "all",
  expandedThreadId?: string | null,
  roleFilter: RoleFilter = "all",
  selectedThreadId?: string | null,
  expandAll?: boolean
): ViewModel {
  if (!document) {
    return { state: "no-document" };
  }

  const fileName = document.fileName;
  if (document.languageId !== "markdown") {
    return { state: "not-markdown", fileName };
  }

  const result = parseThreads(document.getText());
  const items = result.threads.map(mapThread);

  return {
    state: "ready",
    fileName,
    threads: applyFilter(items, filter, roleFilter),
    errors: result.errors,
    pendingReanchorId: pendingReanchorId ?? undefined,
    filter,
    expandedThreadId: expandedThreadId ?? undefined,
    roleFilter,
    selectedThreadId: selectedThreadId ?? undefined,
    expandAll: expandAll ?? false,
  };
}

function mapThread(thread: Thread): ThreadItem {
  const lastMessage = thread.messages[thread.messages.length - 1];
  const firstMessage = thread.messages[0];
  const messages = thread.messages.map((message) => ({
    role: message.role,
    body: message.body,
    ts: message.ts,
  }));
  const hasDraft = thread.messages.some((message) => message.role === "D");
  return {
    id: thread.id,
    status: thread.status,
    pending: thread.pending,
    ref: formatRef(thread.ref),
    messageCount: thread.messages.length,
    lastRole: lastMessage?.role,
    summary: firstMessage ? snippet(firstMessage.body) : undefined,
    draftBody: lastMessage?.role === "D" ? lastMessage.body : undefined,
    range: thread.range,
    messages,
    hasDraft,
  };
}

function formatRef(ref: Thread["ref"]): string {
  if (ref.type === "file") {
    return "file";
  }
  return `prev=${ref.count}`;
}

function snippet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 140);
}

function applyFilter(
  threads: ThreadItem[],
  filter: ThreadFilter,
  roleFilter: RoleFilter
): ThreadItem[] {
  const statusFiltered = (() => {
    switch (filter) {
      case "open":
        return threads.filter((thread) => thread.status === "open");
      case "closed":
        return threads.filter((thread) => thread.status === "closed");
      case "pending":
        return threads.filter((thread) => thread.pending);
      default:
        return threads;
    }
  })();

  switch (roleFilter) {
    case "draft":
      return statusFiltered.filter((thread) => thread.lastRole === "D");
    case "human":
      return statusFiltered.filter((thread) => thread.lastRole === "H");
    case "agent":
      return statusFiltered.filter((thread) => thread.lastRole === "A");
    default:
      return statusFiltered;
  }
}

function renderHtml(model: ViewModel): string {
  const nonce = createNonce();
  const body = renderBody(model);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      font-family: var(--vscode-font-family);
      font-size: 12px;
      color: var(--vscode-foreground);
      margin: 0;
      padding: 12px;
    }
    .title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .muted {
      color: var(--vscode-descriptionForeground);
    }
    .thread {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 8px;
      background: var(--vscode-editor-background);
    }
    .thread.pending {
      border-left: 3px solid var(--vscode-charts-orange, #c68400);
    }
    .thread.closed {
      opacity: 0.7;
    }
    .thread.selected {
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid var(--vscode-panel-border);
    }
    .id {
      font-weight: 600;
    }
    .snippet {
      margin-top: 6px;
      color: var(--vscode-descriptionForeground);
    }
    .draft {
      margin-top: 8px;
    }
    textarea {
      width: 100%;
      min-height: 80px;
      resize: vertical;
      padding: 6px;
      border-radius: 4px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      box-sizing: border-box;
    }
    button {
      margin-top: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--vscode-button-border, transparent);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .link {
      margin-top: 0;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--vscode-textLink-foreground);
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
    }
    .link:hover {
      color: var(--vscode-textLink-activeForeground);
      background: transparent;
    }
    .errors {
      border: 1px dashed var(--vscode-errorForeground);
      padding: 8px;
      margin-top: 12px;
    }
    .banner {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 8px;
      background: var(--vscode-editor-background);
    }
    .banner .row {
      margin-bottom: 0;
    }
    .filter-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    .filter {
      margin-top: 0;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      font-size: 11px;
      cursor: pointer;
    }
    .filter:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .filter.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .history {
      display: flex;
      flex-direction: column;
      margin-top: 8px;
      border-top: 1px dashed var(--vscode-panel-border);
      padding-top: 8px;
    }
    .message {
      max-width: 92%;
      margin-bottom: 8px;
      padding: 6px;
      border-radius: 6px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }
    .message.human,
    .message.draft {
      margin-left: auto;
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
    }
    .message.draft {
      border-style: dashed;
    }
    .message .meta {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
    }
    .message .body {
      white-space: pre-wrap;
    }
    .message.draft .body {
      font-style: italic;
    }
    .composer {
      margin-top: 8px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }
    .composer-actions {
      display: flex;
      gap: 6px;
    }
    .empty {
      padding: 12px;
      border: 1px dashed var(--vscode-panel-border);
      border-radius: 6px;
      text-align: center;
    }
  </style>
</head>
<body>
  ${body}
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('button[data-action=\"save-draft\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        const textarea = document.querySelector('textarea[data-thread-id=\"' + threadId + '\"]');
        const body = textarea ? textarea.value : '';
        vscode.postMessage({ type: 'saveDraft', threadId, body });
      });
    });
    document.querySelectorAll('button[data-action=\"submit-draft\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        const textarea = document.querySelector('textarea[data-thread-id=\"' + threadId + '\"]');
        const body = textarea ? textarea.value : '';
        vscode.postMessage({ type: 'submitDraft', threadId, body });
        if (textarea) {
          textarea.value = '';
          textarea.dispatchEvent(new Event('input'));
        }
      });
    });
    document.querySelectorAll('button[data-action=\"toggle-status\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        vscode.postMessage({ type: 'toggleStatus', threadId });
      });
    });
    document.querySelectorAll('button[data-action=\"begin-reanchor\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        vscode.postMessage({ type: 'beginReanchor', threadId });
      });
    });
    document.querySelectorAll('button[data-action=\"cancel-reanchor\"]').forEach((button) => {
      button.addEventListener('click', () => {
        vscode.postMessage({ type: 'cancelReanchor' });
      });
    });
    document.querySelectorAll('[data-action=\"jump-to-thread\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        vscode.postMessage({ type: 'jumpToThread', threadId });
      });
    });
    document.querySelectorAll('button[data-action=\"set-filter\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter') || 'all';
        vscode.postMessage({ type: 'setFilter', filter });
      });
    });
    document.querySelectorAll('button[data-action=\"set-role-filter\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter') || 'all';
        vscode.postMessage({ type: 'setRoleFilter', filter });
      });
    });
    document.querySelectorAll('button[data-action=\"create-thread\"]').forEach((button) => {
      button.addEventListener('click', () => {
        vscode.postMessage({ type: 'createThread' });
      });
    });
    document.querySelectorAll('button[data-action=\"expand-all\"]').forEach((button) => {
      button.addEventListener('click', () => {
        vscode.postMessage({ type: 'expandAll' });
      });
    });
    document.querySelectorAll('button[data-action=\"collapse-all\"]').forEach((button) => {
      button.addEventListener('click', () => {
        vscode.postMessage({ type: 'collapseAll' });
      });
    });
    // No explicit add-draft button; composer handles draft creation.
    document.querySelectorAll('button[data-action=\"toggle-thread\"]').forEach((button) => {
      button.addEventListener('click', () => {
        const threadId = button.getAttribute('data-thread-id');
        vscode.postMessage({ type: 'toggleThread', threadId });
      });
    });
    document.querySelectorAll('textarea[data-thread-id]').forEach((textarea) => {
      const threadId = textarea.getAttribute('data-thread-id');
      const update = () => {
        const value = textarea.value.trim();
        const disabled = value.length === 0;
        document.querySelectorAll('button[data-thread-id=\"' + threadId + '\"][data-action=\"save-draft\"]').forEach((button) => {
          button.disabled = disabled;
        });
        document.querySelectorAll('button[data-thread-id=\"' + threadId + '\"][data-action=\"submit-draft\"]').forEach((button) => {
          button.disabled = disabled;
        });
      };
      textarea.addEventListener('input', update);
      update();
    });
    const selectedThread = document.querySelector('[data-selected=\"true\"]');
    if (selectedThread) {
      selectedThread.scrollIntoView({ block: 'nearest' });
    }
  </script>
</body>
</html>`;
}

function renderBody(model: ViewModel): string {
  if (model.state === "no-document") {
    return `<div class="title">Threads</div><div class="empty">Open a Markdown file to see threads.</div>`;
  }

  if (model.state === "not-markdown") {
    return `<div class="title">Threads</div><div class="empty">Active file is not Markdown: ${escapeHtml(
      model.fileName
    )}</div>`;
  }

  const header = `<div class="title">Threads <span class="muted">${escapeHtml(
    model.fileName
  )}</span> <button class="link" data-action="create-thread">New thread</button> <button class="link" data-action="expand-all">Expand all</button> <button class="link" data-action="collapse-all">Collapse all</button></div>${renderFilterBar(
    model.filter,
    model.roleFilter
  )}${renderReanchorBanner(model.pendingReanchorId)}`;

  if (model.threads.length === 0) {
    return `${header}<div class="empty">No thread blocks found.</div>${renderErrors(
      model.errors
    )}`;
  }

  const list = model.threads
    .map((thread) =>
      renderThread(
        thread,
        model.pendingReanchorId,
        model.expandedThreadId,
        model.selectedThreadId,
        model.expandAll
      )
    )
    .join("\n");
  return `${header}${list}${renderErrors(model.errors)}`;
}

function renderReanchorBanner(pendingReanchorId?: string): string {
  if (!pendingReanchorId) {
    return "";
  }

  return `<div class="banner">
    <div class="row">
      <span class="badge">re-anchor</span>
      <span>${escapeHtml(pendingReanchorId)}</span>
      <button data-action="cancel-reanchor">Cancel</button>
    </div>
    <div class="snippet">Click the target paragraph in the editor to move this thread.</div>
  </div>`;
}

function renderHistory(thread: ThreadItem): string {
  if (thread.messages.length === 0) {
    return `<div class="history"><div class="snippet">No messages yet.</div></div>`;
  }

  const items = thread.messages
    .map((message) => {
      const label = message.role;
      const roleClass =
        message.role === "H"
          ? "human"
          : message.role === "D"
            ? "draft"
            : "agent";
      const ts = message.ts ? ` · ${escapeHtml(message.ts)}` : "";
      return `<div class="message ${roleClass}">
        <div class="meta">${escapeHtml(label)}${ts}</div>
        <div class="body">${escapeHtml(message.body || "")}</div>
      </div>`;
    })
    .join("\n");

  return `<div class="history">${items}</div>`;
}

function renderComposer(thread: ThreadItem): string {
  const body = thread.draftBody ?? "";
  return `<div class="composer">
    <div class="row"><span class="badge">compose</span></div>
    <textarea data-thread-id="${escapeHtml(
    thread.id
  )}" placeholder="Write a reply...">${escapeHtml(body)}</textarea>
    <div class="composer-actions">
      <button data-action="save-draft" data-thread-id="${escapeHtml(
    thread.id
  )}">Save draft</button>
      <button data-action="submit-draft" data-thread-id="${escapeHtml(
    thread.id
  )}">Submit</button>
    </div>
  </div>`;
}

function renderFilterBar(
  filter: ThreadFilter,
  roleFilter: RoleFilter
): string {
  const statusOptions: { value: ThreadFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "closed", label: "Closed" },
  ];

  const roleOptions: { value: RoleFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "human", label: "Human" },
    { value: "agent", label: "Agent" },
  ];

  const statusButtons = statusOptions
    .map((option) => {
      const isActive = option.value === filter;
      return `<button class="filter ${
        isActive ? "active" : ""
      }" data-action="set-filter" data-filter="${option.value}">${
        option.label
      }</button>`;
    })
    .join("");

  const roleButtons = roleOptions
    .map((option) => {
      const isActive = option.value === roleFilter;
      return `<button class="filter ${
        isActive ? "active" : ""
      }" data-action="set-role-filter" data-filter="${option.value}">${
        option.label
      }</button>`;
    })
    .join("");

  return `<div class="filter-bar">
    <span class="muted">Status</span>
    ${statusButtons}
  </div>
  <div class="filter-bar">
    <span class="muted">Stage</span>
    ${roleButtons}
  </div>`;
}

function renderThread(
  thread: ThreadItem,
  pendingReanchorId?: string,
  expandedThreadId?: string,
  selectedThreadId?: string,
  expandAll?: boolean
): string {
  const classes = ["thread", thread.status];
  if (selectedThreadId === thread.id) {
    classes.push("selected");
  }
  if (thread.pending) {
    classes.push("pending");
  }

  const pending = thread.pending ? "<span class=\"badge\">pending</span>" : "";
  const lastRole = thread.lastRole
    ? `<span class="badge">last=${escapeHtml(thread.lastRole)}</span>`
    : "";
  const snippetHtml = thread.summary
    ? `<div class="snippet">${escapeHtml(thread.summary)}</div>`
    : "";
  const statusAction = thread.status === "open" ? "Close" : "Re-open";
  const isReanchorPending = pendingReanchorId !== undefined;
  const isSelectedForReanchor = pendingReanchorId === thread.id;
  const isExpanded = expandAll || expandedThreadId === thread.id;
  const canCompose =
    thread.status === "open" &&
    !thread.pending &&
    (thread.hasDraft || thread.lastRole === "A" || thread.messageCount === 0);
  return `<div class="${classes.join(" ")}" data-thread-id="${escapeHtml(
    thread.id
  )}" data-selected="${selectedThreadId === thread.id ? "true" : "false"}">
    <div class="row">
      <button class="link" data-action="jump-to-thread" data-thread-id="${escapeHtml(
        thread.id
      )}">${escapeHtml(thread.id)}</button>
      <span class="badge">${escapeHtml(thread.status)}</span>
      ${pending}
      <span class="badge">${escapeHtml(thread.ref)}</span>
      <span class="badge">msgs=${thread.messageCount}</span>
      ${lastRole}
      <button data-action="toggle-thread" data-thread-id="${escapeHtml(
        thread.id
      )}">${isExpanded ? "Collapse" : "Expand"}</button>
      <button data-action="toggle-status" data-thread-id="${escapeHtml(
        thread.id
      )}">${statusAction}</button>
      <button data-action="begin-reanchor" data-thread-id="${escapeHtml(
        thread.id
      )}" ${isReanchorPending && !isSelectedForReanchor ? "disabled" : ""}>${
    isSelectedForReanchor ? "Re-anchoring..." : "Re-anchor"
  }</button>
    </div>
    ${snippetHtml}
    ${isExpanded ? renderHistory(thread) : ""}
    ${isExpanded && canCompose ? renderComposer(thread) : ""}
  </div>`;
}

function renderErrors(errors: ParseError[]): string {
  if (errors.length === 0) {
    return "";
  }

  const items = errors
    .map((error) => `<li>${escapeHtml(formatError(error))}</li>`)
    .join("\n");

  return `<div class="errors">
    <div class="title">Parse warnings</div>
    <ul>${items}</ul>
  </div>`;
}

function formatError(error: ParseError): string {
  const suffix = error.threadId ? ` (thread ${error.threadId})` : "";
  return `${error.message}${suffix}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function saveDraftMessage(
  threadId: string,
  body: string
): Promise<void> {
  if (!body.trim()) {
    return;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return;
  }

  const result = parseThreads(document.getText());
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread) {
    return;
  }

  const draftMessage = [...thread.messages]
    .reverse()
    .find((message) => message.role === "D");
  if (!draftMessage) {
    await appendMessage(threadId, "D", body);
    return;
  }

  const updatedBlock = rebuildMessageBlock(
    draftMessage.raw,
    body,
    document.eol
  );
  if (!updatedBlock) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(draftMessage.range.start),
      document.positionAt(draftMessage.range.end)
    ),
    updatedBlock
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

async function submitDraftMessage(
  threadId: string,
  body?: string
): Promise<void> {
  const bodyToUse = body?.trim() ?? "";
  if (!bodyToUse) {
    return;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return;
  }

  const result = parseThreads(document.getText());
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread) {
    return;
  }

  const lastMessage = thread.messages[thread.messages.length - 1];
  if (!lastMessage || lastMessage.role !== "D") {
    await appendMessage(threadId, "H", bodyToUse);
    return;
  }

  const updatedBlock = rebuildMessageBlockWithMeta(
    lastMessage.raw,
    bodyToUse,
    document.eol,
    {
      role: "H",
      ts: new Date().toISOString(),
    }
  );
  if (!updatedBlock) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(lastMessage.range.start),
      document.positionAt(lastMessage.range.end)
    ),
    updatedBlock
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

async function toggleThreadStatus(threadId: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return;
  }

  const result = parseThreads(document.getText());
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread) {
    return;
  }

  const nextStatus = thread.status === "open" ? "closed" : "open";
  const updatedHeader = rebuildThreadHeader(
    thread.header.raw,
    document.eol,
    { status: nextStatus }
  );
  if (!updatedHeader) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(thread.header.range.start),
      document.positionAt(thread.header.range.end)
    ),
    updatedHeader
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

async function reanchorThread(
  document: vscode.TextDocument,
  position: vscode.Position,
  threadId: string
): Promise<void> {
  if (document.languageId !== "markdown") {
    return;
  }

  const text = document.getText();
  const result = parseThreads(text);
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread) {
    vscode.window.showWarningMessage(`Thread ${threadId} not found.`);
    return;
  }

  const offset = document.offsetAt(position);
  const threadRanges = result.threads.map((item) => item.range);
  if (isOffsetInRanges(offset, threadRanges)) {
    vscode.window.showWarningMessage(
      "Click a paragraph outside any thread block to re-anchor."
    );
    return;
  }

  const block = findMarkdownBlockAt(text, offset, threadRanges);
  if (!block) {
    vscode.window.showWarningMessage(
      "Could not find a target paragraph at the cursor."
    );
    return;
  }

  const updatedText = moveThreadBlock(text, thread, block, document.eol);
  if (!updatedText || updatedText === text) {
    vscode.window.showInformationMessage("Thread already anchored there.");
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(0), document.positionAt(text.length)),
    updatedText
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

async function jumpToThread(threadId: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return;
  }

  const result = parseThreads(document.getText());
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread) {
    vscode.window.showWarningMessage(`Thread ${threadId} not found.`);
    return;
  }

  const targetPos = document.positionAt(thread.range.start);
  editor.selection = new vscode.Selection(targetPos, targetPos);
  editor.revealRange(
    new vscode.Range(targetPos, targetPos),
    vscode.TextEditorRevealType.InCenter
  );
}

async function createThreadAtCursor(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return undefined;
  }

  const text = document.getText();
  const result = parseThreads(text);
  const threadRanges = result.threads.map((item) => item.range);
  const offset = document.offsetAt(editor.selection.active);
  const target = findMarkdownBlockAt(text, offset, threadRanges);
  if (!target) {
    vscode.window.showWarningMessage(
      "Place the cursor in or near a paragraph to create a thread."
    );
    return undefined;
  }

  const existingIds = new Set(result.threads.map((item) => item.id));
  const id = generateThreadId(existingIds);
  const threadBlock = buildThreadBlock(id, document.eol);
  const updatedText = insertThreadBlockAt(
    text,
    target.end,
    threadBlock,
    document.eol
  );
  if (!updatedText) {
    return undefined;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(0), document.positionAt(text.length)),
    updatedText
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
  return id;
}

async function appendDraftMessage(threadId: string): Promise<void> {
  await appendMessage(threadId, "D", "");
}

async function appendMessage(
  threadId: string,
  role: "D" | "H" | "A",
  body: string
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== "markdown") {
    return;
  }

  const text = document.getText();
  const result = parseThreads(text);
  const thread = result.threads.find((item) => item.id === threadId);
  if (!thread || !thread.footer) {
    vscode.window.showWarningMessage(
      "Thread footer not found; cannot append message."
    );
    return;
  }

  const messageBlock = buildMessageBlock(threadId, role, body, document.eol);
  const updatedText = insertMessageBlockAt(
    text,
    thread.footer.range.start,
    messageBlock,
    document.eol
  );
  if (!updatedText) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(0), document.positionAt(text.length)),
    updatedText
  );
  await vscode.workspace.applyEdit(edit);
  await document.save();
}

function rebuildMessageBlock(
  raw: string,
  body: string,
  eol: vscode.EndOfLine
): string | null {
  return rebuildMessageBlockWithMeta(raw, body, eol, {});
}

function rebuildMessageBlockWithMeta(
  raw: string,
  body: string,
  eol: vscode.EndOfLine,
  metaUpdates: Record<string, string>
): string | null {
  const startIdx = raw.indexOf("<!--");
  const endIdx = raw.lastIndexOf("-->");
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const inner = raw.slice(startIdx + 4, endIdx);
  const lines = inner.split(/\r?\n/);
  const metaLine = lines[0] ?? "";
  const updatedMetaLine = updateMetaLine(metaLine, metaUpdates);
  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const normalizedBody = body.replace(/\r?\n+$/g, "");
  const escapedBody = escapeCommentBody(normalizedBody);

  return `<!--${updatedMetaLine}${newline}${escapedBody}${newline}-->`;
}

function escapeCommentBody(body: string): string {
  return body.replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;");
}

function generateThreadId(existingIds: Set<string>): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    let id = "";
    for (let i = 0; i < 5; i += 1) {
      id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    if (!existingIds.has(id)) {
      return id;
    }
  }
  return `Z${Math.random().toString(36).toUpperCase().slice(2, 6)}`.slice(0, 5);
}

function buildThreadBlock(id: string, eol: vscode.EndOfLine): string {
  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const ts = new Date().toISOString();
  return [
    `<!-- CMT:THREAD id=${id} status=open ref=prev=1 -->`,
    `<!-- CMT:MSG id=${id} role=D ts=${ts}`,
    "",
    "-->",
    `<!-- /CMT:THREAD id=${id} -->`,
  ].join(newline);
}

function buildMessageBlock(
  id: string,
  role: "D" | "H" | "A",
  body: string,
  eol: vscode.EndOfLine
): string {
  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const ts = new Date().toISOString();
  const normalizedBody = body.replace(/\r?\n+$/g, "");
  const escapedBody = escapeCommentBody(normalizedBody);
  return `<!-- CMT:MSG id=${id} role=${role} ts=${ts}${newline}${escapedBody}${newline}-->`;
}

function insertThreadBlockAt(
  text: string,
  insertPos: number,
  threadBlock: string,
  eol: vscode.EndOfLine
): string | null {
  if (insertPos < 0 || insertPos > text.length) {
    return null;
  }

  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const prefix = text.slice(0, insertPos);
  const suffix = text.slice(insertPos);

  // Normalize spacing to exactly one blank line between Markdown blocks.
  // This may “correct” extra blank lines, but keeps formatting deterministic.
  const cleanedBlock = trimBlankLines(threadBlock);
  return joinWithSingleBlankLine(prefix, cleanedBlock, suffix, newline);
}

function insertMessageBlockAt(
  text: string,
  insertPos: number,
  messageBlock: string,
  eol: vscode.EndOfLine
): string | null {
  if (insertPos < 0 || insertPos > text.length) {
    return null;
  }

  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const prefix = text.slice(0, insertPos);
  const suffix = text.slice(insertPos);
  const needsLeadingNewline = prefix.length > 0 && !prefix.endsWith("\n");
  let insertion = messageBlock;
  if (!insertion.endsWith("\n")) {
    insertion += newline;
  }
  const leading = needsLeadingNewline ? newline : "";
  return prefix + leading + insertion + suffix;
}

function joinWithSingleBlankLine(
  before: string,
  block: string,
  after: string,
  newline: string
): string {
  const beforeTrimmed = trimTrailingBlankLines(before);
  const afterTrimmed = trimLeadingBlankLines(after);

  let result = beforeTrimmed;
  if (result.length > 0) {
    result = ensureEndsWithNewline(result, newline) + newline;
  }

  const cleanedBlock = trimBlankLines(block);
  result += cleanedBlock;
  result = ensureEndsWithNewline(result, newline);

  if (afterTrimmed.length > 0) {
    result += newline + afterTrimmed;
  }

  return result;
}

function rebuildThreadHeader(
  raw: string,
  eol: vscode.EndOfLine,
  metaUpdates: Record<string, string>
): string | null {
  const startIdx = raw.indexOf("<!--");
  const endIdx = raw.lastIndexOf("-->");
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const inner = raw.slice(startIdx + 4, endIdx);
  const lines = inner.split(/\r?\n/);
  const metaLine = lines[0] ?? "";
  const updatedMetaLine = updateMetaLine(
    metaLine,
    metaUpdates,
    "CMT:THREAD"
  );
  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const rest = lines.slice(1).join(newline);
  const body = rest ? `${newline}${rest}` : "";

  return `<!--${updatedMetaLine}${body}-->`;
}

function updateMetaLine(
  metaLine: string,
  updates: Record<string, string>,
  expectedPrefix: string = "CMT:MSG"
): string {
  if (Object.keys(updates).length === 0) {
    return metaLine;
  }

  const leading = metaLine.match(/^\s*/)?.[0] ?? "";
  const trimmed = metaLine.trim();
  if (!trimmed.startsWith(expectedPrefix)) {
    return metaLine;
  }

  const tokens = trimmed.split(/\s+/);
  const prefix = tokens.shift() ?? expectedPrefix;
  const seen = new Set<string>();
  const rebuilt: string[] = [];

  for (const token of tokens) {
    const idx = token.indexOf("=");
    if (idx <= 0) {
      continue;
    }
    const key = token.slice(0, idx);
    let value = token.slice(idx + 1);
    if (updates[key] !== undefined) {
      value = updates[key];
      seen.add(key);
    }
    rebuilt.push(`${key}=${value}`);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      rebuilt.push(`${key}=${value}`);
    }
  }

  const suffix = rebuilt.length > 0 ? ` ${rebuilt.join(" ")}` : "";
  return `${leading}${prefix}${suffix}`;
}

function isOffsetInRanges(offset: number, ranges: OffsetRange[]): boolean {
  return ranges.some((range) => offset >= range.start && offset <= range.end);
}

function trimBlankLines(text: string): string {
  return trimLeadingBlankLines(trimTrailingBlankLines(text));
}

function trimLeadingBlankLines(text: string): string {
  let idx = 0;
  while (idx < text.length) {
    const newlineIdx = text.indexOf("\n", idx);
    if (newlineIdx === -1) {
      break;
    }
    let line = text.slice(idx, newlineIdx);
    if (line.endsWith("\r")) {
      line = line.slice(0, -1);
    }
    if (line.trim() === "") {
      idx = newlineIdx + 1;
      continue;
    }
    break;
  }
  return text.slice(idx);
}

function trimTrailingBlankLines(text: string): string {
  let idx = text.length;
  while (idx > 0) {
    const newlineIdx = text.lastIndexOf("\n", idx - 1);
    const lineStart = newlineIdx === -1 ? 0 : newlineIdx + 1;
    let line = text.slice(lineStart, idx);
    if (line.endsWith("\r")) {
      line = line.slice(0, -1);
    }
    if (line.trim() === "") {
      idx = newlineIdx === -1 ? 0 : newlineIdx;
      continue;
    }
    break;
  }
  return text.slice(0, idx);
}

function ensureEndsWithNewline(text: string, newline: string): string {
  if (text.length === 0) {
    return text;
  }
  if (text.endsWith("\n")) {
    return text;
  }
  return text + newline;
}

function moveThreadBlock(
  text: string,
  thread: Thread,
  target: OffsetRange,
  eol: vscode.EndOfLine
): string | null {
  const threadText = text.slice(thread.range.start, thread.range.end);
  const removalLength = thread.range.end - thread.range.start;
  let insertPos = target.end;

  if (thread.range.start < insertPos) {
    insertPos -= removalLength;
  }

  const prefixOriginal = text.slice(0, thread.range.start);
  const suffixOriginal = text.slice(thread.range.end);

  const trimmedPrefix = trimTrailingBlankLines(prefixOriginal);
  const trimmedSuffix = trimLeadingBlankLines(suffixOriginal);
  const removedFromPrefix = prefixOriginal.length - trimmedPrefix.length;
  const removedFromSuffix = suffixOriginal.length - trimmedSuffix.length;

  const newline = eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const hadBlank = removedFromPrefix > 0 || removedFromSuffix > 0;
  let joiner = "";
  if (trimmedPrefix.length > 0 && trimmedSuffix.length > 0 && hadBlank) {
    joiner = trimmedPrefix.endsWith("\n") ? newline : newline + newline;
  }
  const textWithoutThread = trimmedPrefix + joiner + trimmedSuffix;

  const boundary = prefixOriginal.length;
  if (insertPos <= boundary) {
    insertPos = Math.min(insertPos, trimmedPrefix.length);
  } else {
    insertPos =
      insertPos - removedFromPrefix - removedFromSuffix + joiner.length;
  }

  const cleanedThread = trimBlankLines(threadText);
  const prefixRaw = textWithoutThread.slice(0, insertPos);
  const suffixRaw = textWithoutThread.slice(insertPos);

  const prefix = trimTrailingBlankLines(prefixRaw);
  const suffix = trimLeadingBlankLines(suffixRaw);

  let result = prefix;
  if (result.length > 0) {
    result = ensureEndsWithNewline(result, newline) + newline;
  }

  result += cleanedThread;
  result = ensureEndsWithNewline(result, newline);

  if (suffix.length > 0) {
    result += newline + suffix;
  }

  return result;
}

function findMarkdownBlockAt(
  text: string,
  offset: number,
  exclusions: OffsetRange[]
): OffsetRange | null {
  if (isOffsetInRanges(offset, exclusions)) {
    return null;
  }

  const lines = getLines(text);
  let index = findLineIndex(lines, offset);
  if (index === -1) {
    return null;
  }

  while (index >= 0 && isBlankLine(lines[index].text)) {
    index -= 1;
  }

  if (index < 0) {
    return null;
  }

  if (isCommentLine(lines[index].text)) {
    return null;
  }

  const fenceBlock = findFenceBlock(lines, index);
  if (fenceBlock) {
    return toRange(lines, fenceBlock.startLine, fenceBlock.endLine);
  }

  const type = classifyLine(lines[index].text);
  if (type === "heading") {
    return toRange(lines, index, index);
  }

  if (type === "blockquote") {
    const { startLine, endLine } = expandBlock(lines, index, isBlockquoteLine);
    return toRange(lines, startLine, endLine);
  }

  if (type === "list") {
    const { startLine, endLine } = expandBlock(lines, index, isListLineOrContinuation);
    return toRange(lines, startLine, endLine);
  }

  const { startLine, endLine } = expandBlock(lines, index, isParagraphLine);
  return toRange(lines, startLine, endLine);
}

type LineInfo = {
  start: number;
  end: number;
  text: string;
  newline: string;
};

function getLines(text: string): LineInfo[] {
  const lines: LineInfo[] = [];
  const newlineRe = /\r?\n/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = newlineRe.exec(text)) !== null) {
    lines.push({
      start: lastIndex,
      end: match.index,
      text: text.slice(lastIndex, match.index),
      newline: match[0],
    });
    lastIndex = match.index + match[0].length;
  }

  lines.push({
    start: lastIndex,
    end: text.length,
    text: text.slice(lastIndex),
    newline: "",
  });

  return lines;
}

function findLineIndex(lines: LineInfo[], offset: number): number {
  for (let i = 0; i < lines.length; i += 1) {
    if (offset >= lines[i].start && offset <= lines[i].end) {
      return i;
    }
  }
  return -1;
}

function toRange(lines: LineInfo[], startLine: number, endLine: number): OffsetRange {
  const start = lines[startLine].start;
  const endLineInfo = lines[endLine];
  const end = endLineInfo.end + endLineInfo.newline.length;
  return { start, end };
}

function expandBlock(
  lines: LineInfo[],
  index: number,
  predicate: (text: string) => boolean
): { startLine: number; endLine: number } {
  let startLine = index;
  while (startLine > 0 && predicate(lines[startLine - 1].text)) {
    startLine -= 1;
  }

  let endLine = index;
  while (endLine + 1 < lines.length && predicate(lines[endLine + 1].text)) {
    endLine += 1;
  }

  return { startLine, endLine };
}

function classifyLine(text: string): "heading" | "blockquote" | "list" | "paragraph" {
  if (isHeadingLine(text)) {
    return "heading";
  }
  if (isBlockquoteLine(text)) {
    return "blockquote";
  }
  if (isListLine(text)) {
    return "list";
  }
  return "paragraph";
}

function isBlankLine(text: string): boolean {
  return /^\s*$/.test(text);
}

function isCommentLine(text: string): boolean {
  return /^\s*<!--/.test(text);
}

function isHeadingLine(text: string): boolean {
  return /^\s{0,3}#{1,6}\s+/.test(text);
}

function isBlockquoteLine(text: string): boolean {
  return /^\s{0,3}>\s?/.test(text);
}

function isListLine(text: string): boolean {
  return /^\s{0,3}([*+-]|\d+[.)])\s+/.test(text);
}

function isListContinuationLine(text: string): boolean {
  return /^\s{2,}\S+/.test(text);
}

function isListLineOrContinuation(text: string): boolean {
  if (isBlankLine(text)) {
    return false;
  }
  return isListLine(text) || isListContinuationLine(text);
}

function isParagraphLine(text: string): boolean {
  if (isBlankLine(text)) {
    return false;
  }
  if (isCommentLine(text)) {
    return false;
  }
  if (isHeadingLine(text)) {
    return false;
  }
  if (isBlockquoteLine(text)) {
    return false;
  }
  if (isListLine(text)) {
    return false;
  }
  if (getFenceMarker(text)) {
    return false;
  }
  return true;
}

function getFenceMarker(text: string): string | null {
  const match = text.match(/^\s{0,3}(```|~~~)/);
  return match ? match[1] : null;
}

function findFenceBlock(
  lines: LineInfo[],
  index: number
): { startLine: number; endLine: number } | null {
  let activeFence: { marker: string; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const marker = getFenceMarker(lines[i].text);
    if (marker) {
      if (!activeFence) {
        activeFence = { marker, startLine: i };
      } else if (activeFence.marker === marker) {
        const endLine = i;
        if (index >= activeFence.startLine && index <= endLine) {
          return { startLine: activeFence.startLine, endLine };
        }
        activeFence = null;
      }
    }

    if (i === index && activeFence) {
      // No closing fence yet; treat as block to EOF.
      return { startLine: activeFence.startLine, endLine: lines.length - 1 };
    }
  }

  return null;
}

function createNonce(): string {
  let nonce = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 16; i += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
