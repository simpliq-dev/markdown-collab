---
name: manage-development-environment
description: "Protect the host operating system while adding or changing development runtimes, package managers, libraries, CLIs, validators, and native tools. Use when a dependency is missing, a project needs a new library or tool, setup instructions require installation, or Codex must choose between global, project-local, sidecar, container, or Mamba isolation. Prefer Mamba for Python environments. Do not trigger for dependencies already declared and available through the project's canonical commands."
---

# Manage the development environment

Keep the host clean without making ordinary development cumbersome. Make a judgment call from trust, scope, persistence, reproducibility, and removal cost; do not treat every install alike.

## Inspect before changing anything

1. Discover the repository's canonical runtime, package manager, manifests, locks, setup docs, and CI commands.
2. Check whether the required capability already exists in the project, an approved environment, or a bundled runtime. Do not mutate Codex-managed runtimes.
3. Classify the requirement as a host runtime/tool, project library, project CLI, Python tooling, or niche/native dependency.
4. Verify current package identity and installation guidance from the official publisher when an install is needed.
5. Use the established package manager. Do not let a convenient alternate manager rewrite manifests, locks, or workspace metadata.

## Choose the least persistent appropriate scope

Prefer these options in order:

1. Use an existing capability or the standard library.
2. Declare a project dependency in the canonical manifest and lockfile.
3. Create a reproducible project-associated sidecar environment or container.
4. Install a host-level tool only when it is genuinely useful across projects and sufficiently trusted.

Default to a sidecar when the choice is uncertain. Isolation is especially valuable for niche tools, one-project CLIs, fast-moving libraries, conflicting versions, opaque transitive dependencies, and software with a weak removal story.

## Judge host-level tools proportionately

A host-level install can be reasonable for foundational, top-tier tooling such as Git, GitHub CLI, a mainstream language runtime, or its standard package manager when all of these are true:

- the tool has broad cross-project value and a strong maintenance and security reputation;
- the package identity and source are official and unambiguous;
- installation is reversible and has a clear update and removal path;
- user scope is used when practical; and
- the install does not add an unnecessary service, driver, shell hook, or machine-wide configuration.

Do not convert examples into a permanent whitelist. Reassess publisher, distribution method, requested privileges, and current project need. Popularity alone is not a safety guarantee.

Require explicit human approval before elevation or any install that adds drivers, services, scheduled tasks, persistent shell/profile hooks, machine-wide `PATH` changes, security exclusions, background agents, broad registry changes, unclear telemetry or licensing, or difficult-to-reverse system state. A normal user-scope `PATH` entry made by an authorized top-tier tool's official installer does not require a second approval, but report it.

## Isolate project dependencies

- **Node.js:** Put libraries and project CLIs in the repository's package manifest and lockfile. Invoke CLIs through package scripts or the package manager's local executor. Avoid global npm packages for project-specific tooling.
- **Python:** Prefer one named Mamba environment per project toolchain. Track the canonical name, channels, Python version, and direct dependencies in `environment.yml`; prefer `conda-forge`; use a `pip` subsection only when the dependency is unavailable through the selected channels. Never install project requirements into base Python or a Codex-managed runtime.
- **.NET and other managed stacks:** Prefer local tool manifests, project dependency files, and lock mechanisms supplied by the established ecosystem over machine-global packages.
- **Niche or native tools:** Prefer a container or a dedicated, versioned project-associated tool directory outside Windows system locations. Keep downloaded binaries out of tracked source unless deliberate vendoring is part of the project. Track the source, version, checksum when available, invocation method, and removal path.

For Codex-created Mamba environments, use a stable name such as `codex-<project>-<purpose>-v<generation>`. Normalize a project identity that already begins with `codex-` so the prefix is not duplicated. Inspect existing environments before creating another, update from the tracked specification, and invoke automation with `mamba run -n <name> <command>` rather than relying on activation state. Increment the generation only for an intentionally incompatible replacement.

## Preserve reproducibility and cleanliness

- Inspect repository status before and after running a package manager; remove only artifacts created accidentally by the current operation.
- Keep direct dependencies and versions in the project's canonical declarative files. Do not rely on remembered interactive setup.
- Validate both the installed executable or import and the original task that required it.
- Document durable sidecars near their specification, including create, update, invoke, inventory, and remove commands.
- Reuse a valid project sidecar across sessions instead of creating disposable environments repeatedly.
- Treat environment or tool removal as destructive external state: verify its exact identity and project association before requesting or performing removal.

## Report the decision

State what was installed or declared, where it lives, why that scope was chosen, what persistent host changes occurred, how it was validated, and how it can be updated or removed. If installation is blocked, report the missing capability accurately rather than silently falling back to a different runtime or global package.
