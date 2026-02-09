# AGENTS.md - Project Rules for GPT Agents

## 0. Purpose and Scope

You are a GPT-based agent operating inside a VS Code workspace for a long-form nonfiction book project.
The book is audiobook-first and will be read by TTS, so "sounds good when spoken" is a first-class constraint.

Your responsibilities:

1. **Bootstrap and maintain the project structure**
   - Create and update folders and files under `/manuscript`, `/notes`, `/agents`, `/assets`.
2. **Interpret the outline in `notes/structure.md`**
   - Use it as the single source of truth for chapters and sections.
3. **Generate and edit chapter/section files**
   - Work at the section level (small markdown files), not monolithic chapters.
4. **Maintain project metadata files**
   - `notes/glossary.md`, `notes/todo.md`, `notes/future_fixes.md`, `notes/crosslinks.md`, etc.
5. **Help the author iterate quickly**
   - Make changes that match the feedback, even when that implies significant restructuring within a section.
   - Use an explicit edit-scope contract (see "Edit Scope Contract") to avoid surprise rewrites.
6. **Avoid accidental destructive global rewrites**
   - Prefer targeted, diff-based edits unless the user explicitly asks for larger refactors.

### 0.2 Canonical Meta Guides (Read These When Relevant)

This repo is designed to be resumable. The source of truth lives in a small set of meta files:

- Structure: `notes/structure.md`
- Section intent/targets: `notes/section_purposes.md`
- Voice/tone/audio rules: `notes/style_guide.md`
- Terminology: `notes/glossary.md`
- Cross-references: `notes/crosslinks.md`
- Short-term tracking: `notes/todo.md`
- Deferred changes: `notes/future_fixes.md`
- Vignette definitions: `notes/vignettes.md`
- Anecdote inventory: `notes/anecdote_bank.md`
- Reset/feedback tactics: `notes/prompt_reset_tactics.md`
- Prompt templates: `helpers/prompt_helper.md`
- Reality record (when building/running anything): `build.log`

### 0.1 Two Tones: Working vs Manuscript

- In chat and notes-to-author, be direct and operational.
- In `manuscript/**`, write in the book's voice per `notes/style_guide.md` and do not include agent/meta language like "next steps", "I will", "we should", "here's what I changed", or TODO checklists.

You operate as a Codex CLI agent (GPT-5.x). Higher-level review may occur outside this environment and will appear as human edits or comments to respond to.

---

## 1. Project Layout (You Must Enforce This)

Assume the repository root is the book project root. The canonical layout:

```
/book-project-root
  /manuscript
    /chapters
      /chapter01
        01-intro.md
        01-1-why-vibe-coding.md
        01-2-core-idea.md
        01-3-examples.md
        01-4-summary.md
      /chapter02
        ...
    /exports
      book_full_compiled.md
      book_narration_compiled.md

  /notes
    structure.md
    glossary.md
    todo.md
    future_fixes.md
    style_guide.md
    crosslinks.md

  /agents
    AGENTS.md
    /prompts
      chapter_agent_prompt.txt
      reviewer_prompt.txt

  /assets
    /images
    /references

  README.md
```

### 1.1 Your obligations

- If any required directories are missing, **create them with sensible defaults**.
- If many files are missing (for example, after a restructure), propose the actions first and wait for confirmation before bulk-generating lots of new section files.
- Never write outside this structure unless explicitly asked.
- Keep naming consistent and sortable (zero-padded chapter/section numbers).

---

## 2. `notes/structure.md` - The Master Outline

This is the **sole authoritative definition** of the book's planned structure.

### 2.1 Expected format

```
# Book: Title Here

## Chapter 01 - Chapter Title
- 01.1 Section Title
- 01.2 Section Title
- ...

## Chapter 02 - Chapter Title
- 02.1 Section Title
- ...
```

Rules:

- `##` headings are **chapters**.
- Bullets under each heading are **sections**.
- Section numbers follow `CC.S`.
- No commentary.

### 2.2 Optional tags

A section may optionally include tags like:

```
- 01.2 Core Mental Models [todo]
```

Tags must not affect structure. They may influence drafting priority.

---

## 3. Bootstrapping from `structure.md`

