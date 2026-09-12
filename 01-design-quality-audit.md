# Sentinel: Design & Code Quality Audit Prompt (Portable — for any AI coding agent, any project)

This one produces a report and recommendations, not a checklist gate — quality is a judgment call, not a pass/fail. Some findings from this pass may turn into new gate-check items later (e.g. "no new hardcoded hex colors"), but that decision comes after review, not automatically.

Fill in `[PROJECT-SPECIFIC]` brackets before running this.

**Pre-flight — confirm every bracket below is filled in before running this:**
- [ ] Part 0: the design-tokens/theme-config file guess
- [ ] Part 2: the visual-design-management guess (CSS files / theme object / styled-components / Tailwind / tokens)

---

## The prompt

You are auditing this project's codebase and design implementation for quality, consistency, and best practice — not for missing wiring (that's a separate audit). Ground every finding in something you can point to in the actual code, not general opinion. Where a finding is subjective or arguable, say so and give your reasoning rather than stating it as fact.

**Agent identification.** This prompt works with any AI coding agent capable of reading a codebase and running shell commands — Claude Code, OpenAI Codex, or similar. If `PROJECT_PROFILE.md` exists (from the discovery prompt), it already recorded which agent and which file/permission names apply — use those. Otherwise identify them yourself: your persistent project-context file (called `AGENTS.md` here, the vendor-neutral name Codex/Cursor/Gemini CLI/Windsurf/GitHub Copilot use; Claude Code calls the same thing `CLAUDE.md` — write to whichever your tool actually reads) and your permission/configuration mechanism (`.claude/settings.json` for Claude Code; `~/.codex/config.toml` plus `/permissions` for Codex CLI; note the equivalent for other tools).

When you ask the user anything — one of this prompt's own scripted questions or something that comes up along the way — phrase it in plain language a non-specialist could follow. Say what's actually being decided before naming any internal mechanism, rule, or file involved, and make sure each option offered is a complete, actionable choice on its own rather than a fragment of engineering detail. The person commissioned this audit; they shouldn't need to already track its internals to answer a question about their own project.

**Applicability — identify your domain before running Parts 2-8, don't assume it's web.** These parts were originally written against a web UI and still use web/mobile/game examples throughout, but the examples are illustrative, not exhaustive — the underlying questions (single source of truth, consistency, accessibility, whether something reads as unconsidered) are about *how a project manages its own presentational decisions*, whatever form that takes. Before running Parts 2-8, identify which of these three cases actually fits:

- **Full visual GUI** (web, native mobile, desktop toolkit, game engine): Parts 2-8 apply close to as written, adapted to the platform's actual style mechanism using the per-part notes below as a starting point.
- **Some presentational surface, but not a full GUI**: a CLI/TUI with its own color scheme and layout conventions, a tool that generates documents/reports with their own formatting rules, a data-visualization/dashboard project, an audio or sound-design tool with preset/parameter consistency concerns, or anything else with real stylistic decisions that aren't a conventional interface. Here, judge each part individually rather than applying all of Parts 2-8 as a block — Parts 2 (single source of truth), 3 (the token/authority-checking logic, generalized to whatever "the value" is for this domain), 4 (a spacing/rhythm analog if one exists), and 6 (an accessibility analog — for a CLI this might mean colorblind-safe palettes, no color-only signaling, and screen-reader-clean output) usually still apply once translated. Part 7 (gradients, rounded corners, glassmorphism) is inherently about visual GUI aesthetics and likely doesn't translate — skip it rather than forcing a strained analogy, and say so explicitly rather than silently omitting it.
- **No presentational/aesthetic dimension at all** (a CLI tool with no visual design of its own, a backend service, a library, a data pipeline): only Part 1 (code quality) applies — skip Parts 2-10 and go straight from Part 1 to Part 11.

If you're genuinely unsure which case fits, say so and make your best judgment explicit rather than defaulting to the full-GUI assumption just because that's how the examples are written.

Detection throughout this audit must be exhaustive by structure, not by matching a list of previously-seen bad examples. If a check only searches for patterns already suspected to be wrong, it will miss anything that violates the same rule without textually resembling those examples. Wherever a part below asks you to find hardcoded values, duplicated markup, or non-semantic patterns, match the *syntactic shape* of the thing in question (every color-literal syntax form, every magic number, every non-semantic tag) across every file in scope — not a grep for known offenders.

