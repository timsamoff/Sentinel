# Sentinel: Project Discovery Prompt (Portable — run first, before 01)

Run this once, before the Design & Code Quality Audit. It's read-only against your codebase except for producing one file (`PROJECT_PROFILE.md`) — it detects what it reasonably can, asks you directly for what it can't, and hands the result to the two other prompts that have `[PROJECT-SPECIFIC]` brackets (Design & Code Quality Audit and Integration Audit) so those brackets don't have to be filled in by hand. The Gate-Check Implementation prompt has no brackets of its own, but can still reuse this profile's "existing automation" finding instead of re-detecting it from scratch. Re-run this if the project changes significantly (new surface added, major restructure) rather than trusting a stale profile.

---

## The prompt

You are gathering project context that will be used to fill in placeholder sections in three other prompts (Design & Code Quality Audit, Integration Audit, Gate-Check Implementation). Ground everything in what you actually find in the codebase and this session — don't guess plausibly-sounding values, and don't draw on assumptions from other projects, other conversations, or general memory of the user's habits, even if you have some. Every project gets evaluated fresh, on its own files and this session's answers, regardless of what you might recall about how the same user has worked elsewhere. Where something is genuinely ambiguous or can't be reliably inferred, ask the user rather than picking for them.

If you notice something incidental and out-of-scope for this discovery pass while investigating — a license file that contradicts the manifest's declared license, a tracked file that's also gitignored, anything else that isn't what Part 1 or Part 2 below actually asks for — don't just mention it once and move on. `TODO.md` doesn't exist yet at this point in the sequence (the Design & Code Quality Audit creates it), so record it in `PROJECT_PROFILE.md`'s own notes instead, under a clearly labeled "flagged for follow-up" section, and say so plainly rather than burying it in passing commentary. This is what lets it survive into `TODO.md` once that file exists — see the Design & Code Quality Audit's Part 0, which checks for exactly this.

**Agent identification.** This prompt is written to work with any AI coding agent capable of reading a codebase and running shell commands — Claude Code, OpenAI Codex, or similar tools. Before doing anything else, identify which one you are and note two things about your own environment: your persistent project-context file (this document calls it `AGENTS.md`, the vendor-neutral name used by Codex, Cursor, Gemini CLI, Windsurf, GitHub Copilot, and others; Claude Code specifically calls the same thing `CLAUDE.md` — write to whichever one your tool actually reads, and record which name you used in `PROJECT_PROFILE.md` so later prompts write to the same file); and your permission/configuration mechanism (Claude Code uses `.claude/settings.json`; Codex CLI uses `~/.codex/config.toml` plus an in-session `/permissions` command; other tools vary — note whichever applies here, since later prompts reference it).

When you ask the user anything, phrase it in plain language a non-specialist could follow. Say what's actually being decided before naming any internal mechanism, file, or convention involved — the person commissioned this process, they shouldn't need to already track its internal workings to answer a question about their own project.

### Part 1 — Detect from the codebase

