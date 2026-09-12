# Sentinel

***Rigorous, repeatable quality gates for any AI coding agent, any project, any language.***

Four prompts that add a rigorous, repeatable quality and integration-completeness process to any code or design-based project — discovering what the project actually is, auditing its code and design quality, auditing what future changes need to touch, and then building and wiring in the automated checks that hold all of it in place going forward. Run in order; each one produces artifacts the next one reads.

This is closer to a guided setup process than a one-shot audit. Along the way, your AI coding agent will ask you directly for preferences — commit message style, whether project docs stay local or get shared with a team, comment philosophy — and those answers become permanent, enforced parts of your project's tooling once the last prompt builds the actual gate check. Treat the questions as real decisions, not incidental prompts to click through.

**Requires an AI coding agent with file-system and shell access, initialized in the project.** These prompts are written to work with any agent that can read a codebase, run shell commands, and create git commits — confirmed compatible with Claude Code and OpenAI Codex, and likely to work with similar tools (Cursor, Gemini CLI, Windsurf, GitHub Copilot) since the prompts identify which tool they're running under and adapt file/config names accordingly, rather than assuming one product. Two things vary by tool and get identified automatically at the start of each prompt: the persistent project-context file (`AGENTS.md` is the vendor-neutral name most tools use, including Codex; Claude Code calls the same thing `CLAUDE.md`), and the permission/configuration mechanism (`.claude/settings.json` for Claude Code; `~/.codex/config.toml` plus an in-session `/permissions` command for Codex CLI; check your own tool's docs if it's something else). Start your agent from the project's own directory (or otherwise point an existing session at that project) before running any of these; they won't work correctly pasted into a session with no access to the actual codebase.

## What's here

0. **`00-project-discovery.md`** — Run first. Detects what it can from the codebase (tech stack, surfaces, existing commit conventions, a design-token-file guess) and asks you directly for what it can't (starting with what you want the project called). Produces `PROJECT_PROFILE.md`, which fills in the `[PROJECT-SPECIFIC]` brackets in prompts 1 and 2 for you.
1. **`01-design-quality-audit.md`** — Reviews code quality and (for web UI projects) design consistency: a single source of truth for colors/spacing, responsive design, accessibility, and whether the interface reads as generic/AI-generated. Produces a report plus some direct, low-risk cleanup (stale comments, project documentation setup). Report-only for everything else.
2. **`02-integration-audit.md`** — Audits the project's own history to find every place a new feature/component has ever needed to touch, including places missed the first time. Produces `INTEGRATION_CHECKLIST.md`: a checklist plus a *description* of an automated gate check. Proposes, doesn't implement.
3. **`03-gate-check-implementation.md`** — Takes the proposals from both prior prompts, re-validates them against the current codebase, and actually builds and wires in the automated pre-commit checks. The only one of the four that implements rather than proposes.

## Order matters, but isn't rigid

Run them 0 → 1 → 2 → 3 for the best result — each one reads artifacts the previous ones produced (`PROJECT_PROFILE.md`, `AGENTS.md`, `sentinel-notes/TODO.md`, `INTEGRATION_CHECKLIST.md`). That said, 1 and 2 will still run without 0 — you'll just fill in the brackets by hand instead of copying them from a profile — and 2 will run standalone and just skip what isn't there yet. 3 is different: it requires `INTEGRATION_CHECKLIST.md` to exist and will explicitly stop and tell you to run 2 first if it doesn't, rather than trying to proceed without it.

## How to use these

Two ways to run any of these prompts with your AI coding agent:

- **Copy-paste.** Copy the whole file and paste it into a session in your project's directory — simpler than trying to trim it, and nothing in these files is harmful for the agent to see even the human-facing framing.
- **Point the agent at the file.** Place these files somewhere in your project (or reference them from wherever you keep them) and just ask directly — e.g. "read `00-project-discovery.md` and run it" or "run the Sentinel discovery prompt in this repo." Most agents can read the file itself and follow it the same way.