Relatedly, a token or shared definition existing does not by itself mean it's authoritative. Something with higher specificity, later precedence, or narrower scope (a more specific selector, a later cascade rule, a per-component override, a per-environment config value) can still be the thing actually producing the rendered/effective result, leaving the "canonical" definition unused in practice. A useful tell: a value that's suspiciously identical across contexts where it's supposed to vary (e.g. a theme token with the same value in both light and dark blocks) while the actual rendered behavior does vary — that mismatch means something else is doing the real work and should be traced down, not assumed to be an intentional theme with no variance.

### Scope — Enumerate every surface first

Check for `PROJECT_PROFILE.md` first — if present (from the discovery prompt), use its surface list as a starting point rather than re-enumerating from scratch, but re-verify it's still accurate rather than trusting it blindly if time has passed since it was generated. If it's not present, or looks stale, identify every distinct application surface in this repo (e.g. user-facing app, admin panel, demo/marketing site, docs site, internal tooling, or independent packages in a monorepo) by their actual top-level folders/packages — don't assume the project is a single app. List each surface you find and confirm you'll audit all of them, not just the first or most prominent one. Note explicitly whether each surface shares the same design system/token setup or has its own separate one, since that changes what "single source of truth" even means for this project (one shared source across surfaces, or one per surface, are both legitimate — but which one is actually true, versus which one is intended, is itself worth flagging as a finding if they differ).

Carry this per-surface breakdown through every part below — findings should say which surface(s) they apply to, and if the same issue exists independently in multiple surfaces (e.g. hardcoded colors in both the admin panel and the main app, defined differently in each), call that out as its own finding rather than merging it into one generic note.

### Part 0 — Inventory existing conventions first

Before flagging anything as a problem, find out what conventions already exist and whether the "problem" is actually an inconsistency with the project's own established pattern, or just a pattern you personally wouldn't choose. Read [PROJECT-SPECIFIC: design tokens file, CSS custom properties, theme config, style guide, AGENTS.md] if one exists. Flag deviations from the project's *own* stated conventions with higher confidence than deviations from generic best practice.

**Design documentation.** Check `PROJECT_PROFILE.md` for a detected design document path, or check yourself if it's not there — common conventions are `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, or a `docs/adr/` directory. If one exists, read it and use it as grounding for a check nothing else in this audit does: does the actual implementation still match documented intent? This is a different question from internal consistency — code can be perfectly self-consistent while having quietly drifted from what the project says it's supposed to do. Treat a mismatch as its own finding, with the same reasoning-and-confidence treatment as any subjective finding, since "intent" documents age and the code may be right while the doc is stale (or vice versa) — don't assume the document is automatically authoritative just because it exists.

If no design document exists, ask the user whether they want one created — don't create it by default. If they say yes: write it as honest as-built documentation reverse-engineered from the current codebase, not as a traditional forward-looking design document. Say so explicitly in the document itself — an AI can describe what a system does with real confidence, but has much shakier ground for the tradeoffs and rejected alternatives that happened in someone's head, which is exactly what a genuine design document usually claims to capture. Presenting an inferred architecture with the unearned authority of deliberate rationale would be actively misleading. Use `docs/DESIGN.md` as the location (the common single-overview convention) unless the project's own structure suggests otherwise. Keep its scope distinct from `AGENTS.md` rather than duplicating it: `AGENTS.md` is operational context for an AI agent working in this codebase; a design document is a narrative overview for a human reader — onboarding, stakeholder communication, understanding the system's shape at a glance. If the two would just say the same things in different registers, that's a sign a second document isn't earning its keep — say so rather than creating it anyway.

### Part 1 — Code quality and best practices

Review the codebase for:

- Dead or duplicate code — logic implemented more than once that could be a shared function/component
- Inconsistent patterns for the same kind of problem solved differently in different places (naming, error handling, state management, file organization)
- Anywhere complexity seems disproportionate to what the code actually does
- Outdated or deprecated APIs/libraries/patterns for the language and frameworks this project uses
- Anywhere a "temporary" or "quick fix" comment/pattern suggests unfinished cleanup

For each finding: cite the actual location, explain the concrete downside (not just "it's not best practice"), and note how confident you are.

