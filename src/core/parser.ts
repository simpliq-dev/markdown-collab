import {
  MessageRole,
  ParseError,
  ParseResult,
  Thread,
  ThreadFooter,
  ThreadHeader,
  ThreadMessage,
  ThreadRef,
  ThreadStatus,
} from "./types";

const THREAD_HEADER = "CMT:THREAD";
const THREAD_FOOTER = "/CMT:THREAD";
const MESSAGE_HEADER = "CMT:MSG";

type CommentMatch = {
  start: number;
  end: number;
  raw: string;
};

export function parseThreads(text: string): ParseResult {
  const threads: Thread[] = [];
  const errors: ParseError[] = [];

  const headerRe = /<!--\s*CMT:THREAD\b/g;
  let match: RegExpExecArray | null;

  while ((match = headerRe.exec(text)) !== null) {
    const headerStart = match.index;
    const headerEnd = findCommentEnd(text, headerStart);
    if (headerEnd === -1) {
      errors.push({
        message: "Unterminated thread header comment.",
        range: { start: headerStart, end: headerStart + 4 },
      });
      break;
    }

    const headerRaw = text.slice(headerStart, headerEnd);
    const headerResult = parseThreadHeader(headerRaw, {
      start: headerStart,
      end: headerEnd,
    });
    errors.push(...headerResult.errors);

    const header = headerResult.header;

    const footerMatch = findThreadFooter(text, headerEnd, header.id);
    const threadEnd = footerMatch ? footerMatch.end : headerEnd;
    const footer = footerMatch ? footerMatch.footer : undefined;

    const threadErrors = footerMatch
      ? headerResult.errors
      : headerResult.errors.concat([
          {
            message: "Missing thread end marker.",
            range: { start: headerStart, end: headerEnd },
            threadId: header.id || undefined,
          },
        ]);

    const messages = parseThreadMessages(
      text,
      headerEnd,
      footerMatch ? footerMatch.start : threadEnd,
      header.id,
      errors
    );

    const pending =
      header.status === "open" &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "H";

    const raw = text.slice(headerStart, threadEnd);

    threads.push({
      id: header.id,
      status: header.status,
      ref: header.ref,
      messages,
      pending,
      header,
      footer,
      raw,
      range: { start: headerStart, end: threadEnd },
      errors: threadErrors.length > 0 ? threadErrors : undefined,
    });

    headerRe.lastIndex = threadEnd;
  }

  return { threads, errors };
}

function parseThreadHeader(
  raw: string,
  range: { start: number; end: number }
): { header: ThreadHeader; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const inner = extractCommentInner(raw);
  const line = inner.split(/\r?\n/)[0] || "";
  const meta = parseMetaLine(line, THREAD_HEADER, errors, range);

  const id = meta.id || "";
  if (!id) {
    errors.push({
      message: "Thread header missing id.",
      range,
    });
  }

  const status = parseStatus(meta.status, errors, range);
  const ref = parseRef(meta.ref, errors, range);

  return {
    header: {
      id,
      status,
      ref,
      raw,
      range,
      meta,
    },
    errors,
  };
}

function parseThreadMessages(
  text: string,
  start: number,
  end: number,
  threadId: string,
  errors: ParseError[]
): ThreadMessage[] {
  const messages: ThreadMessage[] = [];
  const msgRe = /<!--\s*CMT:MSG\b/g;
  msgRe.lastIndex = start;

  let match: RegExpExecArray | null;
  while ((match = msgRe.exec(text)) !== null) {
    if (match.index >= end) {
      break;
    }

    const msgStart = match.index;
    const msgEnd = findCommentEnd(text, msgStart);
    if (msgEnd === -1 || msgEnd > end) {
      errors.push({
        message: "Unterminated message comment.",
        range: { start: msgStart, end: msgStart + 4 },
        threadId: threadId || undefined,
      });
      break;
    }

    const raw = text.slice(msgStart, msgEnd);
    const inner = extractCommentInner(raw);
    const lines = inner.split(/\r?\n/);
    const metaLine = (lines[0] || "").trim();
    let bodyLines = lines.slice(1);
    if (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
      bodyLines = bodyLines.slice(0, -1);
    }
    const bodyRaw = bodyLines.join("\n");

    const messageErrors: ParseError[] = [];
    const meta = parseMetaLine(
      metaLine,
      MESSAGE_HEADER,
      messageErrors,
      { start: msgStart, end: msgEnd }
    );

    const id = meta.id || threadId || "";
    if (!meta.id) {
      messageErrors.push({
        message: "Message missing id; defaulting to thread id.",
        range: { start: msgStart, end: msgEnd },
        threadId: threadId || undefined,
      });
    }

    const role = parseRole(meta.role, messageErrors, {
      start: msgStart,
      end: msgEnd,
    });

    if (role) {
      messages.push({
        id,
        role,
        ts: meta.ts,
        body: unescapeCommentBody(bodyRaw),
        rawBody: bodyRaw,
        raw,
        range: { start: msgStart, end: msgEnd },
        meta,
      });
    }

    errors.push(...messageErrors);
    msgRe.lastIndex = msgEnd;
  }

  return messages;
}

