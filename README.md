# Sentinel

***Rigorous, repeatable quality gates for any Claude Code project, in any language.***

Four Claude Code prompts that add a rigorous, repeatable quality and integration-completeness process to any code or design-based project — discovering what the project actually is, auditing its code and design quality, auditing what future changes need to touch, and then building and wiring in the automated checks that hold all of it in place going forward. Run in order; each one produces artifacts the next one reads.

## What's here

0. **`00-project-discovery.md`** — Run first. Detects what it can from the codebase (tech stack, surfaces, existing commit conventions, a design-token-file guess) and asks you directly for what it can't (starting with what you want the project called). Produces `PROJECT_PROFILE.md`, which fills in the `[PROJECT-SPECIFIC]` brackets in prompts 1 and 2 for you.
1. **`01-design-quality-audit.md`** — Reviews code quality and (for web UI projects) design consistency: a single source of truth for colors/spacing, responsive design, accessibility, and whether the interface reads as generic/AI-generated. Produces a report plus some direct, low-risk cleanup (stale comments, project documentation setup). Report-only for everything else.
2. **`02-integration-audit.md`** — Audits the project's own history to find every place a new feature/component has ever needed to touch, including places missed the first time. Produces `INTEGRATION_CHECKLIST.md`: a checklist plus a *description* of an automated gate check. Proposes, doesn't implement.
3. **`03-gate-check-implementation.md`** — Takes the proposals from both prior prompts, re-validates them against the current codebase, and actually builds and wires in the automated pre-commit checks. The only one of the four that implements rather than proposes.

## Order matters, but isn't rigid

Run them 0 → 1 → 2 → 3 for the best result — each one reads artifacts the previous ones produced (`PROJECT_PROFILE.md`, `CLAUDE.md`, `sentinel-notes/TODO.md`, `INTEGRATION_CHECKLIST.md`). That said, 1 and 2 will still run without 0 — you'll just fill in the brackets by hand instead of copying them from a profile — and 2 will run standalone and just skip what isn't there yet. 3 is different: it requires `INTEGRATION_CHECKLIST.md` to exist and will explicitly stop and tell you to run 2 first if it doesn't, rather than trying to proceed without it.

## How to use these

Two ways to run any of these prompts with Claude Code:

- **Copy-paste.** Copy the whole file and paste it into a Claude Code session in your project's directory — simpler than trying to trim it, and nothing in these files is harmful for CC to see even the human-facing framing.
- **Point CC at the file.** Place these files somewhere in your project (or reference them from wherever you keep them) and just ask Claude Code directly — e.g. "read `00-project-discovery.md` and run it" or "run the Sentinel discovery prompt in this repo." CC can read the file itself and follow it the same way.

Either works. The copy-paste route guarantees CC only sees the actual instructions, not the surrounding notes; pointing it at the file is faster if you're running several of these back to back.

## Before you start

- **Run prompt 0 first if you can — it fills in the brackets for you.** Prompts 1 and 2 have `[PROJECT-SPECIFIC]` brackets and a pre-flight checklist at the top of each file, and prompt 0 exists specifically to fill most of them in automatically via `PROJECT_PROFILE.md`. If you skip prompt 0, you're responsible for filling every bracket in by hand before running 1 or 2 — don't skip past this step assuming it'll sort itself out. A generic guess is worse than no guess; the prompts are written to have CC read your actual codebase instead.
- **These pause for input.** Prompt 0 asks directly what you want the project called, among other things it can't infer. Prompts 1 and 2 will stop partway through to ask you real questions (comment style, whether project docs should be local or shared, your commit message conventions) rather than assume an answer. Budget for being present, not just for handing it off and walking away.
- **These assume git, but don't require it.** The commit-hook and CLAUDE.md/README gate checks are built around git by default. If you don't use git (or any VCS), prompts 2 and 3 both account for this — 2 skips the commit-message conventions that wouldn't mean anything, and 3 builds a manual command you run yourself instead of a hook, with an explicit note that nothing will remind you to run it.
- **Prompt 1's design sections adapt to your domain, they don't assume web.** It identifies which of three cases fits before running: a full visual GUI (web, native mobile, desktop, game — the design sections apply closely), a presentational surface that isn't a conventional GUI (a CLI's color scheme, a document generator's formatting, an audio tool's preset design — most sections still apply once translated, but the purely visual ones like gradients/rounded corners don't), or no presentational dimension at all (a CLI with no design of its own, a backend service, a library — only the code-quality section applies).

## What you end up with

- `PROJECT_PROFILE.md` — the discovered/confirmed project context prompts 1 and 2 draw their bracketed values from
- `CLAUDE.md` — the project's authoritative internal record of its own features and architecture (kept current going forward by the gate check in prompt 3)
- `sentinel-notes/` — audit findings, a `TODO.md`, and design briefs for anything substantial
- `scratch/` — a gitignored, project-local spot for throwaway verification scripts, so permission rules can actually target a stable path
- `INTEGRATION_CHECKLIST.md` — the touchpoint checklist and gate-check description
- A `sentinel-exceptions` file — the documented, owned, expiring exceptions a gate check can accept instead of blocking forever or silently passing
- An actual pre-commit hook (or your project's equivalent CI step) enforcing it all

## License

MIT — see `LICENSE`. Anyone can use, modify, and redistribute these freely, including in closed-source or commercial work, as long as the original copyright notice is kept.