### Part 2 — Design system: single source of truth

*Non-web equivalent: identify this project's own actual style-management mechanism before applying this part — a platform's central theme/asset system (a Colors/Theme catalog on iOS, a Material theme on Android/Flutter, a style asset in a game engine), a CLI's color-scheme/config constants, a document generator's style templates, or whatever this specific project actually uses. The list here is illustrative, not exhaustive — if none of these fit, find the project's real equivalent rather than concluding the question doesn't apply.*

Check whatever manages visual design ([PROJECT-SPECIFIC: CSS files, a theme object, styled-components, Tailwind config, design tokens]) for redundancy — the same value (a color, a spacing amount, a font size, a font family, a shadow, a border-radius) defined or repeated in multiple places instead of referencing one definition, including whether the same typeface is used consistently or different files/components have quietly drifted onto different font stacks with no shared source. List every place a value appears more than once when it could be a single variable/token, and whether a token system already exists but isn't being consistently used (a partial system that's inconsistently applied is a different, and often worse, problem than no system at all — flag it distinctly). If no central token/design-values file exists at all — values are just scattered with nothing to point to as the canonical source — don't just note the redundancy; add a `TODO.md` item (Part 11) recommending establishing an actual canonical source file, since that's a different and more foundational fix than deduplicating into one that already exists.

This same redundancy check applies beyond scalar values — check for repeated *markup* too: icons, illustrations, or any recurring UI fragment (a badge, a card header, a loading indicator) whose actual structure — not just a color or size inside it — is copy-pasted across files rather than defined once and reused. A finding here is not resolved by deduplicating the values used inside the markup; it needs the markup itself consolidated. When recommending or implementing a fix for repeated markup, the bar for "actually fixed" is:

- A single source (one file per asset, or one shared module/data file exporting all of them) holding the canonical markup — not the markup re-typed or copy-pasted per surface
- Every consuming surface importing or fetching from that one source, rather than embedding its own copy
- A style contract for that asset class documented once (sizing scale, spacing/alignment rules, and whatever properties matter for the format in use — e.g. stroke width and viewBox for vector graphics, resolution and aspect ratio for raster images, weight and baseline alignment for icon fonts) rather than left to be matched by eye file-to-file

If you find repeated markup during this audit, don't just flag the duplication and stop — either implement the consolidation to this bar directly (if it's a contained, low-risk refactor) or write it up as a proper `TODO.md`/design-brief item (Part 11) specifying this three-part bar explicitly, so a future pass doesn't stop at "deduplicated the values" and call it done.

### Part 3 — Color variables

*Non-web equivalent: whatever this project's own "value system" is — a platform's color-asset/theme system, a CLI's palette constants, a document template's style definitions. The "is this actually authoritative, or does something else override it" question applies regardless of syntax or domain.*

Specifically check for hardcoded color values (hex, rgb, hsl, named colors) anywhere outside the central color definition. Scan for the full syntactic range of color-literal forms across every file in scope, not just a handful of values already suspected to be wrong — a value that's never come up before is just as much a violation as one that has. For each one found: note the file/location, what it should probably reference instead if a matching token exists, and flag it as a new token if no matching one exists yet (don't force an arbitrary color into an ill-fitting existing token just to eliminate the hardcode).

Also check that each color token is actually authoritative, not merely present. For any token meant to vary by context (theme, mode, brand variant), compare its declared value across those contexts against what's actually rendered/used in each — if the token holds an identical value across contexts that visibly render differently, a hardcoded override elsewhere is almost certainly the real source of the visible difference and needs to be found and consolidated into the token itself, with the override deleted, not left standing alongside a token that no longer reflects reality.

