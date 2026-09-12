# Sentinel: Integration Audit Prompt (Portable — for any AI coding agent, any project)

Paste this to your AI coding agent as its own session/task, separate from feature work. Before using it on a new project, fill in the `[PROJECT-SPECIFIC]` bracket below with that project's real subsystems — this template deliberately leaves it unfilled rather than guessing for you. If you skip this, the agent will typically infer something reasonable from the actual codebase, but a value you've deliberately confirmed is more reliable than one inferred in the moment with nobody reviewing it (see note at the end).

**Pre-flight — confirm every bracket below is filled in before running this:**
- [ ] Line 1 of "The prompt": the recurring unit-of-work phrase (e.g. component type, endpoint, screen, model field)
- [ ] Part 1: "[PROJECT-SPECIFIC unit of work]"
- [ ] Part 2: "[PROJECT-SPECIFIC unit]" and the "[units/features/capabilities]" list

---

## The prompt

You are auditing this project's own development history to find every place a "new component," "new feature," or "new [PROJECT-SPECIFIC: the recurring unit of work in this codebase — e.g. component type, endpoint, screen, model field, CLI subcommand, message/event type, game entity type, infrastructure resource]" has ever needed to touch — including places that were touched *late* or *after a bug was found* rather than up front. Do not rely on your general sense of good practice — ground every item in something that actually happened in this codebase, by reading its real history (commits, session notes, AGENTS.md, changelogs). Where you're not sure something is a real touchpoint, say so explicitly rather than guessing.

**Agent identification.** This prompt works with any AI coding agent capable of reading a codebase, running shell commands, and creating git commits — Claude Code, OpenAI Codex, or similar. If `PROJECT_PROFILE.md` exists, it already recorded which agent and which context-file name applies (`AGENTS.md` is the vendor-neutral name used throughout this prompt; Claude Code specifically calls the same file `CLAUDE.md`) — use that. Otherwise identify it yourself before proceeding.

When you ask the user anything — one of this prompt's own scripted questions or something that comes up along the way — phrase it in plain language a non-specialist could follow. Say what's actually being decided before naming any internal mechanism, rule, or file involved. The person commissioned this audit; they shouldn't need to already track its internals to answer a question about their own project.

**If there's no git.** The commit conventions in Part 4 only make sense where commits exist — if this project doesn't use git (or any VCS), skip Part 4's commit-message conventions entirely and note in the checklist that gating will happen via a manually-run command instead (the Gate-Check Implementation prompt builds this). The touchpoint logic in Part 1 and the AGENTS.md/README checks in Part 2 apply regardless of VCS or its absence — those aren't commit-shaped, they're about whether the code and docs changed together.


### Scope — Enumerate every surface first

Check for `PROJECT_PROFILE.md` first — if present (from the discovery prompt), use its surface list as a starting point rather than re-enumerating from scratch, but re-verify it's still accurate rather than trusting it blindly if time has passed since it was generated. If it's not present, or looks stale, identify every distinct application surface in this repo by its actual top-level folders/packages (e.g. user-facing app, admin panel, demo site, internal tooling, or independent packages in a monorepo) — don't assume the project is a single app. Confirm you'll audit all of them, not just the first or most prominent one. Note whether surfaces share the same registries/subsystems (e.g. one shared component registry used by both the main app and admin) or have separate ones per surface, since that changes what counts as a touchpoint — a shared registry means one miss affects every surface; separate registries mean the same kind of change may need to happen independently in each.

Carry this per-surface breakdown through every part below — checklist items should say which surface(s) they apply to, and if the same touchpoint category exists independently per surface, list it once per surface rather than merging it into one generic item that could hide a gap in the surface not currently being worked on.

### Part 0 — Inventory what already exists

Before building anything new, inventory the gate checks, CI steps, and AGENTS.md instructions that already exist. For each one, note what it actually verifies — read its logic, don't infer from its name or comments — and what it does not. Do not assume a blank slate.

Also check for `./sentinel-notes/TODO.md` and any `[issue]-design-brief.md` files from a prior design-quality audit pass. If present, read the "candidate gate-check items" it flagged and fold any still-relevant ones into the Part 1 touchpoint list and Part 3 checklist, rather than starting Part 1 from scratch as if no prior audit happened.

If `PROJECT_PROFILE.md` records a design document (`docs/DESIGN.md`, `docs/ARCHITECTURE.md`, or similar), read it too — a documented intended architecture is a useful cross-check when identifying the recurring unit of work and its real touchpoints, in addition to (not instead of) grounding everything in what actually happened in the codebase's own history.