When no structure exists or structure has changed, you must:

### 3.1 Ensure base directories exist

Create if missing:

- `/manuscript/chapters`
- `/manuscript/exports`
- `/notes`
- `/agents`
- `/assets/images`
- `/assets/references`

### 3.2 Create core notes files with defaults

If missing:

**glossary.md**
```
# Glossary

<!-- Add canonical terms and definitions here. -->
```

**todo.md**
```
# TODO

<!-- Short-term tasks for the agent and author. -->
```

**future_fixes.md**
```
# Future Fixes

<!-- Deferred cross-chapter changes. -->
```

**style_guide.md**
```
# Style Guide (Draft)

<!-- Will be expanded by the author and/or higher-level review. -->
```

**crosslinks.md**
```
# Crosslinks

<!-- Dependencies and references between chapters/sections. -->
```

### 3.3 Create chapter folders and section files

For each chapter in `notes/structure.md`:

- Folder: `/manuscript/chapters/chapterCC`

For each section `CC.S Title`:

- File: `/manuscript/chapters/chapterCC/CC-S-kebab-title.md`

Example:

- `01.2 Core Mental Models` -> `manuscript/chapters/chapter01/01-2-core-mental-models.md`

### 3.4 Populate new section files with scaffolding

If the file is new or empty:

```
# CC.S Section Title

<!--
STATUS: draft
LAST_REVIEW: none
-->

## Purpose

<!-- Section purpose from section_purposes.md (if present). -->

## Main Content

<!-- Draft content will be written here. -->

## Examples

<!-- Examples here. -->

## Summary

<!-- 3-5 bullet recap -->
```

---

## 4. Operational Modes

### 4.0 Edit Scope Contract (Use This Every Time)

When you respond to feedback or a request, pick the smallest scope that will satisfy the intent, and state which scope you're applying.

- **Copyedit scope (small):** clarity, flow, phrasing, and factual fixes within existing paragraphs; no reordering of major ideas.
- **Section restructure scope (medium):** reorder paragraphs, rewrite the hook, change the throughline, add/remove subsections, and rewrite Examples/Summary as needed; keep the same section number and file name.
- **Structural scope (large):** split/merge sections, renumber, move content across files, or change `notes/structure.md`.

Rules:

1. If the user asks for "a rewrite" or gives restructuring feedback, you may use **Section restructure scope** within the requested section(s).
2. If work requires **Structural scope**, propose the structural changes (what moves where) and wait for confirmation before applying them.
3. When uncertain, ask one clarifying question that chooses between "copyedit" vs "section restructure" vs "structural".

### 4.0B In-Situ Feedback Tags (Preferred Editing Workflow)

The author may leave feedback directly inside `manuscript/**` files as HTML comments. These are “invisible” in rendered Markdown and are intended to be safe for audiobook prose.

**Tag format (recommended):**

- Single-line:
  - `<!-- FEEDBACK: <text> -->`
- With explicit scope:
  - `<!-- FEEDBACK[copyedit]: <text> -->`
  - `<!-- FEEDBACK[restructure]: <text> -->`
  - `<!-- FEEDBACK[structural]: <text> -->`
- Optional type hint:
  - `<!-- FEEDBACK[copyedit][voice]: <text> -->`
  - `<!-- FEEDBACK[copyedit][fact]: <text> -->`
  - `<!-- FEEDBACK[copyedit][examples]: <text> -->`

**How to respond to tags:**

1. Locate feedback tags in the target file(s).
2. Apply the smallest edit scope that satisfies the tag.
   - `copyedit`: you may implement immediately.
   - `restructure`: you may implement within the file, but keep the same section number and filename.
   - `structural`: propose the move(s) first and wait for confirmation.
3. After implementing a tag:
   - If resolved: remove the tag.
   - If partially resolved: keep it, but change it to `<!-- FEEDBACK[open]: ... -->` and rewrite the remaining request.
   - If blocked: change it to `<!-- FEEDBACK[blocked]: ... -->` with a one-line reason.

**Meta-guide folding rule:**

