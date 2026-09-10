# Deep Integration Audit Prompt (Portable — for any Claude Code project)

Paste this to Claude Code as its own session/task, separate from feature work. Before using it on a new project, fill in the `[PROJECT-SPECIFIC]` bracket below with that project's real subsystems — this template deliberately does not guess them, since a generic guess is worse than no guess (see note at the end).

**Pre-flight — confirm every bracket below is filled in before running this:**
- [ ] Line 1 of "The prompt": the recurring unit-of-work phrase (e.g. component type, endpoint, screen, model field)
- [ ] Part 1: "[PROJECT-SPECIFIC unit of work]"
- [ ] Part 2: "[PROJECT-SPECIFIC unit]" and the "[units/features/capabilities]" list

---

## The prompt

You are auditing this project's own development history to find every place a "new component," "new feature," or "new [PROJECT-SPECIFIC: the recurring unit of work in this codebase — e.g. component type, endpoint, screen, model field]" has ever needed to touch — including places that were touched *late* or *after a bug was found* rather than up front. Do not rely on your general sense of good practice — ground every item in something that actually happened in this codebase, by reading its real history (commits, session notes, CLAUDE.md, changelogs). Where you're not sure something is a real touchpoint, say so explicitly rather than guessing.

### Scope — Enumerate every surface first

Before auditing anything, identify every distinct application surface in this repo by its actual top-level folders/packages (e.g. user-facing app, admin panel, demo site, internal tooling) — don't assume the project is a single app. Confirm you'll audit all of them, not just the first or most prominent one. Note whether surfaces share the same registries/subsystems (e.g. one shared component registry used by both the main app and admin) or have separate ones per surface, since that changes what counts as a touchpoint — a shared registry means one miss affects every surface; separate registries mean the same kind of change may need to happen independently in each.

Carry this per-surface breakdown through every part below — checklist items should say which surface(s) they apply to, and if the same touchpoint category exists independently per surface, list it once per surface rather than merging it into one generic item that could hide a gap in the surface not currently being worked on.

### Part 0 — Inventory what already exists

Before building anything new, inventory the gate checks, CI steps, and CLAUDE.md instructions that already exist. For each one, note what it actually verifies — read its logic, don't infer from its name or comments — and what it does not. Do not assume a blank slate.

Also check for `./production_notes/todo.md` and any `[issue]-design-brief.md` files from a prior design-quality audit pass. If present, read the "candidate gate-check items" it flagged and fold any still-relevant ones into the Part 1 touchpoint list and Part 3 checklist, rather than starting Part 1 from scratch as if no prior audit happened.

As you build the Part 1 touchpoint list and the Part 2 README requirement, cross-reference every item against this existing-checks inventory and mark it one of:

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
- **Rendering/presentation layer** — anywhere the unit is displayed, including edge cases like orientation, fallback rendering for old/legacy data, and default states
- **Interaction/control layer** — anywhere user or caller input reaches the unit, including any permission/lock/access-control lists that need explicit inclusion or exclusion per unit
- **Core logic/computation layer** — anywhere the unit's behavior is computed or validated, including any place a value gets "resolved" through more than one possible source (defaults vs. overrides vs. computed)
- **Persistence layer** — save/load, serialization, database schema, migrations — especially backward compatibility for data saved before a field existed
- **Wiring/registration layer** — anywhere new units need to be hooked into event systems, startup sequences, or dependency injection
- **Cross-cutting assumptions** — anywhere the code assumes something generic ("any X with property Y") vs. anywhere it's still hardcoded by name — flag every hardcoded-by-name spot as a known gap
- **Documentation that isn't the README** — design docs, architecture notes, changelogs, code comments describing intent — do they still match what's implemented?

### Part 2 — README gate check (specific requirement)

Add the README as its own explicit checklist category, not folded into general docs. For every commit that adds or changes a [PROJECT-SPECIFIC unit], feature, or user-facing behavior, the gate check should verify the README was touched in the same commit — and if it wasn't, block or warn rather than silently pass. Specifically check whether the README documents:

