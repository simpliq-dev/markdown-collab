const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const { parseThreads } = require("../dist/core/parser");
const { serializeThread } = require("../dist/core/serializer");
const {
  findMarkdownBlocks,
  resolveThreadReference,
} = require("../dist/core/anchors");
const {
  appendAgentMessage,
  createThread,
  reanchorThread,
  saveDraft,
  submitHumanMessage,
  toggleStatus,
} = require("../dist/core/mutations");
const {
  buildReviewModel,
  renderMarkdown,
} = require("../dist/review/model");

const fixedNow = () => new Date("2026-07-15T12:00:00.000Z");

function threadBlock({
  id = "K7Q9M",
  status = "open",
  ref = "prev=1",
  messageId = id,
  role = "H",
  body = "Please tighten this paragraph.",
  footerId = id,
} = {}) {
  return [
    `<!-- CMT:THREAD id=${id} status=${status} ref=${ref} -->`,
    `<!-- CMT:MSG id=${messageId} role=${role} ts=2026-01-17T09:03:00Z`,
    body,
    "-->",
    `<!-- /CMT:THREAD id=${footerId} -->`,
  ].join("\n");
}

function messages(result) {
  return result.errors.map((error) => error.message);
}

function threadWithMessages({
  id = "K7Q9M",
  status = "open",
  ref = "prev=1",
  messages: entries = [],
} = {}) {
  return [
    `<!-- CMT:THREAD id=${id} status=${status} ref=${ref} -->`,
    ...entries.flatMap(({ role, body, ts = "2026-01-17T09:03:00Z" }) => [
      `<!-- CMT:MSG id=${id} role=${role} ts=${ts}`,
      body,
      "-->",
    ]),
    `<!-- /CMT:THREAD id=${id} -->`,
  ].join("\n");
}

test("parses a valid pending thread and preserves it by default", () => {
  const source = threadBlock();
  const result = parseThreads(source);

  assert.equal(result.errors.length, 0);
  assert.equal(result.threads.length, 1);
  assert.equal(result.threads[0].pending, true);
  assert.equal(result.threads[0].messages[0].body, "Please tighten this paragraph.");
  assert.equal(serializeThread(result.threads[0]), source);
});

test("keeps the existing multi-thread Markdown fixture backward compatible", () => {
  const source = fs.readFileSync("tests/test_file1.md", "utf8");
  const result = parseThreads(source);

  assert.equal(result.errors.length, 0);
  assert.equal(result.threads.length, 5);
  assert.equal(
    result.threads.map((thread) => serializeThread(thread)).join("\n"),
    result.threads.map((thread) => thread.raw).join("\n")
  );
});

test("keeps the Collaborative Review showcase valid and multi-stage", () => {
  const source = fs.readFileSync("tests/review_showcase.md", "utf8");
  const parsed = parseThreads(source);
  const model = buildReviewModel(source, "review_showcase.md");

  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.threads.length, 4);
  assert.deepEqual(
    model.threads.map((thread) => thread.stage),
    ["answered", "waiting", "draft", "resolved"]
  );
  assert.equal(model.blocks.filter((block) => block.threadIds.length).length, 4);
});

test("unescapes comment delimiters in message bodies", () => {
  const result = parseThreads(
    threadBlock({ body: "Use &lt;!-- example --&gt; literally." })
  );

  assert.equal(result.errors.length, 0);
  assert.equal(result.threads[0].messages[0].body, "Use <!-- example --> literally.");
});

test("does not parse thread examples inside fenced code blocks", () => {
  const source = ["```md", threadBlock(), "```"].join("\n");
  const result = parseThreads(source);

  assert.equal(result.threads.length, 0);
  assert.equal(result.errors.length, 0);
});

test("flags duplicate thread ids on both threads", () => {
  const result = parseThreads([threadBlock(), threadBlock()].join("\n\n"));

  assert.match(messages(result).join("\n"), /Duplicate thread id 'K7Q9M'/);
  assert.ok(result.threads[0].errors?.length);
  assert.ok(result.threads[1].errors?.length);
});

test("flags message ids that do not match their thread", () => {
  const result = parseThreads(threadBlock({ messageId: "M3T9X" }));

  assert.match(
    messages(result).join("\n"),
    /Message id 'M3T9X' does not match thread id 'K7Q9M'/
  );
});

test("flags missing and mismatched footer ids", () => {
  const missing = parseThreads(
    threadBlock().replace("<!-- /CMT:THREAD id=K7Q9M -->", "<!-- /CMT:THREAD -->")
  );
  const mismatched = parseThreads(threadBlock({ footerId: "M3T9X" }));

  assert.match(messages(missing).join("\n"), /end marker missing id/i);
  assert.match(messages(mismatched).join("\n"), /does not match thread id/i);
});

test("rejects partially numeric prev references", () => {
  const result = parseThreads(threadBlock({ ref: "prev=1junk" }));

  assert.match(messages(result).join("\n"), /Invalid ref 'prev=1junk'/);
  assert.deepEqual(result.threads[0].ref, { type: "prev", count: 1 });
});

