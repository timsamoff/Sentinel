# Sentinel

**Version 1.0**

***Rigorous, repeatable quality gates for any AI coding agent, any project, any language.***

### Contents

- [What it does](#what-it-does)
- [What's here](#whats-here)
- [Order matters, but isn't rigid](#order-matters-but-isnt-rigid)
- [How to use these](#how-to-use-these)
- [Before you start](#before-you-start)
- [Upgrading to a new version](#upgrading-to-a-new-version-of-sentinel)
- [What you end up with](#what-you-end-up-with)
- [Limitations](#limitations)
- [License](#license)

## What it does

Four prompts that add a rigorous, repeatable quality and integration-completeness process to any code or design-based project: discover what the project actually is, audit its code and design quality, audit what future changes need to touch, then build and wire in the automated checks that hold it all in place. Run in order; each one produces artifacts the next one reads. A thin orchestrator (`sentinel-init.md`) can run all four in sequence for you — see [How to use these](#how-to-use-these) — but it doesn't skip or soften any of their individual confirmation points.

### A guided setup, not a one-shot audit

Your agent will ask you directly for preferences along the way (commit style, whether docs stay local or shared, comment philosophy), and those answers become permanent, enforced parts of your project's tooling once prompt 3 builds the gate check. Treat the questions as real decisions, not prompts to click through.

### Front-loaded cost, cheap to run after

Setup is the expensive part: prompts 0-3 read your actual codebase and history to ground every decision, which costs real time and tokens once. What comes out the other end is a diff-scoped pre-commit hook plus a periodic full-repo scan — ordinary commits are checked against a small, targeted diff, not re-audited against the whole project every time. You pay the audit cost once, deliberately, in exchange for enforcement that stays cheap on every commit after.

**Requires an AI coding agent with file-system and shell access, initialized in the project.** Confirmed compatible with Claude Code and OpenAI Codex; likely compatible with similar tools (Cursor, Gemini CLI, Windsurf, GitHub Copilot), since each prompt identifies which tool it's running under and adapts accordingly rather than assuming one product. Two things vary by tool and get auto-detected: the persistent context file (`AGENTS.md` for most tools, `CLAUDE.md` for Claude Code) and the permission/config mechanism (`.claude/settings.json` for Claude Code, `~/.codex/config.toml` + `/permissions` for Codex).

**This repo is a source to copy from, not a place to work.** The actual prompt files live in the `Sentinel-Prompts/` folder — copy that whole folder into your own project (anywhere in it; the prompts don't care where they sit), then start your agent from your project's own root directory, not from inside `Sentinel-Prompts/`. Everything the prompts produce (`PROJECT_PROFILE.md`, `AGENTS.md`, `sentinel-notes/`, the gate-check hook, all of it) lands in your project's root the same as if you'd typed the prompts in yourself — `Sentinel-Prompts/` is just the delivery container for the instructions, not a workspace of its own.

## What's here

Everything below lives inside `Sentinel-Prompts/` — copy the whole folder, not individual files, so nothing gets left behind.

**`Sentinel-Prompts/sentinel-init.md`** — a thin orchestrator that runs 0 → 1 → 2 → 3 in sequence for you, stopping at each stage's own confirmation points exactly as if you'd pasted them one at a time. The recommended way to run the suite — see [How to use these](#how-to-use-these). Deliberately unnumbered: it isn't a fifth stage, it's a wrapper around the four below, which remain real, independent entry points in their own right.

0. **`Sentinel-Prompts/00-project-discovery.md`** — Run first. Detects what it can (tech stack, surfaces, commit conventions, a design-token guess) and asks directly for what it can't, starting with the project's name. Produces `PROJECT_PROFILE.md`, which fills prompts 1 and 2's `[PROJECT-SPECIFIC]` brackets for you. On a genuinely blank or near-empty project, it switches from inference to direct elicitation instead — see its Part 0a.
1. **`Sentinel-Prompts/01-design-quality-audit.md`** — Code quality and (for web UI) design consistency: single source of truth for colors/spacing, responsive design, accessibility, whether the interface reads as generic/AI-generated. Also checks or offers to create a design document. Produces a report plus some low-risk direct cleanup (stale comments, doc setup). Report-only otherwise.
2. **`Sentinel-Prompts/02-integration-audit.md`** — Audits project history for every place a new feature has ever needed to touch, including places missed the first time. Produces `INTEGRATION_CHECKLIST.md`: a checklist plus a gate-check description. Proposes, doesn't implement.
3. **`Sentinel-Prompts/03-gate-check-implementation.md`** — Takes the proposals from 01 and 02, re-validates them against the current codebase, and actually builds and wires in the automated pre-commit checks. The only one of the four that implements. Closes with a plain completion summary the first time the full sequence finishes for a project.

## Order matters, but isn't rigid

Run 0 → 1 → 2 → 3 for the best result — each one reads artifacts the previous ones produced. That said, 1 and 2 will run without 0 (you'll fill in brackets by hand), and 2 runs standalone, skipping what isn't there yet. 3 is stricter: it requires `INTEGRATION_CHECKLIST.md` to exist and will stop and tell you to run 2 first if it doesn't.

## How to use these

**Get `Sentinel-Prompts/` into your own project first.** GitHub doesn't offer a one-click way to grab a single folder, so pick whichever of these fits:

- **Fastest — pull just the 5 files with one command**, run from your project's root (creates `Sentinel-Prompts/` for you):
  ```
  mkdir -p Sentinel-Prompts && cd Sentinel-Prompts && for f in 00-project-discovery.md 01-design-quality-audit.md 02-integration-audit.md 03-gate-check-implementation.md sentinel-init.md; do curl -sO "https://raw.githubusercontent.com/timsamoff/Sentinel/main/Sentinel-Prompts/$f"; done && cd ..
  ```
  No git required. (`wget` works the same way if you don't have `curl`: swap `curl -sO` for `wget -q`.)
- **Or clone the repo and copy the folder out** — `git clone https://github.com/timsamoff/Sentinel.git`, then copy its `Sentinel-Prompts/` folder into your project and delete the rest of the clone.

From there:

- **Run the orchestrator (recommended).** Point the agent at `Sentinel-Prompts/sentinel-init.md` to have it run 0 → 1 → 2 → 3 in sequence on its own, still stopping at each stage's normal confirmation points exactly as if you'd run them one at a time. The easiest way through the whole suite, especially the first time.
- **Copy-paste a single prompt.** Copy the whole file's contents into a session in your project's directory. Simpler than trimming it, and nothing here is harmful for the agent to see.
- **Point the agent at a single file.** With the folder already in your project, ask directly: "read `Sentinel-Prompts/00-project-discovery.md` and run it." Most agents can read and follow it the same way.

Either way, start your agent from your project's own root directory, not from inside `Sentinel-Prompts/` — the prompts read and write files relative to your project root (`PROJECT_PROFILE.md`, `AGENTS.md`, `sentinel-notes/`, and so on all land there), not relative to wherever the prompt files themselves happen to sit.

Reach for the individual prompts instead of the orchestrator when you want to stop and review between stages yourself, only need one or two of them, or are re-running just what an update actually changed (see [Upgrading to a new version](#upgrading-to-a-new-version-of-sentinel)) — the numbered prompts are real, independent entry points, not just internals of the orchestrator. The copy-paste route also guarantees the agent only sees the actual instructions for that one stage, if that matters to you.

## Before you start

- **Start with `sentinel-init.md`, or prompt 0 directly if you're not using the orchestrator.** Either way, project discovery fills in the brackets for you with a reviewable record of what it inferred, for both a fresh run and an update — see [Upgrading to a new version](#upgrading-to-a-new-version-of-sentinel). Skipping it isn't a failure mode — your agent will typically infer reasonable values — just less reliable than a deliberate, recorded answer.
- **These pause for input, and the answers stick.** Prompts 0-2 stop partway through to ask real questions (project name, comment style, docs sharing, commit conventions), and the answers get carried into the enforced hook prompt 3 builds. This is closer to configuring a setting that governs every future commit than an ordinary clarifying question. Budget for being present.
- **Git is the default, not the only option.** Prompts 2 and 3 both handle no-VCS projects (2 skips commit-message conventions, since there's no commit to check in the first place; 3 builds a manual command instead of a hook, with a clear note that nothing will remind you to run it). A different VCS with its own real trigger mechanism (Perforce's triggers, common in game dev) gets treated the same as a git hook — the manual-command fallback is only for projects with no trigger mechanism at all. The same manual-command path also covers a narrower case even *with* git in use: if some of Sentinel's own output (`AGENTS.md`, a design doc, `TODO.md`) ends up gitignored per your own local-vs-shared choice, no hook can ever see those files to check them — hooks only see staged/committed content — so those specific checks route to a working-tree-reading script instead, regardless of whether hooks are used for everything else. Where git *is* in use but the manual command is chosen over a hook, commit-message rules (subject length, attribution) still get checked — just after the fact, against the most recent commit, since nothing short of a real hook can stop a bad one from landing in the first place.
- **A no-VCS manual command notices if git shows up later.** If the manual command exists purely because there was no VCS at all when prompt 3 ran, it checks for a `.git` directory on every run and offers, once, to switch to a real pre-commit hook if one now exists — it won't nag after you decline once. This offer is skipped entirely if the manual command exists for either of the other two reasons above (you preferred no hooks, or a specific file is gitignored) — those are deliberate choices, not a gap waiting for git.
- **An existing gate-check system gets audited, not just detected.** Prompt 2 reads its actual logic against known blind spots (staged vs. working-tree reads, numeric caps that don't enforce the structure they proxy for, silent vs. loud failure) and asks whether new checks should match its style or use Sentinel's own conventions.
- **Each prompt identifies your agent and its conventions before doing anything else.** Which tool this is, what it calls its context file, how it handles permissions, whether it has auto-attribution behavior to account for (like Claude Code's optional commit line). This is what lets the same four files work across tools instead of assuming one.
- **A design document is offered, never defaulted.** If one exists, it's used to check whether the implementation still matches documented intent. If not, you're asked before one gets created — and a generated one reads as genuine documentation, not one hedged with a "this is reverse-engineered" disclaimer, though it still won't assert a rationale as fact where there's no real evidence for it. Once one exists, it gets two checks at two speeds: a fast per-commit gate for architecturally significant changes, and a much less frequent release-tied check (with a calendar fallback) that re-verifies the content is actually still true.
- **Prompt 3 asks, once, how much commit/push autonomy you want.** Confirm every time (default), auto-commit but confirm before push, or fully automatic — recorded in `AGENTS.md` as a standing preference. If a project starts committing on its own without you having chosen this, that's not Sentinel's doing.
- **Prompt 1's design sections adapt to your domain.** Full visual GUI (web, mobile, desktop, game) gets the full treatment; a presentational-but-not-GUI surface (a CLI's color scheme, a document generator) gets most sections translated, minus the purely visual ones; no presentational dimension at all (a backend service, a library) means only the code-quality section applies.
- **The design-doc writing voice searches broadly**, checking both the project and your agent's own global config/memory location for anything matching style/voice/tone/narrative/writing in the name — not one exact expected filename.
- **The backlog doesn't go quiet just because you asked for something else.** If your agent gets pulled onto an unrelated task mid-session and finishes it, it should mention any untouched `TODO.md` items before ending its response — a brief nudge, not the full recommendation ritual repeated every time.
- **Added something new with no precedent in the project? You don't need a full re-run of prompt 0 just to find out what applies.** Name the specific thing you added and ask what covers it — this is a lighter, narrower mode than a full update run, and just maps your addition to the right prompt and part directly.

## Upgrading to a new version of Sentinel

Running a newer version of these prompts against a project Sentinel already touched is a real "update" mode, not just a re-run. Prompt 0 detects whether `PROJECT_PROFILE.md` already exists and compares its recorded version against the current one. On an update, it flags known renamed conventions from older versions, and — the important part — tells prompt 3 to re-validate any existing gate-check hook against the current version's requirements. A hook built under an older version can carry bugs that were already fixed in the prompt text but never reached the actual file, so an update isn't complete until that hook has been re-checked, not just left as-is.

**Run `sentinel-init.md` for an update the same way you would for a fresh setup.** It runs prompt 0 first regardless, reads what 0 determined about which of 1-3 actually need to re-run given what changed, and follows that automatically — including jumping straight to 3 when the update is scoped to gate-check details, or skipping 3 until 1 or 2 have supplied what it needs. You don't need to work out the scoping yourself or invoke prompts individually to get correct update behavior.

**If you're running the numbered prompts individually instead, the scoping is not a fixed shortcut** — work out what changed before deciding which of `1`/`2`/`3` to skip. Running `0` then jumping straight to `3` is correct *only when the update is scoped to gate-check implementation details* — `3` re-validates existing proposals against the current codebase regardless of when `1`/`2` last ran, so a hook-specific fix doesn't need them re-run. But `3` only implements what's already proposed in `INTEGRATION_CHECKLIST.md` — if the update added a new *design-audit* check, only re-running `1` surfaces those new findings; if it added a new *integration-audit* gate category, only re-running `2` gets it into the checklist for `3` to implement. `3` can't implement a gate category `2` never proposed, and it can't surface a design finding `1` never looked for.

## What you end up with

- `PROJECT_PROFILE.md` — discovered/confirmed project context, including agent and tool-specific conventions.
- `AGENTS.md` (or `CLAUDE.md`) — the project's authoritative internal record, kept current by prompt 3's gate check.
- `DESIGN.md` (root by default, `docs/DESIGN.md` if the project already keeps docs there, or `architecture/` for multi-file cases) — optional, a narrative overview distinct from `AGENTS.md`'s operational role.
- `sentinel-notes/` — audit findings and a deliberately brief `TODO.md`: one line per item, with anything needing more detail (a rule with many violations, reasoning behind a decision) split into its own `[issue]-design-brief.md` file and linked from the `TODO.md` entry, instead of bloating the list.
- `scratch/` — gitignored, project-local spot for throwaway verification scripts.
- `INTEGRATION_CHECKLIST.md` — the touchpoint checklist and gate-check description.
- A `sentinel-exceptions` file — documented, owned, expiring exceptions a gate check can accept instead of blocking or silently passing. For one-off cases, a `Sentinel-Override: <reason>` commit trailer works instead — a deliberate acknowledgment, not a silent bypass.
- A `TODO.md` sync check — a hard gate for items linked to a design brief, a non-blocking reminder for plain items with no structural signal to check.
- An actual pre-commit hook (source kept in a tracked, versioned location, not dropped untracked into `.git/hooks/`, which silently stops existing on a fresh clone) plus a full-repo scan mode for drift the incremental hook can't see, triggered via CI schedule or `pre-push` rather than run on every commit.
- A new-file-category check, built as a standard default rather than something prompt 2 has to propose first — flags the first time a file extension no one's added before shows up (the first image, the first 3D model, whatever), and asks a short question set right there to route it to prompt 1's creative-media check or prompt 2's touchpoint categories, instead of leaving you to guess what to ask for.

## Limitations

- **This audits what an agent can read as text.** Visual node-graphs and binary/compiled assets are structurally out of reach. Unreal's Blueprints are the clearest example — there's no reliable way to meaningfully inspect Blueprint logic the way this can inspect C#, GDScript, or C++. Prompt 1 says so explicitly rather than silently skipping it. Same for 3D models, textures, and compiled shaders generally — existence and metadata only, not quality.
- **Non-web engine/UI-toolkit coverage is reasoned through, not battle-tested.** The frameworks named in Part 1 (Unity, Godot, Qt, SwiftUI, Jetpack Compose, GTK, WPF, Flutter, and others) are illustrative of the underlying principle, not a coverage boundary — but none of it has been run against a real non-web project the way the web case has, across many real sessions. Treat non-web results with correspondingly more scrutiny.
- **Only Claude Code and OpenAI Codex are confirmed compatible.** The rest (Cursor, Gemini CLI, Windsurf, GitHub Copilot) are reasoned to be likely-compatible based on shared conventions, not actually tested.

## License

MIT. See `LICENSE`. Anyone can use, modify, and redistribute these freely, including in closed-source or commercial work, as long as the original copyright notice is kept.
