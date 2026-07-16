import { findMarkdownBlockAt, insertThreadBlockAt, moveThreadBlock } from "./anchors";
import { parseThreads } from "./parser";
import { MessageRole, ParseError, Range, Thread } from "./types";

export type MutationFailureCode =
  | "document-invalid"
  | "thread-not-found"
  | "thread-ambiguous"
  | "thread-invalid"
  | "illegal-transition"
  | "invalid-body"
  | "invalid-target"
  | "id-exhausted";

export type MutationEdit = {
  range: Range;
  text: string;
};

export type MutationResult =
  | {
      ok: true;
      text: string;
      edit: MutationEdit;
      threadId?: string;
    }
  | {
      ok: false;
      code: MutationFailureCode;
      message: string;
      errors?: ParseError[];
    };

export type MutationOptions = {
  newline?: "\n" | "\r\n";
  now?: () => Date;
};

export function saveDraft(
  text: string,
  threadId: string,
  body: string,
  options: MutationOptions = {}
): MutationResult {
  if (!body.trim()) {
    return failure("invalid-body", "Draft text cannot be empty.");
  }
  const target = findMutableThread(text, threadId);
  if (!target.ok) {
    return target.result;
  }
  const stateError = validateHumanWriteState(target.thread);
  if (stateError) {
    return stateError;
  }

  const last = target.thread.messages[target.thread.messages.length - 1];
  if (last?.role === "H") {
    return failure(
      "illegal-transition",
      `Thread ${threadId} is waiting for an agent response.`
    );
  }
  if (last?.role === "D") {
    const updated = rebuildMessageBlock(last.raw, body, newline(options), {});
    return replacement(text, last.range, updated);
  }

  return appendMessageBlock(
    text,
    target.thread,
    "D",
    body,
    options
  );
}

export function submitHumanMessage(
  text: string,
  threadId: string,
  body: string,
  options: MutationOptions = {}
): MutationResult {
  const normalizedBody = body.trim();
  if (!normalizedBody) {
    return failure("invalid-body", "Submitted message cannot be empty.");
  }
  const target = findMutableThread(text, threadId);
  if (!target.ok) {
    return target.result;
  }
  const stateError = validateHumanWriteState(target.thread);
  if (stateError) {
    return stateError;
  }

  const last = target.thread.messages[target.thread.messages.length - 1];
  if (last?.role === "H") {
    return failure(
      "illegal-transition",
      `Thread ${threadId} already has a pending human message.`
    );
  }
  if (last?.role === "D") {
    const updated = rebuildMessageBlock(last.raw, normalizedBody, newline(options), {
      role: "H",
      ts: now(options).toISOString(),
    });
    return replacement(text, last.range, updated);
  }

  return appendMessageBlock(
    text,
    target.thread,
    "H",
    normalizedBody,
    options
  );
}

export function appendAgentMessage(
  text: string,
  threadId: string,
  body: string,
  options: MutationOptions = {}
): MutationResult {
  const normalizedBody = body.trim();
  if (!normalizedBody) {
    return failure("invalid-body", "Agent message cannot be empty.");
  }
  const target = findMutableThread(text, threadId);
  if (!target.ok) {
    return target.result;
  }
  if (target.thread.status !== "open") {
    return failure(
      "illegal-transition",
      `Closed thread ${threadId} cannot receive a response.`
    );
  }
  const draftError = validateDraftTopology(target.thread);
  if (draftError) {
    return draftError;
  }
  const last = target.thread.messages[target.thread.messages.length - 1];
  if (!last || last.role !== "H") {
    return failure(
      "illegal-transition",
      `Thread ${threadId} is not waiting for an agent response.`
    );
  }
  return appendMessageBlock(
    text,
    target.thread,
    "A",
    normalizedBody,
    options
  );
}

export function toggleStatus(
  text: string,
  threadId: string,
  options: MutationOptions = {}
): MutationResult {
  const target = findMutableThread(text, threadId);
  if (!target.ok) {
    return target.result;
  }
  const nextStatus = target.thread.status === "open" ? "closed" : "open";
  const updated = rebuildCommentWithMeta(target.thread.header.raw, {
    status: nextStatus,
  }, "CMT:THREAD", newline(options));
  return replacement(text, target.thread.header.range, updated);
}

export function deleteThread(
  text: string,
  threadId: string,
  options: MutationOptions = {}
): MutationResult {
  const target = findMutableThread(text, threadId);
  if (!target.ok) {
    return target.result;
  }
  const edit = threadDeletionEdit(text, target.thread.range, newline(options));
  const updated = applyEdit(text, edit);
  return { ok: true, text: updated, edit, threadId };
}

