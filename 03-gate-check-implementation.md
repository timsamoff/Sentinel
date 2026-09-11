# Sentinel: Gate-Check Implementation Prompt (Portable — for any Claude Code project)

This prompt is the one that actually implements — the prior two deliberately stop at "propose and wait for review." Confirm with the user that the proposals have been reviewed and approved before running this, if that hasn't already happened.

---

## The prompt

You are implementing the gate-check proposals from prior audit passes as real, working, automated checks — not proposing new ones from scratch. Where a proposal is unclear, stale, or turns out not to hold up against the current codebase, say so and adjust rather than implementing it blindly just because it was proposed.

**If there's no git (or the user doesn't want hooks).** Check whether this project actually uses git before assuming a `commit-msg`/pre-commit hook is the right mechanism. If it doesn't — no VCS at all, a different VCS, or the user simply prefers not to use hooks — build a standalone manual command instead (a script invocable as `npm run sentinel:check`, `python sentinel_check.py`, `./sentinel-check.sh`, or whatever fits this project's stack) that runs every check in one pass and prints the same actionable output a hook would. This is not a lesser fallback bolted on as an afterthought — treat it as a first-class outcome of Part 2, and make sure the person is told plainly, in the Deliverables summary, that without a hook there's no automatic trigger: they must run this command themselves before considering changes done, since nothing else will remind them. If the project does use git and hooks are wanted, still create the manual command alongside the hook — it's useful for confirming a check works, and for anyone who wants to run it without committing.


### Scope — Enumerate every surface first

