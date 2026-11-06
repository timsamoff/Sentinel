# Sentinel: Maintainer Guide Prompt (Portable, optional, for any AI coding agent, any project)

**Version 1.8.0**

This prompt is optional. The other four don't need it, and nothing in the suite runs it unless the user asks. It maintains a living reference for developers that documents the project's scope, architecture, decisions, current state, and development progress. Its purpose is to preserve project knowledge, give an up-to-date picture of the whole project, and make it easier to resume work after time away, including for a developer who didn't write the code. It reads the project and writes files, and it proposes one quality gate without building it. Run it after `00-project-discovery.md`, and ideally after `02-integration-audit.md` and before `03-quality-gate-implementation.md`, so `03` can build the guide's check in the same pass. Run it again later to verify or change the guide.

---

## The prompt

You are writing, or re-checking, a maintainer guide for this project. Ground everything in what you actually find in the code and this session's answers, not in memory of other projects or conversations. A guide that states a guess as fact is worse than no guide, so mark anything inferred rather than confirmed with `[UNVERIFIED]`, and say so in the report. Any incidental finding that isn't part of writing the guide still needs a disposition, logged to `Sentinel-Notes/TODO.md` at minimum.

**Agent identification.** Use the agent and context-file names recorded in `PROJECT_PROFILE.md`. If the profile doesn't exist, see Part 0.

When you ask the user anything — one of this prompt's own scripted questions or something that comes up along the way — phrase it in plain language a non-specialist could follow. Say what's actually being decided before naming any internal mechanism, rule, or file involved, and make sure each option offered is a complete, actionable choice on its own rather than a fragment of engineering detail. The person commissioned this process; they shouldn't need to already track its internals to answer a question about their own project. If your tool provides a structured choice/selection mechanism (buttons, a picker, numbered options the user can click rather than type), use it for this kind of question; otherwise present the options as clearly labeled text.

### Part 0 - Check what's already there

- If `PROJECT_PROFILE.md` doesn't exist, stop and tell the user to run `00-project-discovery.md` first. This prompt reuses its surfaces, version control status, and context-file name.
- If the profile says this was a blank or near-empty project run, say there's nothing to document yet and stop. Suggest running this once real code exists.
- If a `Sentinel-Maintainer-Guide/` folder exists, or the profile has a `Maintainer guide:` line, this is a later run. Go to Part 6.
- Otherwise this is a first run. Continue.

### Part 1 - Measure the project and ask which guide to write

Count the files that make up the project's own work (code, scripts, configuration, and any prompt or content files the project is mostly made of). Leave out generated files, vendored dependencies, lockfiles, binary assets, and Sentinel's own files. Count lines in the same files. Take the top-level folders and surfaces from the profile.

Report what you counted, not a bare label: "about 340 files and 48,000 lines across 6 top-level folders." Then give a recommendation and the reason. These starting numbers are untested, so treat them as a guide, not a rule, and say that the counts are the evidence and the user can disagree:

- Under 150 files and under 15,000 lines: recommend the full guide.
- Over 1,000 files or 100,000 lines: recommend a full guide for chosen areas only.
- In between: recommend the one-page guide that grows.
- Several independent apps or packages in one repository: recommend a full guide for chosen areas, whatever the size.

Ask one question. Describe each option by what the user gets and what it asks of them:

1. **No guide.** Nothing is created and nothing is added to `AGENTS.md`.
2. **One-page guide.** One file of about 300 lines covering the project's scope and current state, where to change things, the rules the code relies on but doesn't enforce, the fragile spots, how to build, run, and test, and a short log of recent progress. You review one file.
3. **One page now, grows as you go.** The same page, plus a short section for an area each time a commit touches an area the guide doesn't cover yet. The guide lists which areas are covered, so coverage follows where the work happens.
4. **Full guide.** About a dozen files covering scope, architecture, vocabulary, state, decisions, step-by-step edits, checklists, and a full progress log. It gives a new maintainer the most and asks the most to review and keep current. For a large project or one with several apps, offer this as "full guide for areas you choose" instead, and ask which areas.

State two costs with the options, in the same words each time: the first draft needs the user's review before it can be trusted, and every later commit that changes covered code has to update the guide too.

If the answer is no guide, add `Maintainer guide: none` to `PROJECT_PROFILE.md` so later runs don't ask again, and stop.

### Part 2 - Two follow-up questions

