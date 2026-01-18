# Press Release / FAQ

## Press Release

**For immediate release**

### A multi-threaded chat partner for long-form writing—inside your document

Writers working on long-form Markdown documents struggle to iterate with AI without losing context, intent, or control. Inline feedback is fragmented, diffs are hard to trust, and conversations drift away from the text they reference.

Today we introduce a VS Code extension that embeds a **multi-threaded chat bot directly inside a Markdown document**. Each paragraph can host a rich, full-fidelity conversation with an AI writing partner—anchored to the text, tracked over time, and stored canonically in the file itself.

What changes: feedback becomes structured, stateful, and local to the prose. Writers can draft comments, submit precise instructions, review AI rewrites (diffs planned for v2), re-anchor discussions after edits, and close threads when resolved—without external databases or servers.

Why now: long-form AI-assisted writing has matured, but tooling hasn’t caught up. Writers need calm, trustworthy collaboration that scales across chapters and revisions while staying compatible with Git, Markdown, and existing editors.

---

## FAQ

### Who is this for?
Primary users are writers and editors producing long-form Markdown (e.g., books, essays, technical docs) who use AI as a collaborative writing partner inside VS Code.

### What problem does it solve?
It enables **contextual, stateful AI collaboration** tied directly to document text, avoiding detached chats, lost rationale, and unsafe rewrites.

### How is data stored?
All state (threads, drafts, submissions, agent replies, status) lives **inside the Markdown file** using structured HTML comments. There is no external comments database.

### Does the agent control anything?
No. Humans own thread creation, anchoring, submission, closure, and re-opening. The agent only responds to submitted human instructions and may rewrite text when authorized.

### How does the agent know what to act on?
The agent scans documents for **open threads whose latest human message is submitted**. Closed threads are ignored.

### How do rewrites stay safe?
In v1, safety relies on explicit, in-file thread context and manual review. Diff and changed-region highlighting are planned for v2.

### Can threads be re-opened?
Yes. Closed threads are parked **in situ** (collapsed where they are) and can be re-opened explicitly by the human.

### Why not move closed threads to an archive?
Moving threads breaks anchoring, creates merge pain, and fragments context. Parking is visual, not structural.

### Why VS Code?
It offers first-class Markdown editing, Git integration, and extensibility without requiring a local server. A Webview-based UI provides the needed richness.

### Is a local webserver required?
No.

### Pricing / Ops?
Not specified. Out of scope for v1.

### Why this might fail
- If the UI becomes noisy or distracting.
- If future diff visibility is insufficient to build trust.
- If re-anchoring is cumbersome.
- If agent responses become verbose without strong ordering.

---

## Constraints
- Single canonical store: the Markdown file.
- No external databases or servers.
- VS Code extension architecture.
- Full-fidelity chat per thread; do not degrade response quality to fit space.

## Out of Scope
- Real-time multi-user collaboration.
- Automatic anchor drift repair.
- Agent-initiated thread management.
- External web app or Electron app.
- Pricing, billing, or accounts.

## Success Metrics
1. **Rewrite Trust**: ≥90% of agent rewrites are accepted without manual rollback (measured via user action telemetry if available).
2. **Resolution Velocity**: Median time from thread submission to closure decreases vs baseline workflow.
3. **Adoption**: Users create and resolve ≥10 threads per document on average without UI abandonment.
