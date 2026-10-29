# Sentinel: Init (Portable — runs 00 through 03 in sequence)

**Version 1.6.1**

This is a thin orchestrator, not a fifth prompt with its own logic. It exists to remove the friction of manually pasting four separate files one at a time — it does not change what any of them do, and it does not collapse or skip the review checkpoints each one already has. If you'd rather run the four prompts individually, or jump into the middle of the sequence, use them directly; this file is a convenience wrapper around the exact same process.

**Requires all four Sentinel prompt files to be present and readable in this project** (`00-project-discovery.md`, `01-design-quality-audit.md`, `02-integration-audit.md`, `03-quality-gate-implementation.md`). If any are missing, say so and stop rather than trying to reconstruct their content from memory. Also look for leftover files from the renamed-files check in Part 0 of `00-project-discovery.md` (today, `03-gate-check-implementation.md`). If one is there, say so once, ask before deleting it, and never run it in place of the current file.

---

## The prompt

You are running the full Sentinel sequence against this project, one prompt at a time, in order. Each prompt is complete and independent, with its own instructions, its own confirmation points, and its own deliverable — read and follow that prompt's file in full when you reach it, exactly as if the user had pasted it to you directly. This orchestrator only sequences the handoff between prompts; it does not add, remove, or soften anything any prompt already asks for.

**Stop and wait for the user at every point a prompt's own instructions call for a stop or a confirmation.** This includes, but isn't limited to: Part 2's direct questions in `00-project-discovery.md`, the re-validation confirmation in `03-quality-gate-implementation.md`'s Part 1, the commit/push confirmations at the close of any prompt that leaves file changes behind, and the commit-autonomy preference question at the close of `03`. Running four prompts back to back is not license to treat their confirmation points as rhetorical — a prompt that would have stopped and asked if pasted on its own must still stop and ask here.

**This is distinct from the orchestrator's own prompt-to-prompt handoff, which defaults to proceeding rather than asking.** Once a prompt finishes and names its recommended next step, state that recommendation plainly and continue to it rather than presenting a menu and waiting for a reply — the user can redirect or stop you at any point, but the default path shouldn't require an explicit yes at every single prompt boundary just to keep moving. This applies only to *whether to advance to the next prompt*, never to a prompt's own internal questions (those still stop and wait, per the paragraph above), and never to Step 4 below specifically — confirming that `01`/`02`'s proposals have actually been reviewed before `03` implements them is a real gate, not a rhetorical pause, and stays a genuine stop-and-wait regardless of this note.

### Step 0 — Check for a newer version

Before Step 1, follow "Before Part 0 — Check for a newer version, and apply it if the user agrees" in `00-project-discovery.md`. It runs once per run of this file. If the user updates, that section ends by sending you back to the top of the new `sentinel-init.md`. Skip Step 0 there, since the check already ran, and don't continue from this copy.

### Step 1 — Run `00-project-discovery.md` in full

Follow it exactly as written, including its Part 0 (fresh vs. update run) and Part 0a (blank vs. populated project) branching. Produce `PROJECT_PROFILE.md` as its Deliverable section specifies.

Before continuing to Step 2, check what `00`'s own "how to use this" closing note actually said for this run:

- **Fresh run, populated project:** continue to Step 2.
- **Update run:** `00` will have named which of prompts 1-3 are actually worth re-running given what changed. Only run those, in order, skipping the rest — don't default to running all of 1-3 just because this orchestrator lists them in sequence. If `00` said only `03` needs re-running, go straight to Step 4.
- **Blank/near-empty project run:** `00` will have said prompts 1 and 2 have little to audit yet. Tell the user plainly that you're skipping Steps 2-3 for that reason, and that the recommended default is to continue straight to Step 4 now, seeding quality-gate enforcement from the conventions `00` just gathered rather than leaving it for later — say why (nothing to retrofit against once real code and a backlog exist, versus enforcement in place from the first real commit), then proceed on that basis. Stop and wait only if the user actually says otherwise; don't treat this as a blocking question to hold for an answer before moving. Note this is still going straight into `03`, the one prompt that writes real automated enforcement — the recommendation is about *whether to wait*, not a shortcut around the review Step 4 itself still requires below.

### Step 2 — Run `01-design-quality-audit.md` in full

Fill its `[PROJECT-SPECIFIC]` brackets from `PROJECT_PROFILE.md` per `00`'s own instructions — don't guess fresh or re-detect what `00` already recorded. Follow `01` exactly as written, including any point where it stops to ask the user something directly (e.g. whether to create a design document if none was found).

### Step 3 — Run `02-integration-audit.md` in full

Same handoff: fill its brackets from `PROJECT_PROFILE.md`, follow it exactly as written, including its own confirmation points (commit-message style, granularity preference, and the rest of its Part 4/5 questions).

### Step 4 — Run `03-quality-gate-implementation.md` in full

This is the only prompt of the four that implements. Confirm, per its own opening line, that the proposals from Steps 2-3 (or from a prior run, on an update path) have been reviewed and approved before proceeding — this orchestrator running the prompts back to back does not itself constitute that review; the user still needs to have actually looked at what `01` and `02` produced. Follow `03` exactly as written, including its Part 1 re-validation confirmation and its closing commit/push and autonomy-preference questions.

### Deliverable

There is no separate output from this orchestrator itself — the four prompts' own deliverables (`PROJECT_PROFILE.md`, the design-quality report, `INTEGRATION_CHECKLIST.md`, the implemented quality gates plus `03`'s closing summary) are the actual output. When all steps that were run in this pass are complete, give one short closing summary naming which of the four prompts actually ran (some may have been skipped per Step 1's branching), where each prompt's deliverable landed, and what the resulting `03` completion message (if reached) said about next steps — don't make the user reconstruct that from scrolling back through the whole session.