- **Tech stack**: primary language(s), frameworks, and package manager/dependency manifest present (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.csproj`, `Gemfile`, `composer.json`, `build.gradle`, `Package.swift`, or equivalent).
- **Declared project name**: check whether the project already states its own name somewhere — a manifest's `name` field (`package.json`, `pyproject.toml`, `Cargo.toml`, `composer.json`), a `Package.swift` name, a `.csproj` assembly name, or a top-level README's title. If one exists, that's the candidate to confirm with the user in Part 2, not something to ask about from a blank slate.
- **Application surfaces**: enumerate distinct top-level folders/packages the same way the other prompts' own Scope sections do (user-facing app, admin panel, demo site, internal tooling, or independent packages in a monorepo) — list them plainly, and note whether they share subsystems or run independently.
- **Design/token system file**: search for likely candidates — a Tailwind config, a theme object, a CSS custom-properties block, a `design-tokens.json`, a platform color-asset catalog, or equivalent. This maps to Part 0 and Part 2's bracket in the Design & Code Quality Audit.
- **Recurring unit of work**: infer the closest analog to "the thing that gets added to this project" — a component, an API endpoint, a screen, a model field, a CLI subcommand. This maps to the bracket on line 1 of the Integration Audit's "The prompt" section and Part 1/Part 2's brackets there.
- **VCS status**: confirm this is a git repository (or note if not); commit count; number of distinct commit authors; whether an established commit-message convention is already in use (Conventional Commits prefixes, a consistent subject-length pattern, whether bodies are typically used) — if a real pattern already exists, note it explicitly so the Integration Audit's Part 4 can propose matching it instead of asking the user cold.
- **Version/release status**: a version field from a manifest file if present, and whether git tags/releases exist — note whether this reads as pre-release/experimental or an established public project.
- **Existing automation**: any git hooks, CI config, npm/package scripts, or a pre-commit framework already in place.
- **Existing docs and scaffolding**: whether `AGENTS.md`, `README`, `LICENSE`, `.gitignore`, `sentinel-notes/`, and `scratch/` already exist, noted but not read in full here — the other prompts handle reading their actual content and won't recreate what's already there.
- **Existing design documentation**: check common conventions for a software/technical design document — `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, a `docs/adr/` directory of individual decision records, or a doc linked from the README. If one exists, note its path — the Design & Code Quality Audit uses it as grounding for checking whether the actual implementation still matches documented intent, which is a different question from internal consistency.

### Part 2 — Ask the user directly

- **What do you want this project called?** If Part 1 found a declared name (a manifest field, a README title), propose that as the default and just confirm it rather than asking from a blank slate — "Found `X` as the declared name — use that, or would you prefer something else?" A repo or folder name on its own is often not what someone actually wants used in generated docs and checklists, so if nothing was found and only a folder/repo name is available, don't default to it silently — ask.
- If the design-token-file guess or the recurring-unit-of-work inference from Part 1 is genuinely ambiguous (more than one plausible candidate, or nothing found), confirm with the user rather than picking one silently.
- If surface enumeration is ambiguous (unclear whether two folders are genuinely separate surfaces or one surface split across directories), confirm rather than guessing.

### Deliverable

Produce `PROJECT_PROFILE.md` at the project root containing every value gathered above, labeled to match the exact bracket text they'll fill in:

- AI coding agent in use, and the resulting names for this project's context file and permission mechanism (per the agent identification above)
- Project name (as the user wants it called)
- Tech stack / primary language(s)
- Application surfaces (list)
- Design/token system file (or "none found — flag as a gap" per the Design & Code Quality Audit's Part 2 guidance)
- Recurring unit of work (the phrase for the Integration Audit's brackets)
- VCS status, commit/contributor counts, and any detected commit-message convention
- Version/release status
- Existing automation detected
- Which of AGENTS.md / README / LICENSE / .gitignore / sentinel-notes/ / scratch/ already exist
- Path to an existing design document, if one was found (or "none found")
- A "flagged for follow-up" section listing anything incidental and out-of-scope noticed during discovery (per the note above), so it isn't lost before `TODO.md` exists to hold it properly

End with a short "how to use this" note: when running the Design & Code Quality Audit or Integration Audit prompts, replace their `[PROJECT-SPECIFIC]` brackets using the corresponding values above rather than guessing fresh. Also tell the user plainly what the next step in the sequence is: run the Design & Code Quality Audit prompt next.

Before treating this as complete, verify every field above has an actual value or an explicit "not found / ambiguous, needs user input" note — a blank field is not the same as a checked-and-empty one, and shouldn't be presented as if it were.

This run leaves `PROJECT_PROFILE.md` as a new, untracked file if git is in use — that's fine as-is, and this prompt shouldn't push toward committing it. No commit-message convention exists yet at this point in the sequence (the Integration Audit's Part 4 is what establishes one), so this is structurally the wrong moment to write a commit message at all — there's nothing yet to write it well *to*. If the user asks directly to have it committed, that's their call to make on their own terms, but don't raise the question proactively the way later prompts do once real conventions exist to follow.