test("validates Crockford Base32 thread identifiers", () => {
  const result = parseThreads(threadBlock({ id: "O0000" }));

  assert.match(messages(result).join("\n"), /Invalid thread id 'O0000'/);
});

test("blocks every mutation while the document contains malformed thread data", () => {
  const malformed = threadBlock().replace(
    "<!-- /CMT:THREAD id=K7Q9M -->",
    "<!-- /CMT:THREAD id=M3T9X -->"
  );

  for (const result of [
    saveDraft(malformed, "K7Q9M", "Draft"),
    submitHumanMessage(malformed, "K7Q9M", "Submit"),
    appendAgentMessage(malformed, "K7Q9M", "Reply"),
    toggleStatus(malformed, "K7Q9M"),
    createThread(malformed, 0, { id: "M3T9X" }),
    reanchorThread(malformed, "K7Q9M", 0),
  ]) {
    assert.equal(result.ok, false);
    assert.equal(result.code, "document-invalid");
  }
});

test("enforces the legal draft, submit, and agent-response sequence", () => {
  const source = threadWithMessages({
    messages: [{ role: "A", body: "Previous response." }],
  });

  const drafted = saveDraft(source, "K7Q9M", "A new question.", {
    now: fixedNow,
  });
  assert.equal(drafted.ok, true);
  assert.equal(parseThreads(drafted.text).threads[0].messages.at(-1).role, "D");

  const submitted = submitHumanMessage(
    drafted.text,
    "K7Q9M",
    "A new question.",
    { now: fixedNow }
  );
  assert.equal(submitted.ok, true);
  const pending = parseThreads(submitted.text).threads[0];
  assert.equal(pending.messages.at(-1).role, "H");
  assert.equal(pending.pending, true);

  const answered = appendAgentMessage(
    submitted.text,
    "K7Q9M",
    "A considered response.",
    { now: fixedNow }
  );
  assert.equal(answered.ok, true);
  const resolved = parseThreads(answered.text).threads[0];
  assert.equal(resolved.messages.at(-1).role, "A");
  assert.equal(resolved.pending, false);
});

test("rejects duplicate human turns, unsolicited agent turns, and writes to closed threads", () => {
  const pending = threadWithMessages({
    messages: [{ role: "H", body: "Please respond." }],
  });
  const answered = threadWithMessages({
    messages: [{ role: "A", body: "Done." }],
  });
  const closed = threadWithMessages({
    status: "closed",
    messages: [{ role: "A", body: "Done." }],
  });

  assert.equal(saveDraft(pending, "K7Q9M", "Another").code, "illegal-transition");
  assert.equal(
    submitHumanMessage(pending, "K7Q9M", "Another").code,
    "illegal-transition"
  );
  assert.equal(
    appendAgentMessage(answered, "K7Q9M", "Unsolicited").code,
    "illegal-transition"
  );
  assert.equal(saveDraft(closed, "K7Q9M", "Draft").code, "illegal-transition");
});

test("rejects a draft that is no longer the final message", () => {
  const source = threadWithMessages({
    messages: [
      { role: "D", body: "Stale draft." },
      { role: "A", body: "Later response." },
    ],
  });

  const result = saveDraft(source, "K7Q9M", "Replacement");
  assert.equal(result.ok, false);
  assert.equal(result.code, "illegal-transition");
  assert.match(result.message, /ambiguous draft history/i);
});

test("uses targeted edits for message and status changes", () => {
  const source = threadWithMessages({
    messages: [{ role: "D", body: "Old draft." }],
  });
  const thread = parseThreads(source).threads[0];

  const drafted = saveDraft(source, "K7Q9M", "New draft.");
  assert.equal(drafted.ok, true);
  assert.deepEqual(drafted.edit.range, thread.messages[0].range);

  const toggled = toggleStatus(source, "K7Q9M");
  assert.equal(toggled.ok, true);
  assert.deepEqual(toggled.edit.range, thread.header.range);
  assert.equal(parseThreads(toggled.text).threads[0].status, "closed");
});

test("creates a deterministic valid thread and preserves CRLF endings", () => {
  const source = "First paragraph.\r\n\r\nSecond paragraph.\r\n";
  const created = createThread(source, source.indexOf("First"), {
    id: "M3T9X",
    newline: "\r\n",
    now: fixedNow,
  });

  assert.equal(created.ok, true);
  assert.equal(created.threadId, "M3T9X");
  assert.equal(/(^|[^\r])\n/.test(created.text), false);
  const parsed = parseThreads(created.text);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.threads[0].messages[0].role, "D");
});

