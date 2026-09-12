# Sentinel: Integration Audit Prompt (Portable — for any Claude Code project)

Paste this to Claude Code as its own session/task, separate from feature work. Before using it on a new project, fill in the `[PROJECT-SPECIFIC]` bracket below with that project's real subsystems — this template deliberately leaves it unfilled rather than guessing for you. If you skip this, Claude Code will typically infer something reasonable from the actual codebase, but a value you've deliberately confirmed is more reliable than one inferred in the moment with nobody reviewing it (see note at the end).

**Pre-flight — confirm every bracket below is filled in before running this:**
- [ ] Line 1 of "The prompt": the recurring unit-of-work phrase (e.g. component type, endpoint, screen, model field)
- [ ] Part 1: "[PROJECT-SPECIFIC unit of work]"
- [ ] Part 2: "[PROJECT-SPECIFIC unit]" and the "[units/features/capabilities]" list

---

## The prompt

You are auditing this project's own development history to find every place a "new component," "new feature," or "new [PROJECT-SPECIFIC: the recurring unit of work in this codebase — e.g. component type, endpoint, screen, model field, CLI subcommand, message/event type, game entity type, infrastructure resource]" has ever needed to touch — including places that were touched *late* or *after a bug was found* rather than up front. Do not rely on your general sense of good practice — ground every item in something that actually happened in this codebase, by reading its real history (commits, session notes, CLAUDE.md, changelogs). Where you're not sure something is a real touchpoint, say so explicitly rather than guessing.

When you ask the user anything — one of this prompt's own scripted questions or something that comes up along the way — phrase it in plain language a non-specialist could follow. Say what's actually being decided before naming any internal mechanism, rule, or file involved. The person commissioned this audit; they shouldn't need to already track its internals to answer a question about their own project.

**If there's no git.** The commit conventions in Part 4 only make sense where commits exist — if this project doesn't use git (or any VCS), skip Part 4's commit-message conventions entirely and note in the checklist that gating will happen via a manually-run command instead (the Gate-Check Implementation prompt builds this). The touchpoint logic in Part 1 and the CLAUDE.md/README checks in Part 2 apply regardless of VCS or its absence — those aren't commit-shaped, they're about whether the code and docs changed together.


### Scope — Enumerate every surface first

Check for `PROJECT_PROFILE.md` first — if present (from the discovery prompt), use its surface list as a starting point rather than re-enumerating from scratch, but re-verify it's still accurate rather than trusting it blindly if time has passed since it was generated. If it's not present, or looks stale, identify every distinct application surface in this repo by its actual top-level folders/packages (e.g. user-facing app, admin panel, demo site, internal tooling, or independent packages in a monorepo) — don't assume the project is a single app. Confirm you'll audit all of them, not just the first or most prominent one. Note whether surfaces share the same registries/subsystems (e.g. one shared component registry used by both the main app and admin) or have separate ones per surface, since that changes what counts as a touchpoint — a shared registry means one miss affects every surface; separate registries mean the same kind of change may need to happen independently in each.

Carry this per-surface breakdown through every part below — checklist items should say which surface(s) they apply to, and if the same touchpoint category exists independently per surface, list it once per surface rather than merging it into one generic item that could hide a gap in the surface not currently being worked on.

### Part 0 — Inventory what already exists

Before building anything new, inventory the gate checks, CI steps, and CLAUDE.md instructions that already exist. For each one, note what it actually verifies — read its logic, don't infer from its name or comments — and what it does not. Do not assume a blank slate.

Also check for `./sentinel-notes/TODO.md` and any `[issue]-design-brief.md` files from a prior design-quality audit pass. If present, read the "candidate gate-check items" it flagged and fold any still-relevant ones into the Part 1 touchpoint list and Part 3 checklist, rather than starting Part 1 from scratch as if no prior audit happened.

As you build the Part 1 touchpoint list and the Part 2 CLAUDE.md and README requirements, cross-reference every item against this existing-checks inventory and mark it one of:

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

### Part 2 — CLAUDE.md and README gate checks (specific requirement)

Add both `CLAUDE.md` and the README as their own explicit checklist categories, not folded into general docs — they serve different purposes and need separate gates.

`CLAUDE.md` is this project's authoritative internal record of features, conventions, and architecture — it's what future Claude Code sessions rely on for accurate context. For every commit that adds or changes a [PROJECT-SPECIFIC unit], feature, or architectural decision, the gate check should verify `CLAUDE.md` was touched in the same commit — and if it wasn't, block or warn. This is the higher-priority of the two gates, since drift here corrupts every future session's and every future audit's starting context, not just a human reader's understanding.

The README is the public-facing description of the project — its job is to stay accurate, not to serve as the authoritative source. For every commit that changes user-facing behavior, setup, or capabilities, the gate check should verify the README was touched in the same commit if the change affects what it documents. Specifically check whether the README documents:

- The current list of supported [units/features/capabilities]
- Any user-facing feature list or capabilities section
- Setup/usage instructions, if the change affects how the project is run, built, or configured
- Anything the README currently claims that's now stale

If either file doesn't have clear sections for these, propose a structure that makes "did the file get updated" mechanically checkable rather than a judgment call.

### Part 3 — Deliverables

Produce:

