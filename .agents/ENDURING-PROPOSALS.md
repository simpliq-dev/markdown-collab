# Enduring change proposals

Baseline framework: `Adaptive Vibe-Coding Framework v7`

This ledger records proposed cross-project learning separately from ordinary project evolution. A proposal is not promoted until a later human-reviewed round-up changes the target template or shared skill.

Status values: `proposed`, `accepted-for-round-up`, `deferred`, `rejected`, `promoted`.

## EP-001 - Archive superseded specifications and establish fresh active state

- Status: `proposed`
- Source framework: `Adaptive Vibe-Coding Framework v7`
- Project evidence: The inherited PRD, PRFAQ, transcript, and plan described the prototype but obscured the current Webview-first product direction. The human explicitly asked to preserve those documents as reference and keep current project state in a new artifact rather than continuing to mutate the old contract.
- Project-local implementation: [`docs/PROJECT.md`](../docs/PROJECT.md), [`docs/plans/active/webview-maturity.md`](../docs/plans/active/webview-maturity.md), and [`docs/archive/legacy-design/`](../docs/archive/legacy-design/).
- Proposed enduring change: When a prototype materially changes product direction, preserve superseded specifications unchanged in a clearly labelled archive and create the minimum fresh active project-state artifacts needed to express current intent, decisions, validation state, and next work. Do not keep patching a legacy contract until its historical and active meanings are ambiguous.
- Keep project-specific: The repository paths, Markdown comment grammar, Webview architecture, and the identities of the archived documents belong only to this project.
- Promotion target: `manage-project-state` plus kick-off/template guidance.
- Validation: The new active state has already supported resumption and links to the archived source material without treating it as current authority. Before promotion, confirm the pattern at a project or major-phase round-up and test whether another project benefits without creating unnecessary documentation.

## EP-002 - Protect the host with scope-aware development environments

- Status: `accepted-for-round-up`
- Source framework: `Adaptive Vibe-Coding Framework v7`
- Project evidence: File Safe demonstrated the value of a dedicated Mamba workflow for Python tooling. In this repository, a missing validator dependency exposed the temptation to modify a managed runtime, while invoking a different Node package manager generated unintended workspace metadata. The human explicitly established the broader preference: keep core Windows free from accumulating libraries and niche tools, allow well-judged top-tier tools such as GitHub CLI or mainstream package managers at host scope, and sidecar narrower dependencies.
- Project-local implementation: [`manage-development-environment`](skills/manage-development-environment/SKILL.md) generalizes the Mamba policy across development stacks, and `AGENTS.md` routes dependency and tooling decisions to it.
- Proposed enduring change: Add a general environment-management skill that chooses among existing capabilities, project-local dependencies, reproducible sidecars or containers, and trusted host-level tools. Prefer Mamba for Python; reserve host installs for broadly useful, reputable, reversible tools; and require human approval for privileged or deeply persistent system changes.
- Keep project-specific: The current TypeScript dependencies, the validator incident, generated pnpm files, repository paths, and any particular sidecar names or package versions must not transfer.
- Promotion target: A shared `manage-development-environment` skill plus the adaptive-workflow index in `AGENTS.md`; replace or subsume the narrower `manage-mamba-environment` skill after human-reviewed round-up.
- Validation: The policy has been checked against representative cases: GitHub CLI and mainstream runtimes may qualify for host scope; Node project CLIs stay local; Python libraries use a tracked Mamba environment; niche native binaries use a versioned sidecar or container; and drivers, services, or persistent machine changes require human approval. Forward-test the skill during real dependency additions before promotion.