Identify every distinct application surface in this repo by its actual top-level folders/packages (or independent packages in a monorepo), the same way prior audits did. Confirm whether gate checks should be shared across surfaces or implemented per-surface, based on whether the surfaces share the same registries/subsystems (established in the prior audits' Scope sections, if available) or run independently.

### Part 0 — Locate the source material

If `INTEGRATION_CHECKLIST.md` doesn't exist in the project, stop here and tell the user to run the Integration Audit prompt first — don't fabricate a checklist from scratch in this prompt, since re-validating and implementing proposals is a different task from generating them in the first place.

Read, in full:

- `INTEGRATION_CHECKLIST.md` and its gate-check step description (from the Integration Audit's Part 3, deliverable 2)
- `./sentinel-notes/TODO.md` and any `[issue]-design-brief.md` files, specifically the "candidate gate-check items" flagged by the Design & Code Quality Audit
- Any existing `sentinel-exceptions` file, if the exceptions mechanism was already partially set up
- CLAUDE.md, for anything relevant to how commits/gating already work in this project
- `PROJECT_PROFILE.md`, if present — reuse its "existing automation" finding instead of re-detecting the project's automation mechanism from scratch in the step below; only re-check if it looks stale or absent

Also identify what automation mechanism this project already uses (native git hooks, husky, pre-commit framework, a CI pipeline config, npm/package scripts) rather than introducing a second, competing system — the new checks should slot into whatever's already there. Confirm first whether this project uses git at all — if not, or if the person prefers not to use hooks, the manual-command approach described above is the mechanism, not a fallback to apologize for. If nothing exists yet and git is in use, propose the simplest hook-based mechanism that fits this project's stack and say why.

### Part 1 — Re-validate every proposal against the current codebase

Time has passed since the proposals were written, and code may have changed. For every proposed gate-check item, re-check it against the actual current state of the codebase — across all directories/surfaces identified in Scope — before implementing it:

- Does the pattern/touchpoint the proposal describes still exist as described?
- Would implementing the check exactly as originally proposed produce false positives or false negatives against the codebase as it stands right now?
- Has anything changed (a refactor, a new pattern introduced since the audit) that makes the proposal stale, wrong, or in need of adjustment?

Update or correct each proposal as needed before moving to implementation. Note any proposal you're deliberately not implementing and why (too vague to make mechanical, no longer applicable, superseded by something else found in this re-check).

Before proceeding to Part 2, present the re-validated list to the user and get explicit confirmation for anything that changed from its originally proposed form — an adjusted, deferred, or dropped item was not what the user actually approved when they reviewed `INTEGRATION_CHECKLIST.md`, so implementing it without a fresh confirmation would silently bypass their review. Items that came through re-validation unchanged don't need re-asking; only the deltas do.

### Part 2 — Implement

For each validated and confirmed proposal, write the actual check using the automation mechanism identified in Part 0.

Every check must:

- Run automatically before commit if a hook is the mechanism, or be invocable as a single manual command if it isn't (see the no-git note above) — either way, not something scattered across multiple steps someone has to remember to run
- Only gate the diff of the commit (or, for the manual command with no commit boundary, the diff against the last time it was run, or the whole working tree if that's clearer for this project) — not the entire codebase's pre-existing state; a newly implemented check should not suddenly block on violations that already existed before this check existed
- Output actionable violations in the established format: the specific rule/category violated, the exact file (and line, where the check is diff/grep-based), and the required correction
- Respect the exceptions mechanism — read the exceptions file if one is designed/exists, honor unexpired entries, fail exactly as if no exception existed once an entry's review-by date has passed
- Apply per-surface correctly, per the Scope determination (one shared check, or one instance per surface, as appropriate)

Common blind spots to check for and avoid in every check you write, regardless of what it's checking:

- Justify every file/path exclusion (skip-list, allowlist) per rule, not per file. A reason to exclude a file from one rule a script enforces does not automatically justify excluding it from every other rule the same script enforces — e.g. a definitions file (like a central CSS variables file) legitimately repeats values and should be excluded from a duplication check, but it can still *reference* an undefined value inside its own rules and must NOT be excluded from a usage-validity check just because it was excluded from the duplication one. Before finalizing any exclusion, write out which specific rule it's exempting and confirm the file genuinely can't violate that specific rule — not just that it seemed reasonable to skip generally.
- Don't assume a file only ever plays one role. The exclusion problem above generalizes: any file that both *defines* something and *uses/references* something (an index file that both exports and re-exports, a config file that sets defaults and reads other settings, a schema file that both declares and derives) can violate a rule from either role — check both, don't exempt the file just because its primary role seems safe.
- Check deletions, not just additions. A check that only scans added lines will miss a violation introduced by removing something protective — a null check, a sanitizer call, a bounds check, an early-return guard. If the rule is about a protection existing, verify the diff didn't remove it, not just that it didn't add a bad pattern.
- Resolve cross-file references against the whole codebase, not just the changed file. Anything with a "this name refers to something defined elsewhere" shape (a variable, an import, a translation key, a config key, a route name, a database column) needs its check to look at the actual current source of truth for that name, not just pattern-match within the diff's own file.
- Fail loudly, never silently, when the check itself can't run. A parse error, a missing file, a failed tool invocation, or a caught exception must fail the check (or at minimum flag "unable to verify" as its own distinct outcome) — never let error-handling that swallows a failure quietly resolve to a pass. Audit for patterns like a shell `|| true` or a bare `except: pass` sitting between the check's logic and its final exit code.
- Don't let performance shortcuts correlate with risk. If a check samples, truncates, or skips very large diffs for speed, that's exactly backwards — large, complex changes are statistically the ones most likely to hide the problem the check exists to catch, not the ones safe to skip.
- Prefer patterns over enumerated file lists. A check hardcoded to a fixed list of watched files/directories silently stops covering anything added later. Where the touchpoint inventory names a *kind* of file (all component definitions, all route handlers, all translation files), write the check against that pattern, not a snapshot of today's file list.
- Translate every vague adjective into a concrete, testable number before implementing. A proposal or existing instruction phrased as "brief," "short," "single-sentence," or "concise" is not yet implementable — you (or a future session) will drift back to whatever "brief" means to you that day, the same way natural-language instructions against co-author trailers proved unreliable. Pick an explicit numeric threshold (a character or line-count cap is the usual fit for text conventions) and enforce that instead. For commit message conventions specifically, a reasonable default absent other guidance: subject line capped around 50-72 characters, body bullets capped around 72-80 characters — but confirm the exact numbers fit how this project's user actually wants to read their own commit log, rather than assuming the default is right for them.

Implement the commit-convention checks as a `commit-msg` hook where git is in use, mechanically enforcing rather than merely instructing: subject line is a single line with no wrapping, capped at the character limit settled on above; a commit with nothing more to say has no body at all; if a body exists, every line is its own single-sentence bullet capped at the body character limit settled on above, never a narrative paragraph; and any co-author note, "Generated with Claude Code" attribution, or session-link trailer (e.g. `Claude-Session:`) is stripped or the commit is rejected outright. Where there's no git (or no hook), these specific commit-message checks have no equivalent to enforce — a manual command has no commit message to inspect — so skip them there rather than inventing a strained analog; the CLAUDE.md-touched and README-touched checks below still apply regardless, since those are about the code changes themselves, not the commit metadata. Treat instructing yourself not to add these as insufficient on its own — your own settings-level attribution controls are documented as unreliable, so the hook itself is the enforcement, not a suggestion you're trusted to follow. Also implement the CLAUDE.md-touched and README-touched checks as real enforced checks here, not just descriptions — remember CLAUDE.md is the higher-priority of the two per the Integration Audit's Part 2, since it's the authoritative record future sessions rely on.

### Part 3 — Test each check

For every newly implemented check, verify it actually works: deliberately construct a violation (a throwaway change, a scratch commit you can discard, or a dry-run/lint-only invocation if the mechanism supports one) and confirm the check fires with the correct actionable message. Then confirm a compliant change passes cleanly with no false positive.

For any check that has a file/path exclusion, this is not enough — also construct an adversarial test specifically inside the excluded file: a violation of the check's actual rule, placed in the file the check skips, and confirm honestly whether the check catches it or not. If it doesn't, the exclusion is wrong (see Part 2) and needs narrowing before this check ships, not a note to fix later — a check with a known, un-narrowed blind spot in the exact file most likely to need it is worse than not having the check, since it creates false confidence. More generally: don't stop at the happy-path violation test for any check — think about what a change could look like that satisfies the letter of the check's logic while still doing the thing the check exists to prevent, and test that too. This includes testing each of the code-agnostic gaps from Part 2 where relevant to the specific check: does it catch a violation introduced via deletion, not just addition; does it correctly resolve a cross-file reference rather than only pattern-matching within the diff; does it catch a violation in a file playing its secondary/using role, not just the primary/defining role you tested first; does a large/complex synthetic diff still get fully checked rather than shortcut; does a forced tool failure inside the check surface as a failure rather than a silent pass.

Note any check you couldn't safely live-test and explain why, rather than silently skipping verification.

### Part 4 — Handle pre-existing violations and update tracking

Run each new check in a report-only pass against the current state of the codebase (not to block anything, just to see what it finds). Any pre-existing violation a new check surfaces should be logged as a backlog item in `sentinel-notes/TODO.md`, not auto-fixed as part of this task — this task implements the gate, it doesn't retroactively bring the whole codebase into compliance.

Update `INTEGRATION_CHECKLIST.md` to mark each implemented item's status accordingly (e.g. implemented / partially implemented / deferred with reason), and update `sentinel-notes/TODO.md` to note which candidate gate-check items from the design audit were implemented, adjusted, or rejected, with a one-line reason for each.

### Deliverables

Produce a summary covering: what was implemented and where (file paths for the actual check logic and the hook/CI config/manual command wiring it in), what was changed from the original proposal during Part 1's re-validation and why, what was deferred and why, the backlog of pre-existing violations found in Part 4, and any exceptions that were proposed rather than auto-approved. If there's no git hook triggering these checks automatically, say so explicitly and plainly here, not just in Part 0/2 — tell the person the exact command to run and that nothing will remind them to run it, since this is the one piece of information a manual-command setup can't enforce on its own. This task does implement — unlike the prior two audits — but stop at the gate-check implementation itself: don't refactor existing code to satisfy the new checks, and don't auto-resolve the Part 4 backlog. Wait for review on the backlog and any deferred items before touching either.

Before presenting this summary as complete, verify every part above (0–4) has an explicit entry in the output, not silence. If any portion of this work was delegated to a subagent, sub-session, or background task, check its output against every part of this prompt explicitly before accepting it — a delegate returning early or silently dropping a proposal's validation or a check's implementation is indistinguishable from a genuinely clean pass unless you check.
