import { Thread, ThreadMessage, ThreadRef } from "./types";

export type SerializeOptions = {
  preserveRaw?: boolean;
};

export function serializeThread(
  thread: Thread,
  options: SerializeOptions = {}
): string {
  const preserveRaw =
    options.preserveRaw !== false && !!thread.raw && !thread.dirty;
  if (preserveRaw && thread.raw) {
    return thread.raw;
  }

  const header = serializeHeader(thread);
  const messageBlocks = thread.messages.map(serializeMessage).join("\n");
  const footer = serializeFooter(thread);

  if (messageBlocks) {
    return `${header}\n${messageBlocks}\n${footer}`;
  }
  return `${header}\n${footer}`;
}

export function serializeThreads(
  text: string,
  threads: Thread[],
  options: SerializeOptions = {}
): string {
  if (threads.length === 0) {
    return text;
  }

  const sorted = [...threads].sort((a, b) => a.range.start - b.range.start);
  let cursor = 0;
  const parts: string[] = [];

  for (const thread of sorted) {
    parts.push(text.slice(cursor, thread.range.start));
    parts.push(serializeThread(thread, options));
    cursor = thread.range.end;
  }

  parts.push(text.slice(cursor));
  return parts.join("");
}

function serializeHeader(thread: Thread): string {
  const ref = formatRef(thread.ref);
  const refPart = ref ? ` ref=${ref}` : "";
  return `<!-- CMT:THREAD id=${thread.id} status=${thread.status}${refPart} -->`;
}

function serializeFooter(thread: Thread): string {
  return `<!-- /CMT:THREAD id=${thread.id} -->`;
}

function serializeMessage(message: ThreadMessage): string {
  const parts = [`id=${message.id}`, `role=${message.role}`];
  if (message.ts) {
    parts.push(`ts=${message.ts}`);
  }
  const body = escapeCommentBody(message.body || "");
  return `<!-- CMT:MSG ${parts.join(" ")}\n${body}\n-->`;
}

function formatRef(ref: ThreadRef): string {
  if (ref.type === "file") {
    return "file";
  }
  return `prev=${ref.count}`;
}

function escapeCommentBody(body: string): string {
  return body.replace(/<!--/g, "&lt;!--").replace(/-->/g, "--&gt;");
}