As you build the Part 1 touchpoint list and the Part 2 AGENTS.md, README, and design-doc requirements, cross-reference every item against this existing-checks inventory and mark it one of:

- **Already covered** — an existing check genuinely verifies this, confirmed by reading its logic
- **Partially covered** — an existing check touches this area but doesn't fully verify it (say specifically what gap remains)
- **Not covered** — no existing check addresses this at all

Carry these labels into the final `INTEGRATION_CHECKLIST.md` so it's honest about what's already solid versus what's genuinely new.

### Part 1 — Touchpoint inventory

Go through the codebase and its history and build a list of every subsystem that adding or changing a [PROJECT-SPECIFIC unit of work] has had to touch, or *should* have touched but didn't at first. For each one, note:

- The file/module it lives in
- What kind of change is required there (e.g. "add an entry," "extend a switch/match statement," "update a fallback default," "add a migration")
- Whether missing it would fail loudly (a crash, a visible error, a failing test) or silently (wrong behavior that looks plausible)
- A real example from this project's history if one exists, even if already fixed

Silent-failure touchpoints matter most — a checklist earns its keep on those. Loud failures mostly self-report and don't need a gate.

Deliberately check these categories of area — not as a checklist to fill mechanically, but as prompts to go find this project's real equivalent of each:

- **Definition/registry layer** — wherever new instances of the core unit get declared (a schema, a config list, a registry file, an enum) — including any hardcoded-by-name lists that should really be schema-driven, since those are exactly what future additions silently miss
- **Rendering/presentation layer** — anywhere the unit is displayed, output, or otherwise surfaced to a user or caller (a UI render, a CLI print/format function, an API response serializer, a log message), including edge cases like orientation, fallback rendering for old/legacy data, and default states
- **Interaction/control layer** — anywhere user or caller input reaches the unit, including any permission/lock/access-control lists that need explicit inclusion or exclusion per unit
- **Core logic/computation layer** — anywhere the unit's behavior is computed or validated, including any place a value gets "resolved" through more than one possible source (defaults vs. overrides vs. computed)
- **Persistence layer** — save/load, serialization, database schema, migrations — especially backward compatibility for data saved before a field existed
- **Wiring/registration layer** — anywhere new units need to be hooked into event systems, startup sequences, or dependency injection
- **Cross-cutting assumptions** — anywhere the code assumes something generic ("any X with property Y") vs. anywhere it's still hardcoded by name — flag every hardcoded-by-name spot as a known gap
- **Documentation that isn't the README** — design docs, architecture notes, changelogs, code comments describing intent — do they still match what's implemented?

### Part 2 — AGENTS.md, README, design-doc, and TODO gate checks (specific requirement)

Add `AGENTS.md`, the README, and (if one exists) the design document as their own explicit checklist categories, not folded into general docs — they serve different purposes and need separate gates.

`AGENTS.md` is this project's authoritative internal record of features, conventions, and architecture — it's what future agent sessions rely on for accurate context. For every commit that adds or changes a [PROJECT-SPECIFIC unit], feature, or architectural decision, the gate check should verify `AGENTS.md` was touched in the same commit — and if it wasn't, block or warn. This is the highest-priority of these gates, since drift here corrupts every future session's and every future audit's starting context, not just a human reader's understanding.

The README is the public-facing description of the project — its job is to stay accurate, not to serve as the authoritative source. For every commit that changes user-facing behavior, setup, or capabilities, the gate check should verify the README was touched in the same commit if the change affects what it documents. Specifically check whether the README documents:

- The current list of supported [units/features/capabilities]
- Any user-facing feature list or capabilities section
- Setup/usage instructions, if the change affects how the project is run, built, or configured
- Anything the README currently claims that's now stale

If `PROJECT_PROFILE.md` or `AGENTS.md` records a design document (`docs/DESIGN.md`, `docs/ARCHITECTURE.md`, or similar), add a third gate for it — but with a meaningfully narrower trigger than the other two. `AGENTS.md` tracks fine-grained operational detail and should get touched often; a design document is a high-level narrative overview and should only need updating for genuinely architecturally significant changes — a new subsystem, a structural shift, a change to how major components relate — not every feature or touchpoint that would trigger the `AGENTS.md` gate. Using the same bar as `AGENTS.md` would make this gate noisy enough that people start ignoring it, which defeats the point of having a high-level document at all. Judgment is required here in a way it isn't for the other two gates: state explicitly what counts as "architecturally significant" for this project before implementing the check, rather than leaving it to be decided ad hoc at gate-check time. If no design document exists, this gate doesn't apply — don't create the expectation that one must exist.