- The current list of supported [units/features/capabilities]
- Any user-facing feature list or capabilities section
- Setup/usage instructions, if the change affects how the project is run, built, or configured
- Anything the README currently claims that's now stale

If the README doesn't have clear sections for these, propose a structure that makes "did the README get updated" mechanically checkable rather than a judgment call.

### Part 3 — Deliverables

Produce:

1. **`INTEGRATION_CHECKLIST.md`** — the touchpoint inventory from Part 1, the README requirement from Part 2, and the Part 0 coverage labels — written as an actual checklist, organized by subsystem, with the silent-vs-loud-failure note kept per item.
2. **An updated gate-check step** (describe the logic in plain terms first, before writing any script) that, on each relevant commit, cross-references the diff against `INTEGRATION_CHECKLIST.md` and flags any category that wasn't touched but plausibly should have been — including README. This gate check must run as an automated process that occurs before committing, not a manual step someone has to remember to run, and must fold in the commit conventions from Part 4 below and the exception mechanism from Part 5 below. For every flagged violation, the output must be actionable: name the specific rule/category violated, the exact file (and line, when the check is diff/grep-based), and the required correction or the self-review question to resolve it — not just which category was flagged.
3. **A short "known gaps" section** listing anything flagged as a real touchpoint but not gateable mechanically, so it's a visible tracked risk rather than a silent one.

### Part 4 — Commit conventions

Fold these commit conventions into the automated gate-check process described in Part 3, deliverable 2:

- The subject line (first line) must stay a single line — brief, no wrapping, no multi-sentence subject.
- The subject line must never overflow into a body — a commit with nothing more to say should be exactly one line, full stop.
- If a body is genuinely needed, every line in it must be its own short, single-sentence bullet — never a narrative paragraph, never a multi-sentence bullet, never prose that reads as an explanation rather than a fact.
- Multiple logical commits in one session are acceptable when changes are large enough to warrant splitting, but default to a single commit as the rule of thumb — don't split reflexively.
- Commit messages must never contain co-author notes, "Generated with Claude Code" attribution, or session-link trailers (e.g. `Claude-Session:`) — these must be actively stripped or rejected by the hook itself, not merely instructed against, since CC's own settings-level attribution controls are documented as unreliable. Implement this as a `commit-msg` hook that deletes or blocks any line matching these patterns, so it holds regardless of whether CC's in-session behavior complies that day.

This last point matters enough to say plainly: instructing CC not to add these lines is not sufficient on its own — treat the hook as the actual enforcement mechanism and the instruction as, at best, a first pass that the hook backstops.

### Part 5 — Exceptions

A gate check needs a sanctioned third outcome besides pass and silently-let-through-fail: a documented, owned, expiring exception. When a checklist item genuinely can't be satisfied for a legitimate reason, the gate check should accept a recorded exception instead of either blocking forever or silently passing. Design this as a small file (e.g. `gate-exceptions.json` or similar, your call) that the gate check reads before failing a commit, where each entry requires: the specific checklist category/rule it exempts, a narrow file scope (no catch-all globs), a concrete reason, an owner, and a review-by date. An expired entry fails the build the same as having no exception at all. Exceptions are not something CC grants itself silently mid-session — they get proposed as part of the "known gaps" deliverable (Part 3, item 3) for the user to actually add, not created and self-approved in the same pass.

Do not implement or modify any gate-check scripts yet. Stop after producing the deliverables above (including the Part 4 conventions and Part 5 exception mechanism folded into deliverable 2) and wait for review.

---

## Before using this on a new project

Replace every `[PROJECT-SPECIFIC]` bracket and the eight generic layer categories in Part 1 with that project's actual architecture before handing this to CC — a truly generic list (as written above) is a starting lens, not a substitute for CC reading the real codebase. The value of this framework comes from CC grounding every item in what actually happened in *that* project's history, the same way the Ryewired version was grounded in the electrolytic-cap stripe bug and the rail-break incident rather than generic advice. If CC's output for a new project reads like it could apply to any codebase, that's a sign it under-audited, not that the framework worked well.