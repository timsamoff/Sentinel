# Sentinel

**Version 1.0**

***Rigorous, repeatable quality gates for any AI coding agent, any project, any language.***

### Contents

- [What it does](#what-it-does)
- [Requirements](#requirements)
- [Installation](#installation)
- [The prompts](#the-prompts)
- [Running the suite](#running-the-suite)
- [What to expect](#what-to-expect)
- [Upgrading](#upgrading)
- [What you end up with](#what-you-end-up-with)
- [Limitations](#limitations)
- [License](#license)

## What it does

Sentinel is a set of four prompts that give an AI coding agent a disciplined process for any code or design project. The agent learns what the project is, audits its code and design quality, maps every place a future change needs to touch, and then builds automated checks that hold those standards in place.

Setup is the expensive part. The prompts read your actual codebase and history, which costs real time and tokens once. What you get in return is a pre-commit hook that checks only each commit's diff, plus a periodic full-repo scan for slower drift. Ordinary commits stay cheap.

It is a guided setup, not a one-shot report. The agent will stop and ask about your preferences (commit style, comment philosophy, whether docs stay local or shared), and your answers become enforced rules. Treat those questions as real decisions.

## Requirements

You need an AI coding agent with file-system and shell access, started in your project. Sentinel is confirmed to work with Claude Code and OpenAI Codex. Cursor, Gemini CLI, Windsurf, and GitHub Copilot are likely compatible but untested.

Each prompt identifies which agent it is running under and adapts to it. That includes the name of the persistent context file (`AGENTS.md` for most tools, `CLAUDE.md` for Claude Code), the permission mechanism, and any automatic commit attribution the tool adds.

## Installation

This repo is a source to copy from, not a place to work. Copy the whole `Sentinel-Prompts/` folder into your project. Its location inside the project doesn't matter.

The quickest way is this command, run from your project's root. It needs no git.

```
mkdir -p Sentinel-Prompts && cd Sentinel-Prompts && for f in 00-project-discovery.md 01-design-quality-audit.md 02-integration-audit.md 03-gate-check-implementation.md sentinel-init.md; do curl -sO "https://raw.githubusercontent.com/timsamoff/Sentinel/main/Sentinel-Prompts/$f"; done && cd ..
```

If you don't have `curl`, replace `curl -sO` with `wget -q`. You can also clone this repo, copy the folder out, and delete the clone.

Always start your agent from your project's root, not from inside `Sentinel-Prompts/`. Everything the prompts produce is written to the project root.

## The prompts

- **`sentinel-init.md`** runs the four stages below in order. It is the recommended way to use the suite. It is unnumbered because it is a wrapper, not a fifth stage.
- **`00-project-discovery.md`** detects the project's stack, surfaces, and conventions, and asks you for what it can't detect. It produces `PROJECT_PROFILE.md`, which the later prompts read. On a blank or nearly empty project, it asks you directly instead of inferring.
- **`01-design-quality-audit.md`** audits code quality and, where there is a user interface, design consistency: color and spacing systems, responsive layout, accessibility, and whether the interface looks generic or machine-made. It also checks for a design document or offers to create one. It makes small, low-risk cleanups and reports everything else.
- **`02-integration-audit.md`** reads the project's history to find every place a new feature has needed to touch, including places that were missed. It produces `INTEGRATION_CHECKLIST.md` and proposes gate checks without building them.
- **`03-gate-check-implementation.md`** re-validates the proposals from 01 and 02 against the current code, then builds and wires in the checks. It is the only prompt that implements.

## Running the suite

Point your agent at `Sentinel-Prompts/sentinel-init.md` and it will run all four stages. It moves from one stage to the next on its own, but it always stops before stage 3 to confirm you have reviewed what 01 and 02 proposed. Each stage's own questions also stop and wait for you.

You can also run a single prompt, either by pasting its contents into a session or by asking the agent to read and run the file. Use individual prompts when you want to review between stages, need only one or two of them, or are re-running part of the suite after an update.

The best order is 0, 1, 2, 3, since each stage reads what the previous one produced. Prompts 1 and 2 can run without 0, though you'll fill in the project details yourself. Prompt 3 requires `INTEGRATION_CHECKLIST.md` and will tell you to run 2 first if it's missing.

## What to expect

**Plan to be present.** Prompts 0 through 2 pause to ask questions, and your answers become permanent parts of the hook that prompt 3 builds. Where a question has fixed answers, the agent will show clickable options if your tool supports them.

**Git is the default, not a requirement.** Without version control, prompt 3 builds a manual command instead of a hook. That command checks for a `.git` directory each time it runs and offers once to switch to a real hook if one appears. A version control system with its own trigger mechanism, such as Perforce, is treated the same as git. The manual command is also used for any Sentinel output you choose to keep out of version control, since a hook can't see ignored files. When git is in use but you choose the manual command, commit-message rules are still checked against your most recent commit after the fact.

**Existing gate checks are audited, not just detected.** Prompt 2 reads any existing system for known weaknesses, such as checking the working tree instead of staged files, or failing silently. It then asks whether new checks should follow that system's style or Sentinel's.

**A design document is offered, never assumed.** If one exists, the audits check the code against it. If not, you're asked before one is created. A generated design document reads as ordinary documentation, but it won't state a rationale as fact without evidence. Once it exists, it gets two checks: a per-commit gate for architecturally significant changes, and an occasional review, tied to releases, that confirms its content is still true.

**Commit autonomy is your choice.** Prompt 3 asks once whether the agent should confirm every commit (the default), commit freely but confirm before pushing, or run fully automatically. Your answer is recorded in `AGENTS.md`.

**The plain terse commit style means no body, ever.** The hook enforces this as a hard block. If a change is too broad for one honest subject line, split it into several commits.

**Design checks adapt to the project.** A full graphical interface (web, mobile, desktop, or game) gets the complete design audit. A presentational surface without a GUI, such as a CLI's color scheme, gets the parts that apply. A backend service or library gets only the code-quality section.

**New kinds of work don't need a full re-run.** If you add something with no precedent in the project, name it and ask what covers it. The agent will point you to the right prompt and section.

**The backlog stays visible.** If the agent finishes an unrelated task while `TODO.md` items remain open, it mentions them briefly before ending its response.

## Upgrading

Running a newer version of Sentinel on a project it has already touched is treated as an update. Prompt 0 compares the version recorded in `PROJECT_PROFILE.md` with the current one, flags renamed conventions, and tells prompt 3 to re-validate the existing hook. A hook built under an older version can carry bugs that later versions fixed in the prompt text, so an update isn't complete until the hook has been re-checked.

With `sentinel-init.md`, you don't need to work out which stages to re-run. It runs prompt 0 and follows its recommendation.

If you run the prompts individually, decide what the update actually changed. If it only affects gate-check implementation, run 0 and then 3. If it adds a new design check, re-run 1. If it adds a new integration gate category, re-run 2 before 3, since 3 can only build what 2 has proposed.

## What you end up with

- **`PROJECT_PROFILE.md`:** the confirmed project context, including your agent's conventions.
- **`AGENTS.md` or `CLAUDE.md`:** the project's authoritative internal record, kept current by the gate check.
- **A design document (optional):** a narrative overview, stored at the root by default or wherever the project already keeps docs.
- **`sentinel-notes/`:** audit findings and a brief `TODO.md` with one line per item. Items that need more detail link to their own design brief file.
- **`scratch/`:** a git-ignored folder for throwaway verification scripts.
- **`INTEGRATION_CHECKLIST.md`:** the touchpoint checklist and gate-check description.
- **Exceptions:** a `sentinel-exceptions` file for documented, owned, expiring exceptions, and a `Sentinel-Override: <reason>` commit trailer for one-off cases. Both are deliberate acknowledgments, not silent bypasses.
- **A `TODO.md` sync check:** a hard gate for items linked to a design brief, and a non-blocking reminder for everything else.
- **The pre-commit hook itself:** stored in a tracked location so it survives a fresh clone, plus a full-repo scan run on a schedule or on push.
- **A new-file-category check:** flags the first file of a type the project hasn't used before (the first image, the first 3D model) and asks a few questions to route it to the right audit.

## Limitations

- **Sentinel audits what an agent can read as text.** Visual scripting such as Unreal Blueprints, along with binary assets like 3D models, textures, and compiled shaders, can be checked for existence and metadata only. Prompt 1 says so rather than skipping them silently.
- **Non-web projects are reasoned through, not battle-tested.** The engines and toolkits named in prompt 1 (Unity, Godot, Qt, SwiftUI, Flutter, and others) illustrate the approach, but none has been tested as thoroughly as web projects. Review those results with extra care.
- **Only Claude Code and OpenAI Codex are confirmed compatible.** Other agents are expected to work but haven't been tested.

## License

MIT. See `LICENSE`. You may use, modify, and redistribute these prompts freely, including in closed-source or commercial work, as long as the original copyright notice is kept.