Beyond mechanics, assess the palette itself as a design judgment call — state your reasoning and confidence level, the same as Part 7. Does the project use a deliberate, limited set of colors with clear roles (primary, secondary, accent, semantic states like success/error/warning), or has it accumulated many near-duplicate colors with no discernible system (several similar-but-not-identical blues, grays that don't form a coherent scale)? A palette can be perfectly tokenized (every value centralized, no hardcoding, no authority problems) and still be an incoherent design system if the values themselves were never rationalized — this is a distinct finding from the mechanical checks above, not a restatement of them.

### Part 4 — Spacing, grid, and rhythm

*Non-web equivalent: whatever layout/alignment system the project actually uses — Auto Layout constraints, a game UI's anchor/margin system, a terminal UI's grid/padding conventions, a document template's margin and line-spacing rules. Check for a consistent spacing scale and alignment discipline the same way, just not in CSS units.*

Check for:

- A defined spacing scale (e.g. a consistent set of steps) versus arbitrary one-off margin/padding/gap values
- Consistent vertical rhythm — do headings, paragraphs, and sections follow a predictable spacing pattern, or does spacing vary unpredictably between similar elements?
- Consistent horizontal alignment — do columns, cards, and grid items actually align to a shared grid, or do they drift?
- A defined type scale (font sizes and line-heights following a system) versus arbitrary values
- Visual hierarchy — does spacing, size, weight, or color actually guide attention to what matters most, or is the layout uniformly weighted with no clear point of emphasis? This is its own finding regardless of whether the result also happens to read as generic/AI-generated — flag a hierarchy problem here even when nothing about it reads as templated; Part 7 covers the narrower case where a hierarchy problem is also specifically an AI-generated tell, so cross-reference rather than double-reporting if you flag the same instance in both places.
- Visual hierarchy — does size, weight, color, and spacing actually guide attention to what matters most on each screen/view, or is everything given roughly equal visual weight with nothing to anchor the eye? This is a standalone finding on its own merits, not only worth flagging when it also happens to look generic/AI-made (that overlap is covered separately in Part 7).

### Part 5 — Responsive design

*Non-web equivalent: adaptive presentation across whatever varies for this project's actual users — device classes/screen sizes/orientations for an app, terminal width for a CLI/TUI, page size for a document generator. Not every project has this dimension at all (a fixed-size desktop tool might not); skip this part if nothing genuinely varies.*

Check for:

- Breakpoints defined once and reused, versus repeated/inconsistent breakpoint values across files
- Layouts that only appear tested at common breakpoints, with gaps in between where things likely break (very narrow phones, tablet-width, ultra-wide)
- Fixed pixel widths/heights that should be fluid or constrained with min/max instead
- Touch target sizing on interactive elements for mobile
- Anything relying on hover-only interaction with no touch/keyboard equivalent

### Part 6 — Semantic and accessibility gaps

*Non-web equivalent: whatever accessibility surface this project actually has — a platform's own accessibility API (VoiceOver/TalkBack) for an app, or for a CLI/TUI: screen-reader-clean text output, colorblind-safe palettes, and never signaling success/failure or status through color alone.*

Check for:

- Non-semantic elements used where a semantic one exists (divs/spans standing in for buttons, headings, lists, landmarks)
- Heading hierarchy — does it follow a logical order, or does it skip levels or get chosen for visual size rather than document structure?
- Missing alt text, ARIA labels, or form labels
- Color contrast, and any information conveyed by color alone
- Visible focus states for keyboard navigation, and whether tab order follows visual/logical order
- `prefers-reduced-motion` handling for any animation

For the web case specifically, note whether the project already runs automated accessibility tooling (axe-core, jest-axe, a Playwright/Cypress accessibility plugin) in CI or tests. If not, this is a strong candidate for the "candidates for gate-check items" list in the Deliverables section below — automated contrast/ARIA/label checks catch real regressions on every future change, where a one-time manual audit only catches what exists today.

### Part 7 — "Looks AI-generated" pass

This one is inherently subjective, so give reasoning and an explicit confidence level (high/medium/low), not just a verdict. Check design, layout, typography, and color choices for the specific tells that make interfaces read as generic/AI-generated rather than intentional, referencing this project's actual screens/components:

Before flagging any match, check whether the specific instance draws from the project's own established values (its color tokens, its own content, its own brand) rather than generic/default ones — a pattern that matches one of these tells in shape but is built from the project's own tokens and content is a materially different, usually more defensible finding than an unmodified generic default, and should be flagged with lower confidence and that reasoning stated explicitly, not treated the same as the generic version.

- Overused default gradient combinations (especially purple-to-blue) with no clear reason tied to brand or content
- Generic drop-shadow/glassmorphism applied uniformly without purpose
- Default system font choices where a more considered typographic choice would fit the project's actual identity
- Icon sets mixed from different visual styles (line vs. filled vs. different stroke weights) rather than one consistent set (if this is already reported as a structural finding in Part 2's markup-consolidation check, cross-reference it here rather than writing it up again as a separate finding)
- Overly rounded corners applied uniformly regardless of element type or scale
- Excessive or unnecessary emoji in UI copy
- Spacing/layout that's technically consistent but generic — evenly-spaced centered blocks with no real visual hierarchy or point of emphasis (if already flagged as a hierarchy finding in Part 4, cross-reference rather than re-reporting)
- Color palettes that read as an unmodified default from a popular UI framework rather than something considered for this specific project

### Part 8 — Additional checks worth including

- Icon system consistency (one icon library/style used throughout, not several mixed) — if already reported in Part 2 (structural duplication) or Part 7 (as a possible AI-generated tell), cross-reference rather than re-reporting the same finding a third time
- Component state consistency — do hover/active/disabled/loading/error states exist and look consistent across similar components, or are some states missing/inconsistent?
- Animation/transition consistency — similar interactions using similar timing/easing, versus arbitrary per-component values
- Dark mode/theming, if present — is it centralized through the same token system, or hardcoded per-component as a separate pass?
- Asset optimization — check each image against how it's actually used, not just its file size in isolation: compare its file dimensions to its real display dimensions in context (read the CSS/markup, not just the file browser — a file downloaded far larger than it's ever rendered at is a common, real finding); check format-appropriateness for content type (a lossless format like PNG is right for screenshots/UI captures with sharp edges and text, but wasteful for photographic or gradient-heavy content, where a lossy format at reasonable quality is often 70-90% smaller with no visible difference); check for lazy-loading on images that aren't immediately visible on load. Flag unoptimized/uncompressed SVGs (editor cruft, unnecessary metadata) as their own finding, since the fix differs from raster image sizing.

Asset optimization findings are a different kind of fix from most others in this audit and shouldn't be treated the same way once you're past finding them. Fixing a hardcoded color or a stale comment is a text edit; fixing an oversized image requires actually re-encoding binary data — resizing, re-compressing, sometimes changing format — which is a categorically different capability, not just a bigger version of the same task. Before proposing or attempting a fix, check what image-processing tooling is actually available in this environment; don't assume you can produce a correctly resized/re-encoded file just because you can describe what the fix should be. If tooling exists, scope this as its own follow-up rather than folding it into the same pass as the quick text-edit findings — it involves real per-image judgment (content type, target format, quality tradeoff) and meaningfully more effort per item than everything else in this part. Ask the user's preference on approach (one target format applied uniformly, versus per-image judgment based on content) using the same plain-language elicitation principle as the rest of this prompt, rather than picking a default silently or listing it as a same-effort item alongside the fast fixes.

### Part 9 — Comment cleanup (directive, not just audit)

Unlike the other parts, this one you should actually act on rather than only report — but not without checking your assumption first. This part's default (strip terse-comment-culture violations) is itself a style preference, not a universal best practice. Before doing anything, check what Part 0 found about this project's existing comment conventions, and ask the user directly which philosophy they want if it isn't already obvious from an established pattern: terse/minimal (strip anything that isn't short and plain, per the default below) or thorough documentation-style (JSDoc/docstrings expected on every function, a deliberate house style some teams keep on purpose). If there's no way to ask (or no answer given): default to terse/minimal unless the codebase already shows a deliberate, consistent thorough-documentation convention, in which case respect that existing convention instead — but treat this as a fallback only, not a substitute for asking. If the codebase already shows a deliberate thorough-documentation convention, or the user says that's their preference, don't strip it just because it isn't terse — apply the narrower version below instead: flag genuine AI-generated tells (a voice mismatch with the rest of the codebase, comments that just restate the code) without removing legitimate, convention-following documentation.

