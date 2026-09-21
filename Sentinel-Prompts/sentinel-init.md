# Sentinel: Init (Portable — runs 00 through 03 in sequence)

**Version 1.0**

This is a thin orchestrator, not a fifth prompt with its own logic. It exists to remove the friction of manually pasting four separate files one at a time — it does not change what any of them do, and it does not collapse or skip the review checkpoints each one already has. If you'd rather run the four prompts individually, or jump into the middle of the sequence, use them directly; this file is a convenience wrapper around the exact same process.

**Requires all four Sentinel prompt files to be present and readable in this project** (`00-project-discovery.md`, `01-design-quality-audit.md`, `02-integration-audit.md`, `03-gate-check-implementation.md`). If any are missing, say so and stop rather than trying to reconstruct their content from memory.

---

## The prompt

You are running the full Sentinel sequence against this project, one stage at a time, in order. Each stage is a complete, independent prompt with its own instructions, its own confirmation points, and its own deliverable — read and follow that stage's file in full when you reach it, exactly as if the user had pasted it to you directly. This orchestrator only sequences the handoff between stages; it does not add, remove, or soften anything any stage already asks for.

**Stop and wait for the user at every point a stage's own instructions call for a stop or a confirmation.** This includes, but isn't limited to: Part 2's direct questions in `00-project-discovery.md`, the re-validation confirmation in `03-gate-check-implementation.md`'s Part 1, the commit/push confirmations at the close of any stage that leaves file changes behind, and the commit-autonomy preference question at the close of `03`. Running four prompts back to back is not license to treat their confirmation points as rhetorical — a stage that would have stopped and asked if pasted on its own must still stop and ask here.

### Step 1 — Run `00-project-discovery.md` in full

Follow it exactly as written, including its Part 0 (fresh vs. update run) and Part 0a (blank vs. populated project) branching. Produce `PROJECT_PROFILE.md` as its Deliverable section specifies.

Before continuing to Step 2, check what `00`'s own "how to use this" closing note actually said for this run:

- **Fresh run, populated project:** continue to Step 2.
- **Update run:** `00` will have named which of prompts 1-3 are actually worth re-running given what changed. Only run those, in order, skipping the rest — don't default to running all of 1-3 just because this orchestrator lists them in sequence. If `00` said only `03` needs re-running, go straight to Step 4.
- **Blank/near-empty project run:** `00` will have said prompts 1 and 2 have little to audit yet. Tell the user plainly that you're skipping Steps 2-3 for that reason, and ask whether they still want `03` run now to seed gate-check enforcement from the conventions `00` just gathered, or whether they'd rather stop here and run the rest of this sequence later once real code exists. Don't run `03` on a blank project without that confirmation — building enforcement infrastructure is a bigger step than the discovery pass that precedes it.

### Step 2 — Run `01-design-quality-audit.md` in full

Fill its `[PROJECT-SPECIFIC]` brackets from `PROJECT_PROFILE.md` per `00`'s own instructions — don't guess fresh or re-detect what `00` already recorded. Follow `01` exactly as written, including any point where it stops to ask the user something directly (e.g. whether to create a design document if none was found).

### Step 3 — Run `02-integration-audit.md` in full

Same handoff: fill its brackets from `PROJECT_PROFILE.md`, follow it exactly as written, including its own confirmation points (commit-message style, granularity preference, and the rest of its Part 4/5 questions).

### Step 4 — Run `03-gate-check-implementation.md` in full

This is the only stage of the four that implements. Confirm, per its own opening line, that the proposals from Steps 2-3 (or from a prior run, on an update path) have been reviewed and approved before proceeding — this orchestrator running the stages back to back does not itself constitute that review; the user still needs to have actually looked at what `01` and `02` produced. Follow `03` exactly as written, including its Part 1 re-validation confirmation and its closing commit/push and autonomy-preference questions.

### Deliverable

There is no separate output from this orchestrator itself — the four stages' own deliverables (`PROJECT_PROFILE.md`, the design-quality report, `INTEGRATION_CHECKLIST.md`, the implemented gate-check plus `03`'s closing summary) are the actual output. When all steps that were run in this pass are complete, give one short closing summary naming which of the four stages actually ran (some may have been skipped per Step 1's branching), where each stage's deliverable landed, and what the resulting `03` completion message (if reached) said about next steps — don't make the user reconstruct that from scrolling back through the whole session.
