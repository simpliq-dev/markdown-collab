# codex-collab — Screenshot Sample

This file is designed to generate **multiple threads** in the codex-collab sidebar for screenshots.

Open this file in VS Code, then go to **Explorer → Threads**.

---

## Section 1 — Intro paragraph

We’re drafting a short product blurb.

Goal: make the copy clear, avoid hype, and keep it honest about scope.

<!-- CMT:THREAD id=7F2KQ status=open ref=prev=1 -->
<!-- CMT:MSG id=7F2KQ role=H ts=2026-02-08T21:10:00.000Z
Can you rewrite this intro to be clearer and less salesy?
Keep it to 2–3 sentences.
-->
<!-- CMT:MSG id=7F2KQ role=A ts=2026-02-08T21:12:30.000Z
Sure. Here’s a tighter version:

“codex-collab adds file-backed threads to Markdown. Start a thread on any paragraph and keep a small conversation next to your document while the content stays in the file.”

If you want it even more plain: “It’s a sidebar view for comment threads stored as HTML comments in Markdown.”
-->
<!-- CMT:MSG id=7F2KQ role=D ts=2026-02-08T21:15:00.000Z
Draft follow-up: can we add one line that reassures users there are no external services involved?
-->
<!-- /CMT:THREAD id=7F2KQ -->

---

## Section 2 — A list block

Things to verify before publishing:

- The extension builds cleanly
- README looks good on Marketplace
- Icons and screenshots are ready

<!-- CMT:THREAD id=3R9VX status=open ref=prev=2 -->
<!-- CMT:MSG id=3R9VX role=H ts=2026-02-08T21:20:00.000Z
For this checklist, what are the top 3 “easy to forget” Marketplace items?
-->
<!-- CMT:MSG id=3R9VX role=A ts=2026-02-08T21:22:00.000Z
Top 3 easy-to-forget items:

1) A real publisher ID (not “local”) and a PAT that has Marketplace permissions.
2) An icon + at least 1–2 screenshots referenced correctly in README.
3) Packaging hygiene: a .vscodeignore (or package.json files allowlist) so you don’t ship junk.
-->
<!-- /CMT:THREAD id=3R9VX -->

---

## Section 3 — Blockquote + “pending” example

> This is an example quote block.
> It’s here to make the file look more realistic.

We also want one thread that is **pending** (last message role is `H`).

<!-- CMT:THREAD id=9QW6D status=open ref=prev=1 -->
<!-- CMT:MSG id=9QW6D role=H ts=2026-02-08T21:30:00.000Z
Can you propose a better name for the sidebar view than “Threads”?
Maybe something that reads like “Comments”, but doesn’t imply GitHub.
-->
<!-- /CMT:THREAD id=9QW6D -->

---

## Section 4 — Code fence (for realism)

```ts
// This code block is only here to make the document feel “real”.
// codex-collab threads should still work fine around fenced blocks.
export function add(a: number, b: number) {
  return a + b;
}
```

---

## Section 5 — Closed thread example

This paragraph has a closed thread beneath it.

<!-- CMT:THREAD id=K5T8N status=closed ref=file -->
<!-- CMT:MSG id=K5T8N role=H ts=2026-02-08T21:40:00.000Z
We’ve shipped v0.0.1. Let’s park any feature requests for v0.0.2.
-->
<!-- CMT:MSG id=K5T8N role=A ts=2026-02-08T21:41:10.000Z
Acknowledged. Captured candidates:
- Optional diff/highlighting (v2)
- Better thread summary / snippet controls
- Export threads to a separate view
-->
<!-- /CMT:THREAD id=K5T8N -->

---

## Notes

- Thread IDs are 5 characters.
- Status is `open` or `closed`.
- Roles:
  - `D` = Draft
  - `H` = Human
  - `A` = Agent

(If you need a screenshot with *lots* of threads, duplicate any of the thread blocks above with a new ID.)