export function deleteAllThreads(
  text: string,
  options: MutationOptions = {}
): MutationResult {
  const parsed = parseThreads(text);
  if (parsed.errors.length > 0) {
    return invalidDocument(parsed.errors);
  }
  if (parsed.threads.length === 0) {
    return failure("thread-not-found", "No conversations were found.");
  }

  let updated = text;
  const ordered = [...parsed.threads].sort(
    (left, right) => right.range.start - left.range.start
  );
  for (const thread of ordered) {
    updated = applyEdit(
      updated,
      threadDeletionEdit(updated, thread.range, newline(options))
    );
  }
  return {
    ok: true,
    text: updated,
    edit: { range: { start: 0, end: text.length }, text: updated },
  };
}

export function createThread(
  text: string,
  targetOffset: number,
  options: MutationOptions & { id?: string; random?: () => number } = {}
): MutationResult {
  const parsed = parseThreads(text);
  if (parsed.errors.length > 0) {
    return invalidDocument(parsed.errors);
  }
  const threadRanges = parsed.threads.map((thread) => thread.range);
  const target = findMarkdownBlockAt(text, targetOffset, threadRanges);
  if (!target) {
    return failure(
      "invalid-target",
      "Place the cursor in or near a Markdown block outside a thread."
    );
  }
  const existingIds = new Set(parsed.threads.map((thread) => thread.id));
  const id = options.id ?? generateThreadId(existingIds, options.random);
  if (!id || existingIds.has(id) || !/^[0-9A-HJKMNP-TV-Z]{5}$/.test(id)) {
    return failure("id-exhausted", "Could not allocate a unique thread id.");
  }
  const lineEnding = newline(options);
  const block = buildThreadBlock(id, lineEnding, now(options));
  const updated = insertThreadBlockAt(text, target.end, block, lineEnding);
  if (updated === null) {
    return failure("invalid-target", "Could not insert the new thread.");
  }
  return {
    ok: true,
    text: updated,
    edit: { range: { start: 0, end: text.length }, text: updated },
    threadId: id,
  };
}

export function reanchorThread(
  text: string,
  threadId: string,
  targetOffset: number,
  options: MutationOptions = {}
): MutationResult {
  const targetThread = findMutableThread(text, threadId);
  if (!targetThread.ok) {
    return targetThread.result;
  }
  const ranges = targetThread.parsed.threads.map((thread) => thread.range);
  const target = findMarkdownBlockAt(text, targetOffset, ranges);
  if (!target) {
    return failure(
      "invalid-target",
      "Choose a Markdown block outside any thread block."
    );
  }
  const updated = moveThreadBlock(
    text,
    targetThread.thread,
    target,
    newline(options)
  );
  if (updated === text) {
    return failure("invalid-target", "Thread is already anchored there.");
  }
  return {
    ok: true,
    text: updated,
    edit: { range: { start: 0, end: text.length }, text: updated },
  };
}

function findMutableThread(
  text: string,
  threadId: string
):
  | {
      ok: true;
      thread: Thread;
      parsed: ReturnType<typeof parseThreads>;
    }
  | { ok: false; result: MutationResult } {
  const parsed = parseThreads(text);
  if (parsed.errors.length > 0) {
    return { ok: false, result: invalidDocument(parsed.errors) };
  }
  const matches = parsed.threads.filter((thread) => thread.id === threadId);
  if (matches.length === 0) {
    return {
      ok: false,
      result: failure("thread-not-found", `Thread ${threadId} was not found.`),
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      result: failure(
        "thread-ambiguous",
        `Thread id ${threadId} is ambiguous.`
      ),
    };
  }
  const thread = matches[0];
  if (thread.errors?.length || !thread.footer) {
    return {
      ok: false,
      result: failure(
        "thread-invalid",
        `Thread ${threadId} is malformed and cannot be changed.`,
        thread.errors
      ),
    };
  }
  return { ok: true, thread, parsed };
}

function validateHumanWriteState(thread: Thread): MutationResult | null {
  if (thread.status !== "open") {
    return failure(
      "illegal-transition",
      `Closed thread ${thread.id} cannot receive a human message.`
    );
  }
  return validateDraftTopology(thread);
}

function validateDraftTopology(thread: Thread): MutationResult | null {
  const drafts = thread.messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.role === "D");
  if (
    drafts.length > 1 ||
    (drafts.length === 1 && drafts[0].index !== thread.messages.length - 1)
  ) {
    return failure(
      "illegal-transition",
      `Thread ${thread.id} has an ambiguous draft history.`
    );
  }
  return null;
}

function appendMessageBlock(
  text: string,
  thread: Thread,
  role: MessageRole,
  body: string,
  options: MutationOptions
): MutationResult {
  if (!thread.footer) {
    return failure(
      "thread-invalid",
      `Thread ${thread.id} has no valid end marker.`
    );
  }
  const block = buildMessageBlock(
    thread.id,
    role,
    body,
    newline(options),
    now(options)
  );
  const range = { start: thread.footer.range.start, end: thread.footer.range.start };
  const needsLeadingNewline =
    range.start > 0 && text.slice(0, range.start).endsWith("\n") === false;
  const insertion = `${needsLeadingNewline ? newline(options) : ""}${block}${newline(options)}`;
  return replacement(text, range, insertion);
}

