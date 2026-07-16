(() => {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById("app");
  const restored = vscode.getState() || {};
  const composers = { ...(restored.composers || {}) };
  let focusedThreadId = restored.focusedThreadId || null;
  let reanchorThreadId = restored.reanchorThreadId || null;
  let railHidden = restored.railHidden || false;
  let model = null;
  let requestSequence = 0;
  let statusMessage = "";

  function persist() {
    vscode.setState({ composers, focusedThreadId, reanchorThreadId, railHidden });
  }

  function nextRequestId() {
    requestSequence += 1;
    return `review-${Date.now()}-${requestSequence}`;
  }

  function send(type, values = {}) {
    if (!model) {
      return;
    }
    vscode.postMessage({
      type,
      requestId: nextRequestId(),
      documentVersion: model.documentVersion,
      ...values,
    });
  }

  function updateModel(nextModel) {
    const focus = captureComposerFocus();
    model = nextModel;
    for (const thread of model.threads) {
      if (
        !Object.prototype.hasOwnProperty.call(composers, thread.id) &&
        thread.draftBody
      ) {
        composers[thread.id] = thread.draftBody;
      }
    }
    if (
      focusedThreadId &&
      !model.threads.some((thread) => thread.id === focusedThreadId)
    ) {
      focusedThreadId = null;
    }
    app.setAttribute("aria-busy", "false");
    render();
    restoreComposerFocus(focus);
    persist();
  }

  function render() {
    app.replaceChildren();
    if (!model) {
      app.append(create("div", "loading", "Opening collaborative review…"));
      return;
    }

    app.append(renderTopbar());
    if (statusMessage) {
      app.append(renderNotice());
    }
    if (reanchorThreadId) {
      app.append(renderReanchorBanner());
    }
    if (model.errors.length > 0) {
      app.append(renderErrorBanner());
    }

    const workspace = create(
      "div",
      railHidden ? "review-workspace rail-hidden" : "review-workspace"
    );
    workspace.append(renderDocument());
    if (!railHidden) {
      workspace.append(renderRail());
    }
    app.append(workspace);

    const live = create("div", "sr-only");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.textContent = statusMessage;
    app.append(live);
  }

  function renderTopbar() {
    const topbar = create("header", "review-topbar");
    const identity = create("div", "review-identity");
    identity.append(create("div", "review-title", "Collaborative Review"));
    identity.append(create("div", "review-file", model.fileName));
    topbar.append(identity);

    const counts = create("div", "review-counts");
    counts.append(countPill("Open", model.counts.open, "open"));
    counts.append(renderAgentHandoff());
    counts.append(countPill("Drafts", visibleDraftCount(), "draft"));
    topbar.append(counts);

    const actions = create("div", "review-topbar-actions");
    actions.append(
      button(
        railHidden ? "Show conversations" : "All conversations",
        "secondary",
        "show-activity",
        {
        title: "Browse every conversation in this document",
        }
      )
    );
    actions.append(
      button("Open source", "secondary", "open-source", {
        title: "Open the same Markdown file in the native text editor",
      })
    );
    topbar.append(actions);
    return topbar;
  }

  function countPill(label, count, stage) {
    return create("span", `count count-${stage}`, `${count} ${label}`);
  }

  function renderAgentHandoff() {
    const count = model.counts.waiting;
    const handoff = create("div", "review-handoff");
    const label = count === 1 ? "1 comment ready" : `${count} comments ready`;
    handoff.append(
      create(
        "span",
        count > 0 ? "count count-ready has-ready" : "count count-ready",
        label
      )
    );
    const copy = button("Copy prompt", "copy-prompt", "copy-agent-prompt", {
      title:
        count > 0
          ? "Copy a short prompt for your current agent conversation"
          : "Submit a comment before preparing an agent prompt",
      ariaLabel:
        count > 0
          ? `Copy prompt for ${label}`
          : "No comments are ready for an agent prompt",
    });
    copy.disabled = count === 0 || model.errors.length > 0;
    handoff.append(copy);
    return handoff;
  }

  function visibleDraftCount() {
    const ids = new Set(
      model.threads
        .filter((thread) => thread.stage === "draft")
        .map((thread) => thread.id)
    );
    for (const [threadId, value] of Object.entries(composers)) {
      if (String(value).trim()) {
        ids.add(threadId);
      }
    }
    return ids.size;
  }

  function renderErrorBanner() {
    const banner = create("section", "review-errors");
    banner.setAttribute("role", "alert");
    const heading = create(
      "strong",
      "",
      "Conversation data needs repair before it can be changed"
    );
    banner.append(heading);
    const list = document.createElement("ul");
    for (const error of model.errors.slice(0, 5)) {
      list.append(create("li", "", error.message));
    }
    banner.append(list);
    return banner;
  }

  function renderNotice() {
    const notice = create("div", "review-notice");
    notice.setAttribute("role", "status");
    notice.append(create("span", "", statusMessage));
    notice.append(
      button("Dismiss", "notice-dismiss", "dismiss-notice", {
        ariaLabel: "Dismiss review notification",
      })
    );
    return notice;
  }

  function renderReanchorBanner() {
    const thread = model.threads.find((item) => item.id === reanchorThreadId);
    const banner = create("div", "reanchor-banner");
    banner.setAttribute("role", "status");
    const copy = create("div");
    copy.append(create("strong", "", "Choose a new anchor"));
    copy.append(
      create(
        "span",
        "",
        thread
          ? ` Move this conversation from “${thread.anchorText}” using a highlighted marker beside the new passage.`
          : " Choose a highlighted passage."
      )
    );
    banner.append(copy);
    banner.append(button("Cancel", "secondary", "cancel-reanchor"));
    return banner;
  }

  function renderDocument() {
    const surface = create("main", "review-document");
    surface.setAttribute("aria-label", `Rendered Markdown: ${model.fileName}`);
    if (model.blocks.length === 0) {
      const empty = create("div", "review-document-empty");
      empty.append(create("h1", "", "This Markdown file is empty"));
      empty.append(
        create(
          "p",
          "",
          "Add prose in the source editor, then return here to start conversations."
        )
      );
      surface.append(empty);
      return surface;
    }

    const focused = focusedThread();
    for (const block of model.blocks) {
      const wrapper = create("section", "review-block");
      wrapper.id = block.id;
      wrapper.dataset.blockId = block.id;
      wrapper.tabIndex = -1;
      if (focused?.anchorBlockIds.includes(block.id)) {
        wrapper.classList.add("is-focused-anchor");
      }
      if (reanchorThreadId) {
        wrapper.classList.add("is-reanchor-target");
      }

      const content = create("div", "review-block-content");
      content.innerHTML = block.html;
      wrapper.append(content);

      const gutter = create("aside", "review-block-gutter");
      gutter.setAttribute("aria-label", "Conversations for this content");
      for (const threadId of block.threadIds) {
        const thread = model.threads.find((item) => item.id === threadId);
        if (thread) {
          gutter.append(renderMarker(thread));
        }
      }
      if (reanchorThreadId) {
        const target = button("↳", "reanchor-target", "reanchor-target", {
          title: "Move the focused conversation to this passage",
          ariaLabel: `Move the conversation to: ${block.text}`,
        });
        target.dataset.blockId = block.id;
        target.disabled =
          model.errors.length > 0 || focused?.anchorBlockIds.includes(block.id);
        gutter.append(target);
      } else {
        const add = button("+", "start-thread", "create-thread", {
          title: "Start a conversation about this content",
          ariaLabel: `Start a conversation about: ${block.text}`,
        });
        add.dataset.blockId = block.id;
        add.disabled = model.errors.length > 0;
        gutter.append(add);
      }
      wrapper.append(gutter);
      surface.append(wrapper);
    }
    return surface;
  }

  function renderMarker(thread) {
    const marker = button("", `thread-marker stage-${thread.stage}`, "open-thread", {
      title: `${stageLabel(thread.stage)} conversation: ${thread.anchorText}`,
      ariaLabel: `Open ${stageLabel(thread.stage).toLowerCase()} conversation about ${thread.anchorText}`,
    });
    marker.dataset.threadId = thread.id;
    if (thread.id === focusedThreadId) {
      marker.setAttribute("aria-current", "true");
    }
    marker.append(create("span", "thread-marker-shape"));
    if (hasUnsavedComposer(thread)) {
      marker.append(create("span", "thread-marker-unsaved", "•"));
    }
    return marker;
  }

  function renderRail() {
    const rail = create("aside", "conversation-rail");
    rail.setAttribute("aria-label", "Document conversations");
    rail.append(
      button("×", "rail-close", "hide-rail", {
        title: "Hide conversations",
        ariaLabel: "Hide conversation rail",
      })
    );
    const thread = focusedThread();
    if (thread) {
      rail.append(renderConversation(thread));
    } else {
      rail.append(renderActivity());
    }
    return rail;
  }

  function renderActivity() {
    const view = create("div", "activity-view");
    const header = create("div", "rail-header");
    const heading = create("div");
    heading.append(create("h2", "", "Conversations"));
    heading.append(
      create(
        "p",
        "rail-subtitle",
        "Move between threads without losing unfinished prompts."
      )
    );
    header.append(heading);
    view.append(header);

    if (model.threads.length === 0) {
      const empty = create("div", "rail-empty");
      empty.append(create("h3", "", "No conversations yet"));
      empty.append(
        create(
          "p",
          "",
          "Hover a passage and use + to start a threaded discussion."
        )
      );
      view.append(empty);
      return view;
    }

    const list = create("div", "activity-list");
    list.setAttribute("role", "list");
    const ordered = [...model.threads].sort(compareThreads);
    for (const thread of ordered) {
      const item = button("", "activity-item", "open-thread", {
        ariaLabel: `Open ${stageLabel(thread.stage).toLowerCase()} conversation about ${thread.anchorText}`,
      });
      item.dataset.threadId = thread.id;
      const row = create("span", "activity-item-top");
      row.append(stagePill(thread.stage));
      row.append(
        create(
          "span",
          "activity-message-count",
          `${thread.messages.length} ${thread.messages.length === 1 ? "turn" : "turns"}`
        )
      );
      if (hasUnsavedComposer(thread)) {
        row.append(create("span", "unsaved-pill", "Unsaved"));
      }
      item.append(row);
      item.append(create("span", "activity-anchor", thread.anchorText));
      const latest = latestMessage(thread);
      if (latest) {
        item.append(create("span", "activity-preview", latest.text));
      }
      const listItem = create("div", "activity-list-item");
      listItem.setAttribute("role", "listitem");
      listItem.append(item);
      list.append(listItem);
    }
    view.append(list);
    return view;
  }

  function renderConversation(thread) {
    const view = create("div", "conversation-view");
    const header = create("div", "rail-header conversation-header");
    const back = button("All conversations", "back-button", "show-activity", {
      ariaLabel: "Return to all conversations",
    });
    header.append(back);
    const navigation = create("div", "thread-navigation");
    navigation.append(
      button("↑", "thread-navigation-button", "previous-thread", {
        title: "Previous conversation (Alt+Up)",
        ariaLabel: "Open previous conversation",
      })
    );
    navigation.append(
      button("↓", "thread-navigation-button", "next-thread", {
        title: "Next conversation (Alt+Down)",
        ariaLabel: "Open next conversation",
      })
    );
    header.append(navigation);
    const statusRow = create("div", "conversation-status-row");
    statusRow.append(stagePill(thread.stage));
    const reanchor = button("Re-anchor", "quiet-button", "begin-reanchor");
    reanchor.disabled = model.errors.length > 0;
    statusRow.append(reanchor);
    const statusAction = button(
      thread.status === "closed" ? "Reopen" : "Resolve",
      "quiet-button",
      "toggle-status"
    );
    statusAction.disabled = model.errors.length > 0;
    statusRow.append(statusAction);
    header.append(statusRow);
    view.append(header);

    const anchor = button("", "anchor-context", "scroll-anchor", {
      ariaLabel: `Show anchored text: ${thread.anchorText}`,
    });
    anchor.append(create("span", "anchor-context-label", "Discussing"));
    anchor.append(create("span", "anchor-context-text", thread.anchorText));
    view.append(anchor);

    const history = create("div", "conversation-history");
    history.setAttribute("aria-label", "Conversation history");
    if (thread.messages.length === 0) {
      history.append(
        create(
          "p",
          "conversation-empty",
          "Start the conversation when the prompt is ready."
        )
      );
    } else {
      for (const message of thread.messages) {
        history.append(renderMessage(message));
      }
    }
    view.append(history);

    if (thread.canCompose) {
      view.append(renderComposer(thread));
    } else if (thread.stage === "waiting") {
      const waiting = create("div", "waiting-state");
      waiting.append(create("span", "waiting-pulse"));
      waiting.append(
        create(
          "div",
          "",
          "Submitted and waiting for an agent response. Other threads remain available."
        )
      );
      view.append(waiting);
    } else {
      view.append(
        create(
          "div",
          "resolved-state",
          "This conversation is resolved. Reopen it to continue."
        )
      );
    }
    return view;
  }

  function renderMessage(message) {
    const item = create("article", `conversation-message message-${message.role}`);
    const avatar = create(
      "div",
      "message-avatar",
      message.role === "human" ? "Y" : message.role === "agent" ? "A" : "D"
    );
    avatar.setAttribute("aria-hidden", "true");
    item.append(avatar);
    const content = create("div", "message-content");
    const meta = create("div", "message-meta");
    meta.append(create("strong", "", message.author));
    if (message.timestamp) {
      const time = document.createElement("time");
      time.dateTime = message.timestamp;
      time.textContent = formatTimestamp(message.timestamp);
      meta.append(time);
    }
    content.append(meta);
    const body = create("div", "message-body");
    body.innerHTML = message.html;
    content.append(body);
    item.append(content);
    return item;
  }

  function renderComposer(thread) {
    const composer = create("section", "conversation-composer");
    const label = document.createElement("label");
    label.htmlFor = `composer-${thread.id}`;
    label.textContent = thread.stage === "draft" ? "Continue your draft" : "Your next turn";
    composer.append(label);

    const textarea = document.createElement("textarea");
    textarea.id = `composer-${thread.id}`;
    textarea.dataset.threadId = thread.id;
    textarea.rows = 7;
    textarea.placeholder = "Write a prompt or response. Nothing is submitted until you choose Submit.";
    textarea.value = composerValue(thread);
    textarea.disabled = model.errors.length > 0;
    composer.append(textarea);

    const footer = create("div", "composer-footer");
    footer.append(create("span", "composer-hint", "Ctrl+Enter to submit"));
    const actions = create("div", "composer-actions");
    const save = button("Save draft", "secondary", "save-draft");
    const submit = button("Submit turn", "primary", "submit");
    const empty = textarea.value.trim().length === 0 || model.errors.length > 0;
    save.disabled = empty;
    submit.disabled = empty;
    actions.append(save, submit);
    footer.append(actions);
    composer.append(footer);
    return composer;
  }

  function stagePill(stage) {
    return create("span", `stage-pill stage-${stage}`, stageLabel(stage));
  }

  function stageLabel(stage) {
    return {
      open: "Open",
      draft: "Draft",
      waiting: "Waiting",
      answered: "Answered",
      resolved: "Resolved",
    }[stage] || "Open";
  }

  function focusedThread() {
    return model?.threads.find((thread) => thread.id === focusedThreadId) || null;
  }

  function latestMessage(thread) {
    return thread.messages[thread.messages.length - 1];
  }

  function composerValue(thread) {
    return Object.prototype.hasOwnProperty.call(composers, thread.id)
      ? String(composers[thread.id])
      : thread.draftBody || "";
  }

  function hasUnsavedComposer(thread) {
    if (!Object.prototype.hasOwnProperty.call(composers, thread.id)) {
      return false;
    }
    return composerValue(thread).trim() !== (thread.draftBody || "").trim();
  }

  function compareThreads(left, right) {
    const rank = { waiting: 0, draft: 1, answered: 2, open: 3, resolved: 4 };
    return rank[left.stage] - rank[right.stage];
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function captureComposerFocus() {
    const active = document.activeElement;
    if (!(active instanceof HTMLTextAreaElement) || !active.dataset.threadId) {
      return null;
    }
    return {
      threadId: active.dataset.threadId,
      start: active.selectionStart,
      end: active.selectionEnd,
    };
  }

  function restoreComposerFocus(snapshot) {
    if (!snapshot || snapshot.threadId !== focusedThreadId) {
      return;
    }
    const textarea = document.querySelector(
      `textarea[data-thread-id="${snapshot.threadId}"]`
    );
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
      textarea.setSelectionRange(snapshot.start, snapshot.end);
    }
  }

  function focusThread(threadId, moveFocus = true) {
    focusedThreadId = threadId;
    railHidden = false;
    statusMessage = "Conversation opened";
    persist();
    render();
    const thread = focusedThread();
    if (thread?.anchorBlockIds[0]) {
      document.getElementById(thread.anchorBlockIds[0])?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    if (moveFocus) {
      const textarea = document.querySelector(`textarea[data-thread-id="${threadId}"]`);
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      } else {
        document.querySelector(".anchor-context")?.focus();
      }
    }
  }

  function moveThread(direction) {
    if (!model?.threads.length) {
      return;
    }
    const current = model.threads.findIndex(
      (thread) => thread.id === focusedThreadId
    );
    const start = current >= 0 ? current : 0;
    const next =
      (start + direction + model.threads.length) % model.threads.length;
    focusThread(model.threads[next].id);
  }

  function setButtonsForTextarea(textarea) {
    const composer = textarea.closest(".conversation-composer");
    if (!composer) {
      return;
    }
    const disabled = textarea.value.trim().length === 0 || model.errors.length > 0;
    composer.querySelectorAll("button").forEach((control) => {
      control.disabled = disabled;
    });
  }

  function currentComposer() {
    const textarea = document.querySelector(
      `textarea[data-thread-id="${focusedThreadId || ""}"]`
    );
    return textarea instanceof HTMLTextAreaElement ? textarea : null;
  }

  function create(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function button(text, className, action, options = {}) {
    const control = document.createElement("button");
    control.type = "button";
    control.className = className;
    control.dataset.action = action;
    control.textContent = text;
    if (options.title) {
      control.title = options.title;
    }
    if (options.ariaLabel) {
      control.setAttribute("aria-label", options.ariaLabel);
    }
    return control;
  }

  app.addEventListener("input", (event) => {
    const textarea = event.target;
    if (!(textarea instanceof HTMLTextAreaElement) || !textarea.dataset.threadId) {
      return;
    }
    composers[textarea.dataset.threadId] = textarea.value;
    setButtonsForTextarea(textarea);
    persist();
  });

  document.addEventListener("keydown", (event) => {
    const textarea = event.target;
    if (
      event.key === "Enter" &&
      event.ctrlKey &&
      textarea instanceof HTMLTextAreaElement &&
      textarea.dataset.threadId
    ) {
      event.preventDefault();
      const body = textarea.value.trim();
      if (body) {
        send("submit", { threadId: textarea.dataset.threadId, body });
      }
      return;
    }
    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      moveThread(1);
    } else if (event.altKey && event.key === "ArrowUp") {
      event.preventDefault();
      moveThread(-1);
    } else if (event.key === "Escape" && reanchorThreadId) {
      reanchorThreadId = null;
      statusMessage = "Re-anchoring cancelled.";
      persist();
      render();
    }
  });

  app.addEventListener("click", (event) => {
    const external = event.target.closest?.("[data-external-url]");
    if (external) {
      event.preventDefault();
      vscode.postMessage({ type: "openExternal", url: external.dataset.externalUrl });
      return;
    }

    const control = event.target.closest?.("button[data-action]");
    if (!control || control.disabled) {
      return;
    }
    const action = control.dataset.action;
    if (action === "open-source") {
      vscode.postMessage({ type: "openSource" });
      return;
    }
    if (action === "copy-agent-prompt") {
      send("copyAgentPrompt");
      return;
    }
    if (action === "dismiss-notice") {
      statusMessage = "";
      render();
      return;
    }
    if (action === "previous-thread") {
      moveThread(-1);
      return;
    }
    if (action === "next-thread") {
      moveThread(1);
      return;
    }
    if (action === "show-activity") {
      focusedThreadId = null;
      railHidden = false;
      persist();
      render();
      document.querySelector(".activity-view h2")?.focus?.();
      return;
    }
    if (action === "hide-rail") {
      railHidden = true;
      persist();
      render();
      document.querySelector('[data-action="show-activity"]')?.focus();
      return;
    }
    if (action === "open-thread" && control.dataset.threadId) {
      focusThread(control.dataset.threadId);
      return;
    }
    if (action === "create-thread" && control.dataset.blockId) {
      send("createThread", { blockId: control.dataset.blockId });
      return;
    }
    if (action === "begin-reanchor" && focusedThreadId) {
      reanchorThreadId = focusedThreadId;
      statusMessage = "Choose a new passage for this conversation.";
      persist();
      render();
      document.querySelector(".reanchor-target:not(:disabled)")?.focus();
      return;
    }
    if (action === "cancel-reanchor") {
      reanchorThreadId = null;
      statusMessage = "Re-anchoring cancelled.";
      persist();
      render();
      return;
    }
    if (
      action === "reanchor-target" &&
      reanchorThreadId &&
      control.dataset.blockId
    ) {
      send("reanchorThread", {
        threadId: reanchorThreadId,
        blockId: control.dataset.blockId,
      });
      return;
    }
    if (action === "scroll-anchor") {
      const thread = focusedThread();
      const block = thread?.anchorBlockIds[0];
      if (block) {
        const target = document.getElementById(block);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.focus();
      }
      return;
    }
    if (action === "toggle-status" && focusedThreadId) {
      send("toggleStatus", { threadId: focusedThreadId });
      return;
    }
    const textarea = currentComposer();
    if (!textarea || !focusedThreadId) {
      return;
    }
    const body = textarea.value.trim();
    if (action === "save-draft" && body) {
      send("saveDraft", { threadId: focusedThreadId, body });
    } else if (action === "submit" && body) {
      send("submit", { threadId: focusedThreadId, body });
    }
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message?.type === "reviewModel" && message.model) {
      updateModel(message.model);
      return;
    }
    if (message?.type === "clipboardResult") {
      statusMessage = message.ok
        ? `${message.count} ${message.count === 1 ? "comment" : "comments"} ready prompt copied. Paste it into your current agent conversation.`
        : message.message || "The agent prompt could not be copied.";
      render();
      return;
    }
    if (message?.type !== "mutationResult") {
      return;
    }
    if (!message.ok) {
      statusMessage = message.message || "The conversation could not be changed.";
      render();
      return;
    }
    if (message.action === "createThread" && typeof message.threadId === "string") {
      focusedThreadId = message.threadId;
      composers[message.threadId] = "";
      statusMessage = "Conversation created. Nothing has been submitted yet.";
    } else if (message.action === "submit" && typeof message.threadId === "string") {
      delete composers[message.threadId];
      statusMessage = "Turn submitted. This conversation is now waiting for an agent response.";
    } else if (message.action === "saveDraft") {
      statusMessage = "Draft saved in the Markdown file. It has not been submitted.";
    } else if (message.action === "reanchorThread") {
      reanchorThreadId = null;
      statusMessage = "Conversation moved to its new passage.";
    } else {
      statusMessage = "Conversation updated.";
    }
    persist();
    render();
  });

  render();
  vscode.postMessage({ type: "webviewReady" });
})();
