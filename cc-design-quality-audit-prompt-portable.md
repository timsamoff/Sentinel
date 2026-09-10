# Design & Code Quality Audit Prompt (Portable — for any Claude Code project)

Run this as its own session, before the Integration Audit prompt. This one produces a report and recommendations, not a checklist gate — quality is a judgment call, not a pass/fail. Some findings from this pass may turn into new gate-check items later (e.g. "no new hardcoded hex colors"), but that decision comes after review, not automatically.

Fill in `[PROJECT-SPECIFIC]` brackets before handing this to CC.

**Pre-flight — confirm every bracket below is filled in before running this:**
- [ ] Part 0: the design-tokens/theme-config file guess
- [ ] Part 2: the visual-design-management guess (CSS files / theme object / styled-components / Tailwind / tokens)

---

## The prompt

You are auditing this project's codebase and design implementation for quality, consistency, and best practice — not for missing wiring (that's a separate audit). Ground every finding in something you can point to in the actual code, not general opinion. Where a finding is subjective or arguable, say so and give your reasoning rather than stating it as fact.

### Scope — Enumerate every surface first

Before auditing anything, identify every distinct application surface in this repo (e.g. user-facing app, admin panel, demo/marketing site, docs site, internal tooling) by their actual top-level folders/packages — don't assume the project is a single app. List each surface you find and confirm you'll audit all of them, not just the first or most prominent one. Note explicitly whether each surface shares the same design system/token setup or has its own separate one, since that changes what "single source of truth" even means for this project (one shared source across surfaces, or one per surface, are both legitimate — but which one is actually true, versus which one is intended, is itself worth flagging as a finding if they differ).

Carry this per-surface breakdown through every part below — findings should say which surface(s) they apply to, and if the same issue exists independently in multiple surfaces (e.g. hardcoded colors in both the admin panel and the main app, defined differently in each), call that out as its own finding rather than merging it into one generic note.

### Part 0 — Inventory existing conventions first

Before flagging anything as a problem, find out what conventions already exist and whether the "problem" is actually an inconsistency with the project's own established pattern, or just a pattern you personally wouldn't choose. Read [PROJECT-SPECIFIC: design tokens file, CSS custom properties, theme config, style guide, CLAUDE.md] if one exists. Flag deviations from the project's *own* stated conventions with higher confidence than deviations from generic best practice.

### Part 1 — Code quality and best practices

Review the codebase for:

- Dead or duplicate code — logic implemented more than once that could be a shared function/component
- Inconsistent patterns for the same kind of problem solved differently in different places (naming, error handling, state management, file organization)
- Anywhere complexity seems disproportionate to what the code actually does
- Outdated or deprecated APIs/libraries/patterns for the language and frameworks this project uses
- Anywhere a "temporary" or "quick fix" comment/pattern suggests unfinished cleanup

For each finding: cite the actual location, explain the concrete downside (not just "it's not best practice"), and note how confident you are.

### Part 2 — Design system: single source of truth

Check whatever manages visual design ([PROJECT-SPECIFIC: CSS files, a theme object, styled-components, Tailwind config, design tokens]) for redundancy — the same value (a color, a spacing amount, a font size, a shadow, a border-radius) defined or repeated in multiple places instead of referencing one definition. List every place a value appears more than once when it could be a single variable/token, and whether a token system already exists but isn't being consistently used (a partial system that's inconsistently applied is a different, and often worse, problem than no system at all — flag it distinctly). If no central token/design-values file exists at all — values are just scattered with nothing to point to as the canonical source — don't just note the redundancy; add a `todo.md` item (Part 11) recommending CC establish an actual canonical source file, since that's a different and more foundational fix than deduplicating into one that already exists.

### Part 3 — Color variables

