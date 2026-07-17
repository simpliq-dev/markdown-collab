import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import {
  findMarkdownBlocks,
  resolveThreadReference,
} from "../core/anchors";
import { parseThreads } from "../core/parser";
import { ParseError, Range, Thread, ThreadMessage } from "../core/types";

export type ReviewStage =
  | "open"
  | "draft"
  | "waiting"
  | "answered"
  | "resolved";

export type ReviewBlock = {
  id: string;
  range: Range;
  html: string;
  text: string;
  threadIds: string[];
};

export type ReviewMessage = {
  role: "human" | "agent" | "draft";
  author: "You" | "Agent" | "Draft";
  timestamp?: string;
  html: string;
  text: string;
};

export type ReviewThread = {
  id: string;
  status: "open" | "closed";
  stage: ReviewStage;
  pending: boolean;
  canCompose: boolean;
  draftBody: string;
  anchorBlockIds: string[];
  markerBlockId?: string;
  anchorText: string;
  messages: ReviewMessage[];
};

export type ReviewModel = {
  fileName: string;
  documentVersion: number;
  blocks: ReviewBlock[];
  threads: ReviewThread[];
  errors: Array<{ message: string; threadId?: string }>;
  counts: {
    open: number;
    waiting: number;
    drafts: number;
    resolved: number;
  };
};

const markdown = createMarkdownRenderer();

export function buildReviewModel(
  text: string,
  fileName: string,
  documentVersion = 0
): ReviewModel {
  const parsed = parseThreads(text);
  const exclusions = parsed.threads.map((thread) => thread.range);
  const blocks = findMarkdownBlocks(text, exclusions).map((range, index) => ({
    id: `block-${index + 1}`,
    range,
    html: renderMarkdown(text.slice(range.start, range.end)),
    text: summarizeMarkdown(text.slice(range.start, range.end), 280),
    threadIds: [] as string[],
  }));

  const threads = parsed.threads.map((thread) =>
    buildThread(text, thread, parsed.threads, blocks)
  );

  for (const thread of threads) {
    if (!thread.markerBlockId) {
      continue;
    }
    const block = blocks.find((item) => item.id === thread.markerBlockId);
    block?.threadIds.push(thread.id);
  }

  return {
    fileName,
    documentVersion,
    blocks,
    threads,
    errors: parsed.errors.map(toReviewError),
    counts: {
      open: threads.filter((thread) => thread.status === "open").length,
      waiting: threads.filter((thread) => thread.stage === "waiting").length,
      drafts: threads.filter((thread) => thread.stage === "draft").length,
      resolved: threads.filter((thread) => thread.stage === "resolved").length,
    },
  };
}

export function buildAgentReviewPrompt(model: ReviewModel): string | undefined {
  const count = model.counts.waiting;
  if (count === 0 || model.errors.length > 0) {
    return undefined;
  }
  const fileName = model.fileName.replace(/\\/g, "/");
  const subject = count === 1 ? "1 comment is" : `${count} comments are`;
  const action =
    count === 1
      ? "Process it."
      : "Process them together as one coherent turn.";
  return `Use the markdown-collab skill. ${subject} ready for review in ${fileName}. ${action} Preserve every existing Markdown Collab conversation unless I explicitly ask you to delete it.`;
}

export function renderMarkdown(source: string): string {
  return markdown.render(source.trim());
}

function buildThread(
  text: string,
  thread: Thread,
  allThreads: Thread[],
  blocks: ReviewBlock[]
): ReviewThread {
  const resolved = resolveThreadReference(text, thread, allThreads);
  const anchorBlocks =
    resolved.type === "file"
      ? []
      : blocks.filter((block) =>
          resolved.ranges.some((range) => rangesOverlap(block.range, range))
        );
  const last = thread.messages[thread.messages.length - 1];
  const draftBody = last?.role === "D" ? last.body : "";

  return {
    id: thread.id,
    status: thread.status,
    stage: stageFor(thread),
    pending: thread.pending,
    canCompose: thread.status === "open" && !thread.pending,
    draftBody,
    anchorBlockIds: anchorBlocks.map((block) => block.id),
    markerBlockId: anchorBlocks.at(-1)?.id,
    anchorText:
      resolved.type === "file"
        ? "Whole document"
        : summarizeMarkdown(
            resolved.ranges
              .map((range) => text.slice(range.start, range.end))
              .join("\n\n"),
            220
          ),
    messages: thread.messages
      .filter((message) => message.role !== "D")
      .map(toReviewMessage),
  };
}

function stageFor(thread: Thread): ReviewStage {
  if (thread.status === "closed") {
    return "resolved";
  }
  if (thread.pending) {
    return "waiting";
  }
  const last = thread.messages[thread.messages.length - 1];
  if (last?.role === "D") {
    return "draft";
  }
  if (last?.role === "A") {
    return "answered";
  }
  return "open";
}

function toReviewMessage(message: ThreadMessage): ReviewMessage {
  const role =
    message.role === "H"
      ? "human"
      : message.role === "A"
        ? "agent"
        : "draft";
  const author =
    message.role === "H" ? "You" : message.role === "A" ? "Agent" : "Draft";
  return {
    role,
    author,
    timestamp: message.ts,
    html: renderMarkdown(message.body),
    text: message.body,
  };
}

function createMarkdownRenderer(): MarkdownIt {
  const renderer = new MarkdownIt({
    html: false,
    breaks: false,
    linkify: true,
    typographer: false,
  });

  renderer.renderer.rules.image = (tokens, index) => {
    const token = tokens[index];
    const label = token.content || token.attrGet("alt") || "Image";
    return `<span class="review-image-placeholder" role="img" aria-label="${escapeAttribute(
      label
    )}">Image: ${escapeHtml(label)}</span>`;
  };

  renderer.renderer.rules.link_open = (tokens, index) => {
    const href = tokens[index].attrGet("href") ?? "";
    if (!isUserInitiatedExternalLink(href)) {
      return '<span class="review-link-disabled">';
    }
    return `<a href="#" data-external-url="${escapeAttribute(href)}">`;
  };

  renderer.renderer.rules.link_close = (tokens, index) => {
    const openIndex = findMatchingOpenLink(tokens, index);
    const href = openIndex >= 0 ? tokens[openIndex].attrGet("href") ?? "" : "";
    return isUserInitiatedExternalLink(href) ? "</a>" : "</span>";
  };

  return renderer;
}

function findMatchingOpenLink(tokens: Token[], closeIndex: number): number {
  let depth = 0;
  for (let index = closeIndex - 1; index >= 0; index -= 1) {
    if (tokens[index].type === "link_close") {
      depth += 1;
    } else if (tokens[index].type === "link_open") {
      if (depth === 0) {
        return index;
      }
      depth -= 1;
    }
  }
  return -1;
}

function isUserInitiatedExternalLink(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function summarizeMarkdown(source: string, maxLength: number): string {
  const normalized = source
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-+*]|\d+[.)])\s+/gm, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function rangesOverlap(left: Range, right: Range): boolean {
  return left.start < right.end && left.end > right.start;
}

function toReviewError(error: ParseError): {
  message: string;
  threadId?: string;
} {
  return { message: error.message, threadId: error.threadId };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