Either works. The copy-paste route guarantees the agent only sees the actual instructions, not the surrounding notes; pointing it at the file is faster if you're running several of these back to back.

## Before you start

- **Run prompt 0 first if you can — it fills in the brackets for you, with a reviewable record of what it inferred.** Prompts 1 and 2 have `[PROJECT-SPECIFIC]` brackets and a pre-flight checklist at the top of each file. If you skip prompt 0 and don't fill them in by hand either, your agent will typically read the project and infer reasonable values on its own rather than leave them meaningless — that's not a failure mode, just a less reliable one than a deliberate answer, since nobody reviewed the guess and it isn't recorded anywhere the way `PROJECT_PROFILE.md` would be. Filling them in (via prompt 0 or by hand) is still the better default, but forgetting isn't the emergency it might sound like.
- **These pause for input, and the answers stick.** Prompt 0 asks directly what you want the project called, among other things it can't infer. Prompts 1 and 2 will stop partway through to ask real questions — comment style, whether project docs should be local or shared, your commit message conventions and commit granularity — and whatever you answer gets carried into the actual enforced hook prompt 3 builds. This isn't the same as an agent asking a clarifying question mid-conversation that only affects the current reply; it's closer to configuring a setting that governs every future commit. Budget for being present, not just for handing it off and walking away.
- **These assume git, but don't require it.** The commit-hook and AGENTS.md/README gate checks are built around git by default. If you don't use git (or any VCS), prompts 2 and 3 both account for this — 2 skips the commit-message conventions that wouldn't mean anything, and 3 builds a manual command you run yourself instead of a hook, with an explicit note that nothing will remind you to run it.
- **These identify which agent and tool-specific conventions apply before doing anything else.** Each prompt checks `PROJECT_PROFILE.md` first, or asks directly if it's not there — which coding agent this is, what it calls its context file, how it handles permissions, and whether it has any auto-attribution behavior (like Claude Code's optional "Generated with Claude Code" commit line) that needs accounting for. This is what makes the same four files work across different tools instead of silently assuming one.
- **Prompt 1's design sections adapt to your domain, they don't assume web.** It identifies which of three cases fits before running: a full visual GUI (web, native mobile, desktop, game — the design sections apply closely), a presentational surface that isn't a conventional GUI (a CLI's color scheme, a document generator's formatting, an audio tool's preset design — most sections still apply once translated, but the purely visual ones like gradients/rounded corners don't), or no presentational dimension at all (a CLI with no design of its own, a backend service, a library — only the code-quality section applies).

## What you end up with

- `PROJECT_PROFILE.md` — the discovered/confirmed project context prompts 1 and 2 draw their bracketed values from, including which agent and tool-specific conventions apply
- `AGENTS.md` (or `CLAUDE.md`, if that's what your agent uses) — the project's authoritative internal record of its own features and architecture (kept current going forward by the gate check in prompt 3)
- `sentinel-notes/` — audit findings, a `TODO.md`, and design briefs for anything substantial
- `scratch/` — a gitignored, project-local spot for throwaway verification scripts, so permission rules can actually target a stable path
- `INTEGRATION_CHECKLIST.md` — the touchpoint checklist and gate-check description
- A `sentinel-exceptions` file — the documented, owned, expiring exceptions a gate check can accept instead of blocking forever or silently passing
- An actual pre-commit hook (or your project's equivalent CI step) enforcing it all, plus a separate full-repo scan mode for catching drift the incremental hook can't see — history predating the checks, manual edits outside a commit, interactions between separately-valid commits — triggered automatically via a CI schedule or a `pre-push` hook rather than run on every commit, since a full scan is too slow to pay for on every commit without discouraging small commits or training people to bypass it

## License

MIT — see `LICENSE`. Anyone can use, modify, and redistribute these freely, including in closed-source or commercial work, as long as the original copyright notice is kept.