Once the philosophy is confirmed, present the user a brief plan — roughly how many comments in which files/areas would be affected — and get explicit confirmation before executing. Don't run the cleanup automatically just because this part is an action exception; a stranger's first run of this prompt shouldn't discover changes were already made before they had a chance to review the plan. Record the confirmed philosophy in `AGENTS.md` once created (Part 11) so future sessions know which convention to follow even without re-reading this part — a preference stated once and never written down is a preference future-you has no way to recall.

With that confirmed, go through the codebase and remove comments that are AI-generated tells rather than genuinely useful documentation — things like:

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

Report what you changed (roughly how many comments removed/rewritten and in which files/areas) as its own section within the `sentinel-notes/` report from Part 11 — not just in the chat-facing summary — so it's easy to review as its own diff alongside the rest of the audit.

### Part 10 — Documentation currency: AGENTS.md and README

`AGENTS.md`, not the README, is this project's authoritative internal record of its features, conventions, and architecture — it's what future agent sessions rely on for accurate context, so drift there is the higher-priority finding. Assess whether `AGENTS.md`'s description of the project still matches the actual current codebase — not just whether it documents new features (an ongoing version of that is the gate check the Integration Audit sets up for future commits; this is the one-time backward check of what's already drifted), but whether everything it currently claims is still true. Flag anything stale, missing, or contradicted by what you found elsewhere in this audit.