Add a fourth gate for `sentinel-notes/TODO.md` completion itself — a real, common failure mode is finishing the work an item describes (fixing the bug, updating a linked design brief) without ever going back to mark the item done in `TODO.md`, leaving the tracker silently wrong. This one splits into a hard check and a soft one, since only half of it is mechanically detectable: for any item linked to a `sentinel-notes/[issue]-design-brief.md` file, if a commit modifies that brief file, verify `TODO.md`'s corresponding entry also changed status (per whatever completion convention was recorded) in the same commit — this is a real, structural signal to check against, not a guess, so it can genuinely block or warn. For plain one-line items with no linked brief, there's no equivalent signal to correlate a commit against — don't invent a fuzzy heuristic to force a hard check where none is reliably possible; implement this half as a non-blocking reminder instead, the same pattern already used elsewhere for things that need a nudge but can't be mechanically verified (a README-staleness reminder is a common real-world instance of this same pattern).

If any of these files doesn't have clear sections for what it's supposed to document, propose a structure that makes "did the file get updated" mechanically checkable rather than a judgment call.

### Part 3 — Deliverables

Produce:

1. **`INTEGRATION_CHECKLIST.md`** — the touchpoint inventory from Part 1, the AGENTS.md/README/design-doc/TODO-sync requirements from Part 2, and the Part 0 coverage labels — written as an actual checklist, organized by subsystem, with the silent-vs-loud-failure note kept per item.
2. **An updated gate-check step** (describe the logic in plain terms first, before writing any script) that, on each relevant commit, cross-references the diff against `INTEGRATION_CHECKLIST.md` and flags any category that wasn't touched but plausibly should have been — including AGENTS.md, README, the design document (if one exists), and TODO.md completion sync as separate categories, each with the trigger described in Part 2. This gate check must run as an automated process that occurs before committing, not a manual step someone has to remember to run, and must fold in the commit conventions from Part 4 below and the exception mechanism from Part 5 below. It must also describe a full-repo scan mode, separate from the diff-scoped commit-time check — the commit-time check only catches new violations in what's being committed, so it structurally cannot catch drift from git history, manual edits outside a commit, or an interaction between two separately-valid commits. Don't propose running the full scan on every commit — it's slower, and paying that cost every commit either discourages small commits or trains people to bypass the hook. Propose a CI-scheduled job if the project has CI, or a `pre-push` hook otherwise, so the full scan runs automatically without adding friction to every commit. For every flagged violation, the output must be actionable: name the specific rule/category violated, the exact file (and line, when the check is diff/grep-based), and the required correction or the self-review question to resolve it — not just which category was flagged.
3. **A short "known gaps" section** listing anything flagged as a real touchpoint but not gateable mechanically, so it's a visible tracked risk rather than a silent one.

When updating `sentinel-notes/TODO.md` with candidate items, check the top of the file for the completed-item convention recorded there (deleted, struck through, or moved to a "Done" section) and follow it — don't apply your own default.

Before presenting these deliverables as complete, verify every part above (0–2) has an explicit entry in the output, not silence. If any portion of this audit was delegated to a sub-agent, sub-session, or background task (if your tool supports that kind of delegation), check its output against every part of this prompt explicitly before accepting it — a delegate returning early or silently dropping a section is indistinguishable from a clean pass unless you check.

If git is in use, `INTEGRATION_CHECKLIST.md` and any updates to `sentinel-notes/TODO.md` are new or modified files at this point. Ask plainly whether the user wants them committed now, and pushed if that fits their workflow, rather than leaving them sitting uncommitted. Never commit or push without an explicit yes.

### Part 4 — Commit conventions