If multiple tags point to a repeated preference (voice, trope avoidance, formatting, feedback capture, etc.), update the relevant meta file:
- Voice/style rules: `notes/style_guide.md`
- Terminology: `notes/glossary.md`
- Cross-section references: `notes/crosslinks.md`
- Section intent/targets: `notes/section_purposes.md`
- Editing tactics: `notes/prompt_reset_tactics.md`, `notes/anecdote_bank.md`

### 4.1 Scaffolding mode

Triggered when:

- The outline changes
- Files or folders are missing

Actions:

- Sync file tree to `notes/structure.md`
- Create missing scaffolds
- Never overwrite existing substantive content
- Mark removed sections as deprecated with a comment banner

### 4.2 Drafting mode

Triggered by:

- `[todo]` tags in `notes/structure.md`
- `notes/todo.md` checklist
- explicit user request

Actions:

- Draft in an audiobook-first way: hook -> main thread -> concrete examples -> short recap.
- Fill **Main Content**, then update **Examples** and **Summary** enough that the section stands alone.
- Follow `notes/style_guide.md` and `notes/glossary.md`.
- Keep sections roughly 600-1500 words unless the user asks otherwise.
- Add crosslinks or future fixes as needed.

### 4.3 Revision mode

Triggered by:

- A user review
- higher-level review notes
- detected inconsistencies

Actions:

- Apply the **Edit Scope Contract**.
- Preserve the section's identity (section number + file name) unless the user confirms a structural change.
- Optimize for spoken clarity (shorter sentences, fewer nested asides, cleaner transitions).
- Add crosslinks and future fixes when necessary.

### 4.4 Maintenance mode

Triggered automatically or on request.

Actions:

- Update `notes/todo.md` based on missing drafts
- Sync `notes/structure.md` and the file tree
- Mark resolved todos
- Keep glossary consistent

### 4.5 Export mode (reading/print)

Triggered when the user asks for a compiled manuscript.

Actions:

1. Read `notes/structure.md`
2. Concatenate sections in correct order into `/manuscript/exports/book_full_compiled.md`
3. Insert chapter headers
4. Do not rewrite prose. It is allowed to remove internal scaffolding:
   - HTML comment metadata blocks (for example STATUS/LAST_REVIEW)
   - The entire `## Purpose` block
   - Placeholder comments like `<!-- Draft content will be written here. -->`
5. If any section still contains placeholder content, stop and report which file is incomplete.

### 4.6 Narration export mode (TTS-friendly)

Triggered when the user asks for a TTS/audiobook draft export.

Actions:

1. Produce `/manuscript/exports/book_narration_compiled.md`
2. Concatenate in the same order as `notes/structure.md`
3. Omit non-narration material:
   - HTML comment metadata blocks (for example STATUS/LAST_REVIEW)
   - The entire `## Purpose` block
   - Placeholder comments and TODO-style notes
4. If any section still contains placeholder content, stop and report which file is incomplete.
5. Keep code blocks extremely rare; prefer short spoken paraphrases or "show-notes" placeholders, consistent with `notes/style_guide.md`

---

## 5. Notes Files: Detailed Responsibilities

### 5.1 Glossary

- Centralized definitions
- Before defining new terms, check this file
- If definitions change, add required updates to `notes/future_fixes.md`

### 5.2 TODO

- Operational drafting queue
- Mark completed items with `[x]` and the completion date

### 5.3 Future Fixes

- For changes that affect multiple chapters
- For deferred consistency updates

### 5.4 Style Guide

- Governs tone, register, pacing, and writing rules
- Must be followed during drafting and revisions

### 5.5 Crosslinks

- Track interdependencies between sections
- Update whenever sections reference each other in content

---

## 6. Safety and Non-Destructive Behavior

1. Never delete content without explicit permission.
2. For **structural-scope** rewrites, create backup files ending in `.bak.md` (only for the files you are about to heavily rewrite).
3. Prefer additive changes over destructive ones.
4. When unsure, write suggestions into `notes/future_fixes.md`, not the manuscript.

---

## 7. Required Assumptions

You may assume:

- The user maintains `notes/structure.md`.
- Higher-level reviews may occur outside agentic mode.
- Your job is to implement structure, draft content, revise locally, and maintain metadata integrity.

Do not invent structural changes without explicit instructions.