- **Tracked or local.** A guide for people who clone the repository has to be tracked in git. A local-only guide helps only on this machine, and a remote session can't see it. Default to the choice already made for `AGENTS.md` and `Sentinel-Notes/`, say what that choice means here, and let the user change it.
- **How strict the check is.** The guide gets a quality-gate check (Part 5) that notices when a commit changes covered source but not the guide. Ask whether it should show a reminder (the default) or block the commit. Explain the tradeoff plainly: the check can see that the guide was touched but can't judge whether a change affected anything it describes, so blocking pushes people to make token edits, and a reminder can be ignored.

### Part 3 - Survey, then show a plan

Read `PROJECT_PROFILE.md`, `AGENTS.md`, the design document if there is one, the README, `INTEGRATION_CHECKLIST.md`, and any existing docs. Then survey the code: entry points, module layout, state, external dependencies, configuration, and the build and test commands.

Don't try to read what won't fit. Work one area at a time and write down each area's findings before moving to the next. If part of the survey is delegated to a sub-agent or background task, check its output against this list before using it, since a delegate that returns early looks the same as a clean result.

Check for an established writing voice the same way `01-design-quality-audit.md` does for a design document (a style guide in the project, then the tool's user-level configuration). Otherwise write plain technical prose.

Before writing anything, show the user a short plan: the files to create, any that don't apply and why, the areas covered and not covered, and the location. Wait for confirmation.

### Part 4 - Write the guide

Create `Sentinel-Maintainer-Guide/` at the project root. If that name is already used for something else, ask what to call it. Never put it in `Sentinel-Notes/`, which is scoped as audit output and may be local-only.

**Writing rules.**

- Write for an experienced developer who has not seen this code. Plain declarative prose, no marketing language. No em dashes or en dashes; use a plain hyphen for numeric ranges.
- Verify every path, identifier, and command against the code before writing it. Favor accuracy over completeness.
- Use relative file paths and function or section names, not line numbers, since line numbers go stale.
- Keep each file to about 300 lines. If one outgrows that, split it by area or prune it. If every file keeps outgrowing it, the project is too large for this option, so say so and offer a smaller one.
- Link to anything a tool already generates (API docs, dependency lists) and to the design document's decisions instead of copying them.
- Never record secret values. Record where a secret is read, not what it is.
- When the guide and the code disagree, the code is right. Fix the guide.

**One-page guide.** One file, `Sentinel-Maintainer-Guide/GUIDE.md`. It opens with a header block: what the guide is, a coverage map, the date and commit of the last verification, and the update rule from Part 5. Then six sections:

- *Scope and current state.* What the project is for, what it includes and leaves out, and what is true now: what works, what is in progress, and what comes next, at the level of the whole project. Unfinished session work belongs in the handoff, not here.
- *Where to change things.* A task-indexed map ("to change X, edit this file and function, and also check Y"), organized by what a person wants to do, not by folder. This is the most important section.
- *Invariants.* Assumptions the code relies on but doesn't enforce (ordering, units, ID formats, values that must stay in sync). Mark each as enforced or unenforced.
- *Fragile zones and debt.* Tightly coupled or hard-to-test code, workarounds, and known issues, each with a severity.
- *Build, run, test.* The exact commands, and how to deploy if that applies.
- *Progress.* One entry per development session, three to six lines on what changed in the project, why, and which guide sections were updated. A session that only edits the guide, such as a verify run, gets one line. Newest first. On the first run, start the log with a "History to date" entry drawn from the version history and `git log`, marked `[UNVERIFIED]` where you can't confirm it. Keep that entry and the latest 15 session entries, and drop older ones, since `git log` holds the rest.

**One page that grows.** The same `GUIDE.md`, plus `Sentinel-Maintainer-Guide/areas/<area>.md`, one file per covered area, holding that area's architecture, key code, state, where-to-change, invariants, and fragile spots. Start with the areas the user names, or with none. The coverage map in the header lists each area as covered, partly covered, or not covered, so a missing entry isn't read as the code not existing.

**Full guide.** Create the files below, skipping any that don't apply and saying which and why. For a large project, write them per chosen area, and list every other area as not covered in `00-README.md`.

- `00-README.md`: index, how to use the folder, the update rules, the coverage map, and the date and commit of the last full verification.
- `01-architecture.md`: scope and current state (as described above), then structure, major components, how they connect, and a plain-language data flow, with a simple Mermaid or ASCII diagram where it helps.
- `02-glossary.md`: domain terms mapped to the identifiers in code, noting where the concept name and the code name differ.
- `03-where-to-change.md`: the task-indexed map described above.
- `04-key-code-reference.md`: important variables, functions, classes, and methods, each with a one-line purpose, location, and callers.
- `05-state-and-data.md`: where each piece of state is created, changed, and read, which source is the single source of truth, and data formats and storage.
- `06-invariants.md`: as described above.
- `07-decisions.md`: a decision log with the reason for each choice and the alternatives rejected. Point to the design document for decisions it already records.
- `08-fragile-zones-and-debt.md`: as described above.
- `09-dependencies-and-config.md`: libraries and external services (purpose, version constraints, what breaks if they change), plus every config option, flag, and environment variable and where it is read.
- `10-recipes.md`: step-by-step procedures for common manual edits, with the checks to run afterward.
- `11-build-run-test.md`: exact commands to build, run, test, and debug locally.
- `12-verification-checklists.md`: per-feature steps a person can follow to confirm it works.
- `CHANGELOG-human.md`: the progress log. One entry per development session, three to six lines on what changed in the project, why, and which guide files were updated. A session that only edits the guide, such as a verify run, gets one line. Newest first, kept in full. On the first run, start it with a "History to date" entry drawn from the version history and `git log`, marked `[UNVERIFIED]` where you can't confirm it.

Before calling this part done, check every path, identifier, and command in what you wrote against the code, one by one. List everything still marked `[UNVERIFIED]`.

### Part 5 - Wire it in

Make the smallest additions that keep the guide current. Don't rewrite the other prompts or existing `AGENTS.md` content.

- **Update rule in `AGENTS.md`.** Record: any change that adds, removes, renames, or moves a module, public function, state field, config option, dependency, or domain term, or changes what a documented thing does, must update the matching part of `Sentinel-Maintainer-Guide/` in the same commit, and the session's entry in the progress log (`CHANGELOG-human.md` in the full guide, the Progress section of `GUIDE.md` otherwise) must be added or updated. For the option that grows, add "a change in an area the guide doesn't cover yet adds that area's file, sized to what you verified." For a chosen-areas guide, say the rule applies to covered areas only. Add that anything inferred is marked `[UNVERIFIED]`, and that the code wins over the guide.
- **Verification note in `AGENTS.md`.** To re-check the guide, run `04-maintainer-guide.md` and choose verify.
- **Close-out.** If `AGENTS.md` has a close-out, add "guide updated, or not needed" to its duties.
- **Quality-gate check, proposed and not built.** `03` builds the check. If `INTEGRATION_CHECKLIST.md` exists, add an item: when a commit changes source files in a covered area without changing the guide, show a reminder or block, as chosen in Part 2. Define "source" from the profile's surfaces and exclude the guide, tests, lockfiles, and generated files. The check reads the guide's coverage map to learn which paths belong to which covered area, instead of carrying its own list, so the option that grows doesn't leave it checking a stale snapshot. If the guide is local-only, it is a gitignored file that no hook can see, so say in the item that the check belongs in the manual command, per `03`'s note on gitignored output. Say that the check proves only that the guide was touched, not that it's right, which is what the verify run is for. If `INTEGRATION_CHECKLIST.md` doesn't exist, log a one-line candidate in `Sentinel-Notes/TODO.md` for the next run of `02`. If `03` has already run, tell the user to run it again to build the item.
- **Profile.** Add to `PROJECT_PROFILE.md`: `Maintainer guide: <option>, <tracked or local>, last verified <date> at <commit>`. The commit is the one that was current when verification started, since a commit can't contain its own hash. With no git, record the date only.
- **Local-only.** If the user chose local, add the folder to `.gitignore`.

### Part 6 - Later runs: verify, change, or remove

Ask which the user wants.

- **Verify.** For every file in the folder, re-check each path, identifier, and command against the code. Fix drift. Remove `[UNVERIFIED]` where you can now confirm the claim. Check the scope and current-state text against the project as it is now, trim the progress log to its cap, add a one-line entry for the verify run itself, check the coverage map against the project's current areas, and check the update rule against `AGENTS.md`. Update the verification date and commit in the guide and in the profile line. Report how many items were fixed and what is still unconfirmed.
- **Change the option.** Run Part 1's question again, naming the current option. Moving to a bigger option adds files. Moving to a smaller one needs a plain confirmation before anything is deleted.
- **Remove.** Confirm, then delete the folder, the `AGENTS.md` rule and note, and the proposed or built check, and set the profile line to `Maintainer guide: none`.

### Deliverables

Report what you created, what you skipped and why, every `[UNVERIFIED]` item, and every change outside the guide folder (`AGENTS.md`, `.gitignore`, `PROJECT_PROFILE.md`, `INTEGRATION_CHECKLIST.md` or `TODO.md`). If git is in use, list the new and modified files and ask whether to commit them, using the commit convention already recorded. Never commit or push without an explicit yes. If a check was proposed, say that `03` builds it.
