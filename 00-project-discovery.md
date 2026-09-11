# Sentinel: Project Discovery Prompt (Portable — run first, before 01)

Run this once, before the Design & Code Quality Audit. It's read-only against your codebase except for producing one file (`PROJECT_PROFILE.md`) — it detects what it reasonably can, asks you directly for what it can't, and hands the result to the two other prompts that have `[PROJECT-SPECIFIC]` brackets (Design & Code Quality Audit and Integration Audit) so those brackets don't have to be filled in by hand. The Gate-Check Implementation prompt has no brackets of its own, but can still reuse this profile's "existing automation" finding instead of re-detecting it from scratch. Re-run this if the project changes significantly (new surface added, major restructure) rather than trusting a stale profile.

---

## The prompt

You are gathering project context that will be used to fill in placeholder sections in three other prompts (Design & Code Quality Audit, Integration Audit, Gate-Check Implementation). Ground everything in what you actually find in the codebase — don't guess plausibly-sounding values. Where something is genuinely ambiguous or can't be reliably inferred, ask the user rather than picking for them.

### Part 1 — Detect from the codebase

- **Tech stack**: primary language(s), frameworks, and package manager/dependency manifest present (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.csproj`, `Gemfile`, `composer.json`, `build.gradle`, `Package.swift`, or equivalent).
- **Application surfaces**: enumerate distinct top-level folders/packages the same way the other prompts' own Scope sections do (user-facing app, admin panel, demo site, internal tooling, or independent packages in a monorepo) — list them plainly, and note whether they share subsystems or run independently.
- **Design/token system file**: search for likely candidates — a Tailwind config, a theme object, a CSS custom-properties block, a `design-tokens.json`, a platform color-asset catalog, or equivalent. This maps to Part 0 and Part 2's bracket in the Design & Code Quality Audit.
- **Recurring unit of work**: infer the closest analog to "the thing that gets added to this project" — a component, an API endpoint, a screen, a model field, a CLI subcommand. This maps to the bracket on line 1 of the Integration Audit's "The prompt" section and Part 1/Part 2's brackets there.
- **VCS status**: confirm this is a git repository (or note if not); commit count; number of distinct commit authors; whether an established commit-message convention is already in use (Conventional Commits prefixes, a consistent subject-length pattern, whether bodies are typically used) — if a real pattern already exists, note it explicitly so the Integration Audit's Part 4 can propose matching it instead of asking the user cold.
- **Version/release status**: a version field from a manifest file if present, and whether git tags/releases exist — note whether this reads as pre-release/experimental or an established public project.
- **Existing automation**: any git hooks, CI config, npm/package scripts, or a pre-commit framework already in place.
- **Existing docs and scaffolding**: whether `CLAUDE.md`, `README`, `LICENSE`, `.gitignore`, `sentinel-notes/`, and `scratch/` already exist, noted but not read in full here — the other prompts handle reading their actual content and won't recreate what's already there.

### Part 2 — Ask the user directly

- **What do you want this project called?** A repo or folder name is often not what someone actually wants used in generated docs and checklists — ask for the display name rather than defaulting to the folder name.
- If the design-token-file guess or the recurring-unit-of-work inference from Part 1 is genuinely ambiguous (more than one plausible candidate, or nothing found), confirm with the user rather than picking one silently.
- If surface enumeration is ambiguous (unclear whether two folders are genuinely separate surfaces or one surface split across directories), confirm rather than guessing.

### Deliverable

Produce `PROJECT_PROFILE.md` at the project root containing every value gathered above, labeled to match the exact bracket text they'll fill in:

- Project name (as the user wants it called)
- Tech stack / primary language(s)
- Application surfaces (list)
- Design/token system file (or "none found — flag as a gap" per the Design & Code Quality Audit's Part 2 guidance)
- Recurring unit of work (the phrase for the Integration Audit's brackets)
- VCS status, commit/contributor counts, and any detected commit-message convention
- Version/release status
- Existing automation detected
- Which of CLAUDE.md / README / LICENSE / .gitignore / sentinel-notes/ / scratch/ already exist

End with a short "how to use this" note: when running the Design & Code Quality Audit or Integration Audit prompts, replace their `[PROJECT-SPECIFIC]` brackets using the corresponding values above rather than guessing fresh.

Before treating this as complete, verify every field above has an actual value or an explicit "not found / ambiguous, needs user input" note — a blank field is not the same as a checked-and-empty one, and shouldn't be presented as if it were.