The README serves a different purpose: it's the public-facing description of the project, and its job is to stay accurate, not to be the authoritative internal source. Assess it separately for currency — features described that no longer work as described or have changed shape, setup/install instructions that no longer match what's actually required, and any structural claims (folder layout, supported surfaces, tech stack) that have drifted from reality.

Report findings for both here rather than editing either file directly during this part — updates flow through Part 11's action exception (for `AGENTS.md`) or into `sentinel-notes/TODO.md` as a tracked item (for the README), not silent edits during reporting.

### Part 11 — Project documentation setup

Before creating or modifying anything in this part, ask the user whether `AGENTS.md` and `sentinel-notes/` should stay local-only (gitignored) or be committed and shared with the team. Anthropic's own convention treats `AGENTS.md` as meant to be committed, so every teammate and future session shares the same project context — keeping it local-only is a reasonable choice for a solo developer who doesn't want audit scaffolding in a public repo's history, but a team would likely want it shared, and this shouldn't be assumed either way. If there's no way to ask (or no answer given), a fallback: commit them if the repository's history shows multiple contributors, keep them local-only for a single-contributor project — but treat this as a fallback only, not a substitute for asking. Note the choice itself inside `AGENTS.md`'s own content (e.g. "this file is intentionally local-only per project preference") — even though the file's tracked status already reflects the decision, a line stating it explicitly means anyone reading the file later understands it was a deliberate choice, not an oversight.

Also ask, at the same time, how the user wants completed `TODO.md` items handled: deleted outright once resolved, struck through (e.g. `~~item~~`) but left in place as a visible record, or moved to a "Done" section at the bottom rather than either. There's no default here — pick one only because the user actually said so, and record the choice both as a one-line note at the top of `TODO.md` itself and in `AGENTS.md`, so the Integration Audit and Gate-Check Implementation prompts, which both update this file later, follow the same convention instead of reintroducing whatever their own default instinct would be — and so it isn't only discoverable by someone who happens to open `TODO.md` first.

Ask one more thing alongside it: once a `TODO.md` item is completed, what should the agent do next? Three genuinely different options, not two — stop and wait to be told what's next; move on to the next item in list order (positional, no judgment involved); or actively recommend which remaining item seems most worth doing next, with a stated reason, based on its description. The third option is meaningfully different from the second — "next in the list" and "the one most worth doing" aren't the same thing, and conflating them means picking one silently answers a question the user never actually got asked. If the user picks the third option, note in `AGENTS.md` that `TODO.md` items are plain one-line descriptions with no priority, effort, or dependency data attached — any "most worth doing next" recommendation will be reasoning from the description text alone, not from real prioritization metadata, so it's a judgment call to state plainly, not a fact to assert. This governs ordinary day-to-day work through the backlog, not just this audit's own session — record whichever option is chosen in `AGENTS.md` the same way, since it's a standing behavioral preference, not a one-time setup choice. There's no default here; ask rather than assuming any of the three.

Present the user a brief plan for what this part will create/change before executing, the same as Part 9 — this part also creates files and edits `.gitignore`, and shouldn't run automatically without the user seeing what's about to happen first.

Once confirmed:

- If no `AGENTS.md` exists in the project, create one, seeded with what you've learned from this audit (conventions found, surfaces enumerated, key architectural notes) so future sessions start from real project knowledge rather than nothing. If `AGENTS.md` already exists and Part 10 found it stale, update the stale sections now as part of this same confirmed action — don't just report the staleness and leave it, since Part 10 explicitly promised this is where that fix lands. `AGENTS.md` is this project's authoritative internal record per Part 10 — keep it accurate as you go, not just at creation.
- Write all feedback, assessments, and design-related findings from this audit into a `./sentinel-notes/` folder rather than only reporting them in this session's output — this is the durable, persistent form of the audit.
- Within `./sentinel-notes/`, create a `TODO.md` listing discovered action items as a plain list with brief one-line descriptions — not exhaustive write-ups — noting the completed-item convention just confirmed at the top of the file. If an item is substantial enough to need a full design brief, don't put the detail in `TODO.md`; instead create `./sentinel-notes/[issue]-design-brief.md` for that item and have the `TODO.md` entry link to it.
- If the user chose local-only, add `AGENTS.md`, `sentinel-notes/`, and any other CLAUDE-related files/folders to `.gitignore` if they aren't already covered — create `.gitignore` first if the project doesn't have one. If the user chose to share them, skip this step entirely — don't gitignore files the user just said they want committed.
- Create a project-local `scratch/` directory (or the project's existing equivalent, if one already exists under a different name) for throwaway verification/debug scripts, and add it to `.gitignore` regardless of the local-vs-shared choice above — scratch files are session debris either way, not something any project should commit. Note in `AGENTS.md` that one-off scripts should be written there rather than to the OS temp directory or long inline one-liners — a stable in-project path is what lets a permission rule actually cover future runs, where an OS temp path (often unique per session) never can. Do not edit this tool's permission/configuration file yourself (e.g. `.claude/settings.json` for Claude Code) to add the corresponding permission rule — propose it in `sentinel-notes/TODO.md` instead (e.g. "consider adding a rule allowing `node scratch/*.js` to reduce prompts") and let the user decide, since how open someone wants their permissions is a personal call, not something this audit should silently opt them into. Never propose broad modes like auto-approving all commands or skipping dangerous-action confirmations — only narrow, scoped wildcards tied to this specific convention.

### Deliverables

Produce a report (organized by the parts above) covering Parts 1–8 and Part 10, written into `./sentinel-notes/` per Part 11 rather than only as chat output. For each finding: the concrete location, why it matters, and a suggested direction — without making the change (except Part 9's comment cleanup, which is executed directly). Separate findings into "clear improvement" versus "stylistic judgment call, here's the tradeoff." Populate `sentinel-notes/TODO.md` with the resulting action items, and `[issue]-design-brief.md` files for anything substantial enough to warrant one. End the chat-facing summary with a short list of findings you think are strong candidates to become actual gate-check items in the Integration Audit checklist (e.g. "no new hardcoded hex colors outside the token file").

Before presenting this report as complete, verify every part above (1–8 and 10) has an explicit entry in the output — either real findings, or an explicit "checked, nothing to flag" statement. For any part with its own itemized checklist (1, 4, 5, 6, 7, 8), this applies per item, not just per part: state explicitly which items were checked and found clean, not only which ones were flagged — a part that reports some findings can still have silently skipped other items on its own checklist, and that's just as invisible as the whole part being skipped. A part or item with no output at all is not evidence the codebase is clean there; it's indistinguishable from never having been run, and must not be treated as complete until you confirm which one it actually is. If any portion of this audit was delegated to a sub-agent, a sub-session, or a background task (if your tool supports that kind of delegation), this verification is not optional — check the delegate's output against every part and every checklist item explicitly before accepting it, rather than trusting that a returned summary means full coverage.

If git is in use, summarize in plain terms everything this run modified or created (comment cleanup, `AGENTS.md`, `sentinel-notes/`, `.gitignore` changes, anything else) and ask whether the user wants it committed now, and pushed if that fits their workflow — grouped by what it actually relates to if there's more than one kind of change, the same way any other commit-splitting decision would be made. Never commit or push without an explicit yes.

Do not implement any fixes for Parts 1–8 or Part 10 yet — those are report-only. Parts 9 (comment cleanup) and 11 (AGENTS.md, sentinel-notes/, TODO.md, .gitignore) are the two exceptions that actually execute — but "exception" means they act on user-confirmed choices, not that they run automatically. Present the plan and get confirmation as described within each part before executing either one. Stop after the report and those two confirmed actions, and wait for review before touching anything else.