test("preserves CRLF endings when changing a multiline thread header", () => {
  const source = threadWithMessages({
    messages: [{ role: "A", body: "Done." }],
  }).replace(
    "status=open ref=prev=1 -->",
    "status=open ref=prev=1\r\n--header-note\r\n-->"
  ).replace(/(?<!\r)\n/g, "\r\n");
  const toggled = toggleStatus(source, "K7Q9M", { newline: "\r\n" });

  assert.equal(toggled.ok, true);
  assert.equal(/(^|[^\r])\n/.test(toggled.text), false);
  assert.equal(parseThreads(toggled.text).threads[0].status, "closed");
});

test("resolves prev references using Markdown blocks and excludes thread ranges", () => {
  const source = [
    "# Heading",
    "",
    "A prose paragraph\ncontinued on another line.",
    "",
    "- first item\n  continuation\n- second item",
    "",
    threadWithMessages({ ref: "prev=2" }),
  ].join("\n");
  const parsed = parseThreads(source);
  const resolved = resolveThreadReference(
    source,
    parsed.threads[0],
    parsed.threads
  );

  assert.deepEqual(
    resolved.ranges.map((range) => source.slice(range.start, range.end).trim()),
    [
      "A prose paragraph\ncontinued on another line.",
      "- first item\n  continuation\n- second item",
    ]
  );
});

test("counts a fenced code region as one Markdown block", () => {
  const source = [
    "Before.",
    "",
    "```md",
    "line one",
    "line two",
    "```",
    "",
    "After.",
  ].join("\n");

  assert.deepEqual(
    findMarkdownBlocks(source).map((range) =>
      source.slice(range.start, range.end).trim()
    ),
    ["Before.", "```md\nline one\nline two\n```", "After."]
  );
});

test("re-anchors a thread beneath the selected Markdown block", () => {
  const source = [
    "First paragraph.",
    "",
    threadWithMessages({ messages: [{ role: "A", body: "History." }] }),
    "",
    "Second paragraph.",
  ].join("\n");
  const targetOffset = source.indexOf("Second paragraph.");
  const moved = reanchorThread(source, "K7Q9M", targetOffset);

  assert.equal(moved.ok, true);
  const parsed = parseThreads(moved.text);
  const resolved = resolveThreadReference(
    moved.text,
    parsed.threads[0],
    parsed.threads
  );
  assert.equal(
    moved.text.slice(resolved.ranges[0].start, resolved.ranges[0].end).trim(),
    "Second paragraph."
  );
});

test("builds a rendered review model with contextual thread markers", () => {
  const source = [
    "# Review document",
    "",
    "First paragraph.",
    "",
    threadWithMessages({
      messages: [
        { role: "H", body: "Could this be clearer?" },
      ],
    }),
    "",
    "Second paragraph.",
  ].join("\n");

  const model = buildReviewModel(source, "review.md", 7);

  assert.equal(model.documentVersion, 7);
  assert.equal(model.blocks.length, 3);
  assert.match(model.blocks[0].html, /<h1>Review document<\/h1>/);
  assert.deepEqual(model.blocks[1].threadIds, ["K7Q9M"]);
  assert.equal(model.threads[0].markerBlockId, model.blocks[1].id);
  assert.equal(model.threads[0].anchorText, "First paragraph.");
  assert.equal(model.threads[0].stage, "waiting");
  assert.equal(model.threads[0].canCompose, false);
});

test("keeps independent draft, waiting, and answered stages in the review model", () => {
  const source = [
    "One.",
    "",
    threadWithMessages({
      id: "K7Q9M",
      messages: [{ role: "D", body: "Draft one." }],
    }),
    "",
    "Two.",
    "",
    threadWithMessages({
      id: "M3T9X",
      messages: [{ role: "H", body: "Submitted two." }],
    }),
    "",
    "Three.",
    "",
    threadWithMessages({
      id: "58M96",
      messages: [{ role: "A", body: "Answered three." }],
    }),
  ].join("\n");

  const model = buildReviewModel(source, "review.md");

  assert.deepEqual(
    model.threads.map((thread) => [thread.id, thread.stage]),
    [
      ["K7Q9M", "draft"],
      ["M3T9X", "waiting"],
      ["58M96", "answered"],
    ]
  );
  assert.equal(model.counts.drafts, 1);
  assert.equal(model.counts.waiting, 1);
  assert.equal(model.threads[0].draftBody, "Draft one.");
  assert.equal(model.threads[0].messages.length, 0);
});

test("renders workspace Markdown without executing raw HTML or implicit images", () => {
  const html = renderMarkdown(
    '<script>alert("x")</script>\n\n![Remote](https://example.com/image.png)'
  );

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /review-image-placeholder/);
});

test("marks external links for explicit host handling and disables other schemes", () => {
  const html = renderMarkdown(
    "[Safe](https://example.com) [Unsafe](javascript:alert(1)) [Local](./file.md)"
  );

  assert.match(html, /data-external-url="https:\/\/example.com"/);
  assert.doesNotMatch(html, /(?:href|data-external-url)="javascript:/);
  assert.match(html, /review-link-disabled/);
});