Check `PROJECT_PROFILE.md` first (if present) for a detected existing commit-message convention. If the project already has a real, consistent pattern in its own history, propose matching it as the primary option when you ask, rather than presenting a blank slate of choices — matching what's already there is usually the right default for an established project. Then ask the user directly what commit message style they prefer — don't assume terse one-liners or any other specific style is the default. A short set of options to offer: whatever convention was detected (if any); terse one-line summaries with no body unless truly necessary; Conventional Commits format (`feat:`, `fix:`, `chore:` prefixes); detailed narrative descriptions; or their own custom convention. If they have no preference and nothing was detected, terse subject + optional short bullets is a reasonable fallback, but say so explicitly as a fallback rather than presenting it as the norm. Also ask whether they prefer a single commit per session as the default or are comfortable with multiple atomic commits for larger changes — teams and individuals genuinely differ here.

Record whatever the user chooses in the checklist so the Gate-Check Implementation prompt enforces the same actual preference rather than a generic assumption. Also write it into `AGENTS.md` — not just the checklist. The checklist is what 03 reads once to build the hook; `AGENTS.md` is what every future session actually reads. If the hook is ever missing, broken, or silently stops running (which is a real failure mode, not a hypothetical one), a preference that only lives in a file nobody re-reads is a preference that's been completely forgotten the moment enforcement lapses — recording it in AGENTS.md means the agent's own generated commits still aim for the right shape even without a hook physically blocking the wrong one, instead of reverting to no guidance at all. The following are separate from style and apply regardless of what the user picks, since they're hygiene, not taste:

- Commit messages must never contain co-author notes or any auto-generated attribution/session-link trailer your specific tool might add (Claude Code, for example, can add a "Generated with Claude Code" line and a `Claude-Session:` trailer unless suppressed) — these must be actively stripped or rejected by the hook itself, not merely instructed against, since a tool's own settings-level attribution controls are documented as unreliable for Claude Code and shouldn't be assumed reliable for any other tool either. Implement this as a `commit-msg` hook that deletes or blocks any line matching your tool's known attribution patterns, so it holds regardless of whether in-session behavior complies that day.

This last point matters enough to say plainly: instructing yourself not to add these lines is not sufficient on its own — treat the hook as the actual enforcement mechanism and the instruction as, at best, a first pass that the hook backstops.

### Part 5 — Exceptions

A gate check needs a sanctioned third outcome besides pass and silently-let-through-fail: a documented, owned, expiring exception. When a checklist item genuinely can't be satisfied for a legitimate reason, the gate check should accept a recorded exception instead of either blocking forever or silently passing. Design this as a small file — `sentinel-exceptions.json` unless the project already has its own naming convention worth matching instead — that the gate check reads before failing a commit, where each entry requires: the specific checklist category/rule it exempts, a narrow file scope (no catch-all globs), a concrete reason, an owner, and a review-by date. An expired entry fails the build the same as having no exception at all. Exceptions are not something the agent grants itself silently mid-session — they get proposed as part of the "known gaps" deliverable (Part 3, item 3) for the user to actually add, not created and self-approved in the same pass.

Not every legitimate exception is a standing one, and forcing all of them through the file-based mechanism above is the wrong fit for a one-off case — a single commit that's genuinely large for a good reason doesn't need an owner or an expiry date, since it only ever applies to that one already-made commit. For a per-instance judgment call like this, the lighter-weight equivalent is a required, reasoned override recorded directly in the artifact itself — e.g. a commit trailer like `Sentinel-Override: <reason>` — rather than a standing exceptions-file entry. The principle that matters here generalizes past commits: when a check's failure condition sometimes reflects a legitimate judgment call rather than a pure mechanical violation, the fix is never to downgrade the check to a non-blocking warning. A warning is structurally the same as an unenforced instruction — it can be scrolled past, and repeated exposure to it erodes exactly the way natural-language commit-style instructions already proved unreliable elsewhere in this project. Keep the check blocking by default, and require a deliberate, reasoned, recorded override instead — one that costs a small amount of real friction each time and leaves a permanent trace of why, rather than a warning that fades into background noise after the first several times it's seen.

Do not implement or modify any gate-check scripts yet. Stop after producing the deliverables above (including the Part 4 conventions and Part 5 exception mechanism folded into deliverable 2) and wait for review.

---

## Before using this on a new project

Replace every `[PROJECT-SPECIFIC]` bracket and the eight generic layer categories in Part 1 with that project's actual architecture before running this — a truly generic list (as written above) is a starting lens, not a substitute for reading the real codebase. The value of this framework comes from grounding every item in what actually happened in *that* project's history, the same way the Ryewired version was grounded in the electrolytic-cap stripe bug and the rail-break incident rather than generic advice. If your output for a new project reads like it could apply to any codebase, that's a sign you under-audited, not that the framework worked well.
