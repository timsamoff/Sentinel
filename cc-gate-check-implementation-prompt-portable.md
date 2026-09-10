# Gate-Check Implementation Prompt (Portable — for any Claude Code project)

Run this after both the Design & Code Quality Audit and the Integration Audit have already run and produced their proposals. This prompt is the one that actually implements — the prior two deliberately stop at "propose and wait for review." Confirm with the user that the proposals have been reviewed and approved before running this, if that hasn't already happened.

---

## The prompt

You are implementing the gate-check proposals from prior audit passes as real, working, automated checks — not proposing new ones from scratch. Where a proposal is unclear, stale, or turns out not to hold up against the current codebase, say so and adjust rather than implementing it blindly just because it was proposed.

### Scope — Enumerate every surface first

Identify every distinct application surface in this repo by its actual top-level folders/packages, the same way prior audits did. Confirm whether gate checks should be shared across surfaces or implemented per-surface, based on whether the surfaces share the same registries/subsystems (established in the prior audits' Scope sections, if available) or run independently.

### Part 0 — Locate the source material

Read, in full:

- `INTEGRATION_CHECKLIST.md` and its gate-check step description (from the Integration Audit's Part 3, deliverable 2)
- `./production_notes/todo.md` and any `[issue]-design-brief.md` files, specifically the "candidate gate-check items" flagged by the Design & Code Quality Audit
- Any existing `gate-exceptions` file, if the exceptions mechanism was already partially set up
- CLAUDE.md, for anything relevant to how commits/gating already work in this project

Also identify what automation mechanism this project already uses (native git hooks, husky, pre-commit framework, a CI pipeline config, npm/package scripts) rather than introducing a second, competing system — the new checks should slot into whatever's already there. If nothing exists yet, propose the simplest mechanism that fits this project's stack and say why.

### Part 1 — Re-validate every proposal against the current codebase

Time has passed since the proposals were written, and code may have changed. For every proposed gate-check item, re-check it against the actual current state of the codebase — across all directories/surfaces identified in Scope — before implementing it:

- Does the pattern/touchpoint the proposal describes still exist as described?
- Would implementing the check exactly as originally proposed produce false positives or false negatives against the codebase as it stands right now?
- Has anything changed (a refactor, a new pattern introduced since the audit) that makes the proposal stale, wrong, or in need of adjustment?

Update or correct each proposal as needed before moving to implementation. Note any proposal you're deliberately not implementing and why (too vague to make mechanical, no longer applicable, superseded by something else found in this re-check).

### Part 2 — Implement

For each validated proposal, write the actual check using the automation mechanism identified in Part 0. Every check must:

- Run automatically before commit — not a manual step someone has to remember to invoke
- Only gate the diff of the commit being made, not the entire codebase's pre-existing state — a newly implemented check should not suddenly block on violations that already existed before this check existed
- Output actionable violations in the established format: the specific rule/category violated, the exact file (and line, where the check is diff/grep-based), and the required correction
- Respect the exceptions mechanism — read the exceptions file if one is designed/exists, honor unexpired entries, fail exactly as if no exception existed once an entry's review-by date has passed
- Apply per-surface correctly, per the Scope determination (one shared check, or one instance per surface, as appropriate)

Implement the commit-convention checks as a hook that mechanically enforces, not merely instructs: subject line is a single line with no wrapping; a commit with nothing more to say has no body at all; if a body exists, every line is its own short single-sentence bullet, never a narrative paragraph; and any co-author note, "Generated with Claude Code" attribution, or session-link trailer (e.g. `Claude-Session:`) is stripped or the commit is rejected outright. Treat instructing CC not to add these as insufficient on its own — CC's settings-level attribution controls are documented as unreliable, so the hook itself is the enforcement, not a suggestion CC is trusted to follow. Also implement the README-touched-when-user-facing-change check as a real enforced check here, not just a description.

### Part 3 — Test each check

For every newly implemented check, verify it actually works: deliberately construct a violation (a throwaway change, a scratch commit you can discard, or a dry-run/lint-only invocation if the mechanism supports one) and confirm the check fires with the correct actionable message. Then confirm a compliant change passes cleanly with no false positive. Note any check you couldn't safely live-test and explain why, rather than silently skipping verification.

### Part 4 — Handle pre-existing violations and update tracking

Run each new check in a report-only pass against the current state of the codebase (not to block anything, just to see what it finds). Any pre-existing violation a new check surfaces should be logged as a backlog item in `production_notes/todo.md`, not auto-fixed as part of this task — this task implements the gate, it doesn't retroactively bring the whole codebase into compliance.

Update `INTEGRATION_CHECKLIST.md` to mark each implemented item's status accordingly (e.g. implemented / partially implemented / deferred with reason), and update `production_notes/todo.md` to note which candidate gate-check items from the design audit were implemented, adjusted, or rejected, with a one-line reason for each.

### Deliverables

Produce a summary covering: what was implemented and where (file paths for the actual check logic and the hook/CI config wiring it in), what was changed from the original proposal during Part 1's re-validation and why, what was deferred and why, the backlog of pre-existing violations found in Part 4, and any exceptions that were proposed rather than auto-approved. This task does implement — unlike the prior two audits — but stop at the gate-check implementation itself: don't refactor existing code to satisfy the new checks, and don't auto-resolve the Part 4 backlog. Wait for review on the backlog and any deferred items before touching either.