Specifically check for hardcoded color values (hex, rgb, hsl, named colors) anywhere outside the central color definition. For each one found: note the file/location, what it should probably reference instead if a matching token exists, and flag it as a new token if no matching one exists yet (don't force an arbitrary color into an ill-fitting existing token just to eliminate the hardcode).

### Part 4 — Spacing, grid, and rhythm

Check for:

- A defined spacing scale (e.g. a consistent set of steps) versus arbitrary one-off margin/padding/gap values
- Consistent vertical rhythm — do headings, paragraphs, and sections follow a predictable spacing pattern, or does spacing vary unpredictably between similar elements?
- Consistent horizontal alignment — do columns, cards, and grid items actually align to a shared grid, or do they drift?
- A defined type scale (font sizes and line-heights following a system) versus arbitrary values

### Part 5 — Responsive design

Check for:

- Breakpoints defined once and reused, versus repeated/inconsistent breakpoint values across files
- Layouts that only appear tested at common breakpoints, with gaps in between where things likely break (very narrow phones, tablet-width, ultra-wide)
- Fixed pixel widths/heights that should be fluid or constrained with min/max instead
- Touch target sizing on interactive elements for mobile
- Anything relying on hover-only interaction with no touch/keyboard equivalent

### Part 6 — Semantic and accessibility gaps

Check for:

- Non-semantic elements used where a semantic one exists (divs/spans standing in for buttons, headings, lists, landmarks)
- Heading hierarchy — does it follow a logical order, or does it skip levels or get chosen for visual size rather than document structure?
- Missing alt text, ARIA labels, or form labels
- Color contrast, and any information conveyed by color alone
- Visible focus states for keyboard navigation, and whether tab order follows visual/logical order
- `prefers-reduced-motion` handling for any animation

### Part 7 — "Looks AI-generated" pass

This one is inherently subjective, so give reasoning, not just a verdict. Check design, layout, typography, and color choices for the specific tells that make interfaces read as generic/AI-generated rather than intentional, referencing this project's actual screens/components:

- Overused default gradient combinations (especially purple-to-blue) with no clear reason tied to brand or content
- Generic drop-shadow/glassmorphism applied uniformly without purpose
- Default system font choices where a more considered typographic choice would fit the project's actual identity
- Icon sets mixed from different visual styles (line vs. filled vs. different stroke weights) rather than one consistent set
- Overly rounded corners applied uniformly regardless of element type or scale
- Excessive or unnecessary emoji in UI copy
- Spacing/layout that's technically consistent but generic — evenly-spaced centered blocks with no real visual hierarchy or point of emphasis
- Color palettes that read as an unmodified default from a popular UI framework rather than something considered for this specific project

### Part 8 — Additional checks worth including

- Icon system consistency (one icon library/style used throughout, not several mixed)
- Component state consistency — do hover/active/disabled/loading/error states exist and look consistent across similar components, or are some states missing/inconsistent?
- Animation/transition consistency — similar interactions using similar timing/easing, versus arbitrary per-component values
- Dark mode/theming, if present — is it centralized through the same token system, or hardcoded per-component as a separate pass?
- Asset optimization — oversized images, unoptimized SVGs, unused CSS shipped to production

### Part 9 — Comment cleanup (directive, not just audit)

Unlike the other parts, this one you should actually act on rather than only report. Go through the codebase and remove comments that are AI-generated tells rather than genuinely useful documentation — things like:

- Comments that just restate what the code obviously does (`// increment counter` above `counter++`)
- Comments explaining *what* instead of *why*, where the *what* is already clear from reading the code
- Overly verbose or narrated comments (multi-sentence explanations for simple lines, comments that read like documentation prose rather than a quick note)
- Comments with a noticeably different voice/formality than the rest of the codebase's existing human-written comments
- Redundant comment blocks above functions that just repeat the function name and parameter names in sentence form

Keep or rewrite (don't blanket-delete) comments that:

- Explain *why* a non-obvious decision was made, especially anything tied to a real bug fix or a workaround for something external
- Flag a known limitation, edge case, or TODO
- Would save real time for someone unfamiliar with a genuinely tricky piece of logic

Where you keep a comment, tighten it to be short and plain — the way a developer jots a quick note for themselves or a teammate, not the way documentation explains a concept to a reader who knows nothing. Where you're unsure whether a comment is worth keeping, err toward keeping it short rather than deleting it outright, and flag it in the report rather than silently deciding.

Report what you changed (roughly how many comments removed/rewritten and in which files/areas) as its own section within the `production_notes/` report from Part 11 — not just in the chat-facing summary — so it's easy to review as its own diff alongside the rest of the audit.

### Part 10 — README currency

Assess the README against the actual current state of the project — not just whether it documents new features (already covered by the gate check in the Integration Audit), but whether everything it currently claims is still true. Check for: features described that no longer work as described or have changed shape, setup/install instructions that no longer match what's actually required, and any structural claims (folder layout, supported surfaces, tech stack) that have drifted from reality. Report findings here rather than editing the README directly.

### Part 11 — Project documentation setup

- If no `CLAUDE.md` exists in the project, create one, seeded with what you've learned from this audit (conventions found, surfaces enumerated, key architectural notes) so future sessions start from real project knowledge rather than nothing.
- Write all feedback, assessments, and design-related findings from this audit into a `./production_notes/` folder rather than only reporting them in this session's output — this is the durable, persistent form of the audit.
- Within `./production_notes/`, create a `todo.md` listing discovered action items as a plain list with brief one-line descriptions — not exhaustive write-ups. If an item is substantial enough to need a full design brief, don't put the detail in `todo.md`; instead create `./production_notes/[issue]-design-brief.md` for that item and have the `todo.md` entry link to it.
- Add `CLAUDE.md`, `production_notes/`, and any other CLAUDE-related files/folders to `.gitignore` if they aren't already covered — create `.gitignore` first if the project doesn't have one, so this project knowledge stays local rather than committed.
- Create a project-local `scratch/` directory (or the project's existing equivalent, if one already exists under a different name) for throwaway verification/debug scripts, and add it to `.gitignore`. Note in `CLAUDE.md` that one-off scripts should be written there rather than to the OS temp directory or long inline one-liners — a stable in-project path is what lets a permission rule actually cover future runs, where an OS temp path (often unique per session) never can. Do not edit `.claude/settings.json` to add the corresponding permission wildcard yourself — propose it in `production_notes/todo.md` instead (e.g. "consider adding `Bash(node scratch/*.js:*)` to reduce prompts") and let the user decide, since how open someone wants their permissions is a personal call, not something this audit should silently opt them into. Never propose broad modes like auto-approving all commands or skipping dangerous-action confirmations — only narrow, scoped wildcards tied to this specific convention.

### Deliverables

Produce a report (organized by the parts above) covering Parts 1–8 and Part 10, written into `./production_notes/` per Part 11 rather than only as chat output. For each finding: the concrete location, why it matters, and a suggested direction — without making the change (except Part 9's comment cleanup, which is executed directly). Separate findings into "clear improvement" versus "stylistic judgment call, here's the tradeoff." Populate `production_notes/todo.md` with the resulting action items, and `[issue]-design-brief.md` files for anything substantial enough to warrant one. End the chat-facing summary with a short list of findings you think are strong candidates to become actual gate-check items in the Integration Audit checklist (e.g. "no new hardcoded hex colors outside the token file").

Do not implement any fixes for Parts 1–8 or Part 10 yet — those are report-only. Parts 9 (comment cleanup) and 11 (CLAUDE.md, production_notes/, todo.md, .gitignore) are the two exceptions and should actually be carried out as described. Stop after the report and those two actions, and wait for review before touching anything else.