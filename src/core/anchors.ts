import { Range, Thread } from "./types";

type LineInfo = {
  start: number;
  end: number;
  text: string;
  newline: string;
};

export type ResolvedReference = {
  type: "file" | "prev";
  ranges: Range[];
};

export function findMarkdownBlocks(
  text: string,
  exclusions: Range[] = []
): Range[] {
  const lines = getLines(text);
  const blocks: Range[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (
      isBlankLine(line.text) ||
      isCommentLine(line.text) ||
      lineOverlapsRanges(line, exclusions)
    ) {
      index += 1;
      continue;
    }

    const fence = getFenceMarker(line.text);
    if (fence) {
      const endLine = findFenceEnd(lines, index, fence);
      blocks.push(toRange(lines, index, endLine));
      index = endLine + 1;
      continue;
    }

    if (isHeadingLine(line.text)) {
      blocks.push(toRange(lines, index, index));
      index += 1;
      continue;
    }

    if (isBlockquoteLine(line.text)) {
      const endLine = consumeWhile(
        lines,
        index,
        exclusions,
        isBlockquoteLine
      );
      blocks.push(toRange(lines, index, endLine));
      index = endLine + 1;
      continue;
    }

    if (isListLine(line.text)) {
      const endLine = consumeWhile(
        lines,
        index,
        exclusions,
        isListLineOrContinuation
      );
      blocks.push(toRange(lines, index, endLine));
      index = endLine + 1;
      continue;
    }

    const endLine = consumeWhile(
      lines,
      index,
      exclusions,
      isParagraphLine
    );
    blocks.push(toRange(lines, index, endLine));
    index = endLine + 1;
  }

  return blocks;
}

export function findMarkdownBlockAt(
  text: string,
  offset: number,
  exclusions: Range[] = []
): Range | null {
  if (offset < 0 || offset > text.length || isOffsetInRanges(offset, exclusions)) {
    return null;
  }

  const blocks = findMarkdownBlocks(text, exclusions);
  const direct = blocks.find(
    (range) => offset >= range.start && offset < range.end
  );
  if (direct) {
    return direct;
  }

  const lines = getLines(text);
  let lineIndex = findLineIndex(lines, offset);
  while (lineIndex >= 0 && isBlankLine(lines[lineIndex].text)) {
    lineIndex -= 1;
  }
  if (lineIndex < 0) {
    return null;
  }

  const fallbackOffset = lines[lineIndex].start;
  return (
    blocks.find(
      (range) => fallbackOffset >= range.start && fallbackOffset < range.end
    ) ?? null
  );
}

export function resolveThreadReference(
  text: string,
  thread: Thread,
  allThreads: Thread[]
): ResolvedReference {
  if (thread.ref.type === "file") {
    return { type: "file", ranges: [{ start: 0, end: text.length }] };
  }

  const exclusions = allThreads.map((item) => item.range);
  const preceding = findMarkdownBlocks(text, exclusions).filter(
    (range) => range.end <= thread.range.start
  );
  return {
    type: "prev",
    ranges: preceding.slice(-thread.ref.count),
  };
}

export function isOffsetInRanges(offset: number, ranges: Range[]): boolean {
  return ranges.some((range) => offset >= range.start && offset < range.end);
}

export function moveThreadBlock(
  text: string,
  thread: Thread,
  target: Range,
  newline: "\n" | "\r\n"
): string {
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
  const prefix = trimTrailingBlankLines(textWithoutThread.slice(0, insertPos));
  const suffix = trimLeadingBlankLines(textWithoutThread.slice(insertPos));
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

export function insertThreadBlockAt(
  text: string,
  insertPos: number,
  threadBlock: string,
  newline: "\n" | "\r\n"
): string | null {
  if (insertPos < 0 || insertPos > text.length) {
    return null;
  }
  return joinWithSingleBlankLine(
    text.slice(0, insertPos),
    trimBlankLines(threadBlock),
    text.slice(insertPos),
    newline
  );
}

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
  return lines.findIndex(
    (line) => offset >= line.start && offset <= line.end + line.newline.length
  );
}

function toRange(lines: LineInfo[], startLine: number, endLine: number): Range {
  const end = lines[endLine];
  return {
    start: lines[startLine].start,
    end: end.end + end.newline.length,
  };
}

function consumeWhile(
  lines: LineInfo[],
  start: number,
  exclusions: Range[],
  predicate: (text: string) => boolean
): number {
  let end = start;
  while (
    end + 1 < lines.length &&
    !lineOverlapsRanges(lines[end + 1], exclusions) &&
    predicate(lines[end + 1].text)
  ) {
    end += 1;
  }
  return end;
}

function lineOverlapsRanges(line: LineInfo, ranges: Range[]): boolean {
  const lineEnd = line.end + line.newline.length;
  return ranges.some(
    (range) => line.start < range.end && lineEnd > range.start
  );
}

function getFenceMarker(
  text: string
): { character: "`" | "~"; length: number } | null {
  const match = text.match(/^ {0,3}(`{3,}|~{3,})/);
  return match
    ? {
        character: match[1][0] as "`" | "~",
        length: match[1].length,
      }
    : null;
}

function findFenceEnd(
  lines: LineInfo[],
  start: number,
  fence: { character: "`" | "~"; length: number }
): number {
  const closeRe = new RegExp(
    `^ {0,3}${fence.character === "`" ? "`" : "~"}{${fence.length},}\\s*$`
  );
  for (let index = start + 1; index < lines.length; index += 1) {
    if (closeRe.test(lines[index].text)) {
      return index;
    }
  }
  return lines.length - 1;
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
  return (
    !isBlankLine(text) &&
    (isListLine(text) || isListContinuationLine(text))
  );
}

function isParagraphLine(text: string): boolean {
  return (
    !isBlankLine(text) &&
    !isCommentLine(text) &&
    !isHeadingLine(text) &&
    !isBlockquoteLine(text) &&
    !isListLine(text) &&
    !getFenceMarker(text)
  );
}

function trimBlankLines(text: string): string {
  return trimLeadingBlankLines(trimTrailingBlankLines(text));
}

function trimLeadingBlankLines(text: string): string {
  let index = 0;
  while (index < text.length) {
    const newlineIndex = text.indexOf("\n", index);
    if (newlineIndex === -1) {
      break;
    }
    const line = text.slice(index, newlineIndex).replace(/\r$/, "");
    if (line.trim() !== "") {
      break;
    }
    index = newlineIndex + 1;
  }
  return text.slice(index);
}

function trimTrailingBlankLines(text: string): string {
  let index = text.length;
  while (index > 0) {
    const newlineIndex = text.lastIndexOf("\n", index - 1);
    const lineStart = newlineIndex === -1 ? 0 : newlineIndex + 1;
    const line = text.slice(lineStart, index).replace(/\r$/, "");
    if (line.trim() !== "") {
      break;
    }
    index = newlineIndex === -1 ? 0 : newlineIndex;
  }
  return text.slice(0, index);
}

function ensureEndsWithNewline(text: string, newline: string): string {
  return text.length === 0 || text.endsWith("\n") ? text : text + newline;
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
  result += trimBlankLines(block);
  result = ensureEndsWithNewline(result, newline);
  if (afterTrimmed.length > 0) {
    result += newline + afterTrimmed;
  }
  return result;
}