function findThreadFooter(
  text: string,
  start: number,
  threadId: string
): { start: number; end: number; footer: ThreadFooter } | null {
  const footerRe = /<!--\s*\/CMT:THREAD\b/g;
  footerRe.lastIndex = start;

  let match: RegExpExecArray | null;
  while ((match = footerRe.exec(text)) !== null) {
    const footerStart = match.index;
    const footerEnd = findCommentEnd(text, footerStart);
    if (footerEnd === -1) {
      return null;
    }

    const raw = text.slice(footerStart, footerEnd);
    const inner = extractCommentInner(raw);
    const line = inner.split(/\r?\n/)[0] || "";
    const footerErrors: ParseError[] = [];
    const meta = parseMetaLine(line, THREAD_FOOTER, footerErrors, {
      start: footerStart,
      end: footerEnd,
    });
    const id = meta.id;

    if (!threadId || !id || id === threadId) {
      return {
        start: footerStart,
        end: footerEnd,
        footer: {
          id,
          raw,
          range: { start: footerStart, end: footerEnd },
          meta,
        },
      };
    }
  }

  return null;
}

function parseMetaLine(
  line: string,
  expectedPrefix: string,
  errors: ParseError[],
  range: { start: number; end: number }
): Record<string, string> {
  const meta: Record<string, string> = {};
  const trimmed = line.trim();

  if (!trimmed.startsWith(expectedPrefix)) {
    errors.push({
      message: `Expected ${expectedPrefix} header.`,
      range,
    });
    return meta;
  }

  const tokens = trimmed.split(/\s+/).slice(1);
  for (const token of tokens) {
    const idx = token.indexOf("=");
    if (idx <= 0) {
      errors.push({
        message: `Malformed token '${token}' in metadata line.`,
        range,
      });
      continue;
    }
    const key = token.slice(0, idx);
    const value = token.slice(idx + 1);
    if (!key) {
      errors.push({
        message: "Empty metadata key.",
        range,
      });
      continue;
    }
    meta[key] = value;
  }

  return meta;
}

function parseStatus(
  value: string | undefined,
  errors: ParseError[],
  range: { start: number; end: number }
): ThreadStatus {
  if (value === "open" || value === "closed") {
    return value;
  }
  if (value) {
    errors.push({
      message: `Invalid status '${value}'.`,
      range,
    });
  } else {
    errors.push({
      message: "Thread header missing status.",
      range,
    });
  }
  return "open";
}

function parseRole(
  value: string | undefined,
  errors: ParseError[],
  range: { start: number; end: number }
): MessageRole | null {
  if (value === "D" || value === "H" || value === "A") {
    return value;
  }
  if (value) {
    errors.push({
      message: `Invalid role '${value}'.`,
      range,
    });
  } else {
    errors.push({
      message: "Message missing role.",
      range,
    });
  }
  return null;
}

function parseRef(
  value: string | undefined,
  errors: ParseError[],
  range: { start: number; end: number }
): ThreadRef {
  if (!value) {
    return { type: "prev", count: 1 };
  }
  if (value === "file") {
    return { type: "file" };
  }
  if (value.startsWith("prev=")) {
    const count = Number.parseInt(value.slice("prev=".length), 10);
    if (!Number.isNaN(count) && count > 0) {
      return { type: "prev", count };
    }
    errors.push({
      message: `Invalid ref '${value}'.`,
      range,
    });
    return { type: "prev", count: 1 };
  }

  errors.push({
    message: `Unknown ref '${value}'.`,
    range,
  });
  return { type: "prev", count: 1 };
}

function extractCommentInner(raw: string): string {
  const withoutStart = raw.startsWith("<!--") ? raw.slice(4) : raw;
  const withoutEnd = withoutStart.endsWith("-->")
    ? withoutStart.slice(0, -3)
    : withoutStart;
  return withoutEnd;
}

function findCommentEnd(text: string, start: number): number {
  const endIdx = text.indexOf("-->", start);
  if (endIdx === -1) {
    return -1;
  }
  return endIdx + 3;
}

function unescapeCommentBody(body: string): string {
  return body.replace(/&lt;!--/g, "<!--").replace(/--&gt;/g, "-->");
}