1. **`INTEGRATION_CHECKLIST.md`** — the touchpoint inventory from Part 1, the CLAUDE.md and README requirements from Part 2, and the Part 0 coverage labels — written as an actual checklist, organized by subsystem, with the silent-vs-loud-failure note kept per item.
2. **An updated gate-check step** (describe the logic in plain terms first, before writing any script) that, on each relevant commit, cross-references the diff against `INTEGRATION_CHECKLIST.md` and flags any category that wasn't touched but plausibly should have been — including CLAUDE.md and README as separate categories. This gate check must run as an automated process that occurs before committing, not a manual step someone has to remember to run, and must fold in the commit conventions from Part 4 below and the exception mechanism from Part 5 below. It must also describe a full-repo scan mode, separate from the diff-scoped commit-time check — the commit-time check only catches new violations in what's being committed, so it structurally cannot catch drift from git history, manual edits outside a commit, or an interaction between two separately-valid commits. Don't propose running the full scan on every commit — it's slower, and paying that cost every commit either discourages small commits or trains people to bypass the hook. Propose a CI-scheduled job if the project has CI, or a `pre-push` hook otherwise, so the full scan runs automatically without adding friction to every commit. For every flagged violation, the output must be actionable: name the specific rule/category violated, the exact file (and line, when the check is diff/grep-based), and the required correction or the self-review question to resolve it — not just which category was flagged.
3. **A short "known gaps" section** listing anything flagged as a real touchpoint but not gateable mechanically, so it's a visible tracked risk rather than a silent one.

Before presenting these deliverables as complete, verify every part above (0–2) has an explicit entry in the output, not silence. If any portion of this audit was delegated to a subagent, sub-session, or background task, check its output against every part of this prompt explicitly before accepting it — a delegate returning early or silently dropping a section is indistinguishable from a clean pass unless you check.

If git is in use, `INTEGRATION_CHECKLIST.md` and any updates to `sentinel-notes/TODO.md` are new or modified files at this point. Ask plainly whether the user wants them committed now, and pushed if that fits their workflow, rather than leaving them sitting uncommitted. Never commit or push without an explicit yes.

### Part 4 — Commit conventions

Check `PROJECT_PROFILE.md` first (if present) for a detected existing commit-message convention. If the project already has a real, consistent pattern in its own history, propose matching it as the primary option when you ask, rather than presenting a blank slate of choices — matching what's already there is usually the right default for an established project. Then ask the user directly what commit message style they prefer — don't assume terse one-liners or any other specific style is the default. A short set of options to offer: whatever convention was detected (if any); terse one-line summaries with no body unless truly necessary; Conventional Commits format (`feat:`, `fix:`, `chore:` prefixes); detailed narrative descriptions; or their own custom convention. If they have no preference and nothing was detected, terse subject + optional short bullets is a reasonable fallback, but say so explicitly as a fallback rather than presenting it as the norm. Also ask whether they prefer a single commit per session as the default or are comfortable with multiple atomic commits for larger changes — teams and individuals genuinely differ here.

Record whatever the user chooses in the checklist so the Gate-Check Implementation prompt enforces the same actual preference rather than a generic assumption. The following are separate from style and apply regardless of what the user picks, since they're hygiene, not taste:

- Commit messages must never contain co-author notes, "Generated with Claude Code" attribution, or session-link trailers (e.g. `Claude-Session:`) — these must be actively stripped or rejected by the hook itself, not merely instructed against, since your own settings-level attribution controls are documented as unreliable. Implement this as a `commit-msg` hook that deletes or blocks any line matching these patterns, so it holds regardless of whether your in-session behavior complies that day.

This last point matters enough to say plainly: instructing yourself not to add these lines is not sufficient on its own — treat the hook as the actual enforcement mechanism and the instruction as, at best, a first pass that the hook backstops.

### Part 5 — Exceptions

A gate check needs a sanctioned third outcome besides pass and silently-let-through-fail: a documented, owned, expiring exception. When a checklist item genuinely can't be satisfied for a legitimate reason, the gate check should accept a recorded exception instead of either blocking forever or silently passing. Design this as a small file — `sentinel-exceptions.json` unless the project already has its own naming convention worth matching instead — that the gate check reads before failing a commit, where each entry requires: the specific checklist category/rule it exempts, a narrow file scope (no catch-all globs), a concrete reason, an owner, and a review-by date. An expired entry fails the build the same as having no exception at all. Exceptions are not something Claude Code grants itself silently mid-session — they get proposed as part of the "known gaps" deliverable (Part 3, item 3) for the user to actually add, not created and self-approved in the same pass.

Not every legitimate exception is a standing one, and forcing all of them through the file-based mechanism above is the wrong fit for a one-off case — a single commit that's genuinely large for a good reason doesn't need an owner or an expiry date, since it only ever applies to that one already-made commit. For a per-instance judgment call like this, the lighter-weight equivalent is a required, reasoned override recorded directly in the artifact itself — e.g. a commit trailer like `Sentinel-Override: <reason>` — rather than a standing exceptions-file entry. The principle that matters here generalizes past commits: when a check's failure condition sometimes reflects a legitimate judgment call rather than a pure mechanical violation, the fix is never to downgrade the check to a non-blocking warning. A warning is structurally the same as an unenforced instruction — it can be scrolled past, and repeated exposure to it erodes exactly the way natural-language commit-style instructions already proved unreliable elsewhere in this project. Keep the check blocking by default, and require a deliberate, reasoned, recorded override instead — one that costs a small amount of real friction each time and leaves a permanent trace of why, rather than a warning that fades into background noise after the first several times it's seen.

Do not implement or modify any gate-check scripts yet. Stop after producing the deliverables above (including the Part 4 conventions and Part 5 exception mechanism folded into deliverable 2) and wait for review.

---

## Before using this on a new project

Replace every `[PROJECT-SPECIFIC]` bracket and the eight generic layer categories in Part 1 with that project's actual architecture before running this — a truly generic list (as written above) is a starting lens, not a substitute for reading the real codebase. The value of this framework comes from grounding every item in what actually happened in *that* project's history, the same way the Ryewired version was grounded in the electrolytic-cap stripe bug and the rail-break incident rather than generic advice. If your output for a new project reads like it could apply to any codebase, that's a sign you under-audited, not that the framework worked well.