function replacement(text: string, range: Range, value: string): MutationResult {
  const updated = applyEdit(text, { range, text: value });
  return { ok: true, text: updated, edit: { range, text: value } };
}

function applyEdit(text: string, edit: MutationEdit): string {
  return (
    text.slice(0, edit.range.start) + edit.text + text.slice(edit.range.end)
  );
}

function threadDeletionEdit(
  text: string,
  threadRange: Range,
  lineEnding: "\n" | "\r\n"
): MutationEdit {
  let start = threadRange.start;
  let end = threadRange.end;
  while (start > 0 && /[ \t\r\n]/.test(text[start - 1])) {
    start -= 1;
  }
  while (end < text.length && /[ \t\r\n]/.test(text[end])) {
    end += 1;
  }

  const hasContentBefore = start > 0;
  const hasContentAfter = end < text.length;
  const replacementText =
    hasContentBefore && hasContentAfter
      ? `${lineEnding}${lineEnding}`
      : hasContentBefore
        ? lineEnding
        : "";
  return { range: { start, end }, text: replacementText };
}

function failure(
  code: MutationFailureCode,
  message: string,
  errors?: ParseError[]
): MutationResult {
  return { ok: false, code, message, errors };
}

function invalidDocument(errors: ParseError[]): MutationResult {
  const first = errors[0]?.message ?? "Unknown parse error.";
  const suffix = errors.length > 1 ? ` (${errors.length} errors)` : "";
  return failure(
    "document-invalid",
    `Fix malformed thread data before editing: ${first}${suffix}`,
    errors
  );
}

function newline(options: MutationOptions): "\n" | "\r\n" {
  return options.newline ?? "\n";
}

function now(options: MutationOptions): Date {
  return (options.now ?? (() => new Date()))();
}

function rebuildMessageBlock(
  raw: string,
  body: string,
  lineEnding: string,
  metaUpdates: Record<string, string>
): string {
  return rebuildCommentWithMeta(
    raw,
    metaUpdates,
    "CMT:MSG",
    lineEnding,
    body
  );
}

function rebuildCommentWithMeta(
  raw: string,
  updates: Record<string, string>,
  expectedPrefix: string,
  lineEnding: string,
  body?: string
): string {
  const start = raw.indexOf("<!--");
  const end = raw.lastIndexOf("-->");
  if (start === -1 || end <= start) {
    return raw;
  }
  const inner = raw.slice(start + 4, end);
  const lines = inner.split(/\r?\n/);
  const metaLine = updateMetaLine(lines[0] ?? "", updates, expectedPrefix);
  if (body !== undefined) {
    const normalized = body.replace(/\r?\n+$/g, "");
    return `<!--${metaLine}${lineEnding}${escapeCommentBody(normalized)}${lineEnding}-->`;
  }
  const rest = lines.slice(1).join(lineEnding);
  return `<!--${metaLine}${rest ? lineEnding + rest : ""}-->`;
}

function updateMetaLine(
  metaLine: string,
  updates: Record<string, string>,
  expectedPrefix: string
): string {
  if (Object.keys(updates).length === 0) {
    return metaLine;
  }
  const leading = metaLine.match(/^\s*/)?.[0] ?? "";
  const tokens = metaLine.trim().split(/\s+/);
  const prefix = tokens.shift() ?? expectedPrefix;
  const seen = new Set<string>();
  const rebuilt = tokens.map((token) => {
    const index = token.indexOf("=");
    const key = token.slice(0, index);
    if (updates[key] === undefined) {
      return token;
    }
    seen.add(key);
    return `${key}=${updates[key]}`;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      rebuilt.push(`${key}=${value}`);
    }
  }
  return `${leading}${prefix}${rebuilt.length ? ` ${rebuilt.join(" ")}` : ""}`;
}

function buildThreadBlock(
  id: string,
  lineEnding: string,
  timestamp: Date
): string {
  return [
    `<!-- CMT:THREAD id=${id} status=open ref=prev=1 -->`,
    `<!-- CMT:MSG id=${id} role=D ts=${timestamp.toISOString()}`,
    "",
    "-->",
    `<!-- /CMT:THREAD id=${id} -->`,
  ].join(lineEnding);
}

function buildMessageBlock(
  id: string,
  role: MessageRole,
  body: string,
  lineEnding: string,
  timestamp: Date
): string {
  const normalized = body.replace(/\r?\n+$/g, "");
  return `<!-- CMT:MSG id=${id} role=${role} ts=${timestamp.toISOString()}${lineEnding}${escapeCommentBody(normalized)}${lineEnding}-->`;
}

function escapeCommentBody(body: string): string {
  return body.replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;");
}

function generateThreadId(
  existingIds: Set<string>,
  random: () => number = Math.random
): string | undefined {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    let id = "";
    for (let index = 0; index < 5; index += 1) {
      id += alphabet.charAt(Math.floor(random() * alphabet.length));
    }
    if (!existingIds.has(id)) {
      return id;
    }
  }
  return undefined;
}
