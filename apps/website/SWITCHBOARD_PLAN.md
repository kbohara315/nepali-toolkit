# Homepage redesign: the Nepali Toolkit switchboard

Status: design and implementation handoff only. Do not implement until requested.

This plan supersedes the octopus homepage direction in IMPLEMENTATION_PLAN.md.
Keep its Astro/Starlight, static deployment, public-API, and documentation
requirements. The switchboard is the chosen signature visual, replacing the
octopus; do not combine both metaphors.

## 1. Product story

Nepali Toolkit is one TypeScript package with focused public entrypoints for
dates, numbers, currency, land, words, collation, phone, and administrative data.
It helps developers express Nepal-specific conventions without repeatedly
building their own conversion, formatting, validation, and lookup code.

The story is **local conventions, precise functions, focused imports**.
The audience is developers building software for Nepal, not end users seeking
a general calendar or currency application.

The switchboard makes this tangible: choose one domain, supply an input, and
watch a real function produce a result. It should feel like operating a small,
well-engineered instrument, with the clarity and restraint of an Apple interface.

Important semantic correction: this is a domain selector, not a package bundler.
Turning a domain off cannot remove a chunk already downloaded by the browser.
Do not label switches “remove from bundle” or imply zero bytes for an unselected
domain. Explain scoped imports through accurate code examples, not simulated
bundle-size claims.

## 2. Design direction

### Mood

Quiet, tactile, precise. A digital instrument panel rather than a realistic
hardware photograph. The memorable moment is **switch → import → result**.

- Strict monochrome in light and dark modes.
- Keep the existing self-hosted Manrope family if its typography works well;
  no additional font family is needed for novelty.
- Display type: confident sans serif, approximately 48–64px desktop and 34–42px
  mobile, tight but readable tracking, no italic serif headline.
- Body: comfortable 16–18px with generous line height and Devanagari fallback.
- Code and small instrument labels: monospace, with tabular numerals.
- Fine neutral borders, restrained inset surfaces, tiny highlights and shadows.
- Material cues should suggest depth without becoming fake chrome or decorative
  screws, vents, glowing LEDs, distressed textures, or heavy brushed-metal images.
- Use a subtle static surface gradient if useful; no animated background texture.
- Subtle translucency belongs to the navigation only, not every content card.

### Starting palette

| Role | Light | Dark |
| --- | --- | --- |
| Page | #FAFAFA | #080808 |
| Panel | #F2F2F2 | #151515 |
| Readout | #FFFFFF | #0B0B0B |
| Main text | #111111 | #F5F5F5 |
| Supporting text | #555555 | #B4B4B4 |
| Decorative divider | #DDDDDD | #333333 |
| Active control | #111111 | #F5F5F5 |

Verify actual contrast, including active labels and control boundaries. The
decorative divider token is not sufficient for every interactive boundary.

## 3. Page composition and copy

### Hero copy

Eyebrow: `NEPALI TOOLKIT / TYPESCRIPT UTILITIES`

Headline: **Local conventions.\nOne toolkit.**

Supporting text:

> Dates, numbers, currency, land, words, sorting, phones, and administrative
> data. Focused TypeScript utilities for software built for Nepal.

Primary CTA: `Get started` → current getting-started docs route.

Secondary CTA: `Explore playground` → existing full playground.

Below: existing package-manager selector and copyable install command.

Do not claim every Nepali app uses the toolkit or necessarily needs all eight
domains. Prefer specific capabilities to inflated superlatives.

### Desktop composition

```text
┌──────────────────────────────────────────────────────────────────────┐
│ NEPALI TOOLKIT                  Docs  Playground  GitHub   [Theme]    │
│                                                                      │
│ LOCAL CONVENTIONS                     DOMAIN SWITCHBOARD              │
│                                      ┌────────────────────────────┐  │
│ Local conventions.                   │ 01 Dates     02 Numbers    │  │
│ One toolkit.                         │    [●──]        [──●]      │  │
│                                      │ 03 Currency  04 Land       │  │
│ Short, specific supporting text.     │    [●──]        [●──]      │  │
│                                      │ 05 Words     06 Sorting    │  │
│ [Get started →]  Playground ↗         │    [●──]        [●──]      │  │
│                                      │ 07 Phone     08 Admin      │  │
│ [pnpm | npm | yarn | bun]             │    [●──]        [●──]      │  │
│ pnpm add nepali-toolkit  [Copy]       ├────────────────────────────┤  │
│                                      │ NUMBER GROUPING            │  │
│ TypeScript · 0 runtime dependencies   │ Input   [12345678       ]  │  │
│                                      │ Output   1,23,45,678        │  │
│                                      │ import { formatNumber } …  │  │
│                                      │ Read number docs →         │  │
│                                      └────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│ Eight domains, documented.                                           │
│ Static cards: purpose, import path, example, documentation link       │
├──────────────────────────────────────────────────────────────────────┤
│ Precision where it matters.                                          │
│ Civil dates · Decimal strings · Documented data revisions             │
├──────────────────────────────────────────────────────────────────────┤
│ Install → Import → Use             Real TypeScript snippet            │
│ Footer: Docs · Playground · GitHub · npm · License                    │
└──────────────────────────────────────────────────────────────────────┘
```

Default selection is Numbers: immediate, fast, understandable output.
Avoid a second full playground immediately underneath; the compact hero demo
already proves the product. Keep the richer standalone playground accessible.

### Mobile

- Hero copy, CTAs, install command, then the complete switchboard.
- Domain controls remain a two-column grid with labels beside their toggles.
- Readout below controls, never a floating popover.
- At very narrow sizes, wrap labels/code rather than shrinking text.
- Code may scroll within its own container, never the whole page.
- Keep targets at least 44px high and a comfortable separation between controls.
- No horizontal carousel hiding the other domains.

## 4. Control semantics and behavior

Eight mutually exclusive selections should behave as **radio controls**, not
eight independent on/off switches. Visually use tactile slider-like controls;
semantically label the group “Choose a toolkit domain” with native radio inputs.

Exactly one domain is active at a time. This avoids meaningless combinations
such as “phone + land” and makes the demo's current context unambiguous.

### Interaction contract

1. Initial HTML selects Numbers and includes its real build-time result.
2. Hover gives subtle affordance feedback but does not change the selected demo.
3. Click/tap or native keyboard radio interaction selects a domain.
4. Its label and thumb respond immediately; inputs remain operable during motion.
5. Readout title, input label, helper text, example and docs destination update.
6. Populate a deterministic valid sample for the newly selected domain.
7. Keep input edits per domain for the current page session so switching back
   does not discard the user's work. No persistence of entered phone data.
8. Escape does not need a custom action: there is no modal or temporary overlay.
9. Do not steal focus when output changes or a chunk finishes loading.
10. Clear invalid-output/snippet state together so stale snippets cannot be copied
    as though they belonged to failed input.

Native radio Arrow keys, Space, and Tab behavior should work. Use real labels,
not clickable divs. Do not add `role="switch"` to radios or redefine familiar
keyboard behavior to fit the visual metaphor.

### Readout structure

- Domain title and one-sentence purpose.
- Explicit input label and format/coverage hint.
- Editable input or domain-specific control.
- Output region, stable reserved area, polite status messages.
- Complete copyable TypeScript snippet including its import.
- Domain-specific documentation link.
- Loading, success, invalid, empty, and copy-failure states.

Use status text/icons in monochrome; no success green or error red is needed.

## 5. Real domain demonstrations

Check signatures against current source before implementing. Below are grounded
entrypoints, not permission to guess option types or numeric output.

| Domain | Compact hero demonstration | Public entrypoint |
| --- | --- | --- |
| Numbers | `formatNumber('12345678')` → lakh/crore grouping | `/number` |
| Dates | BS `2082-04-07` → AD; use `bs` and `toAD` | `/date` |
| Currency | `formatNPR('123456.50')` | `/currency` |
| Land | Ropani count → square metres with `hillArea`, `toSquareMetres` | `/land` |
| Words | `numberToNepaliWords('123456')` | `/words` |
| Sorting | Multiline names sorted by `createNepaliCollator` with deterministic basic backend | `/collation` |
| Phone | Raw phone input → shape possibility with `isPossibleNepalPhone` | `/phone` |
| Admin | Province selection → list of districts with focused imports | `/admin/provinces`, `/admin/districts` |

Keep broader conversion directions, complex land units and palika/ward lookup
in the standalone playground. The hero shows one understandable call per domain.

For phone shape validation, say “Possible phone shape,” not “active phone” or
“verified subscriber.” `isValidNepalPhone` expects a parsed phone value; never
show it called with a raw string.

Pass exact-decimal inputs as strings where supported. Reject malformed or blank
land input rather than coercing it to zero. Keep admin identifiers as strings.
List results must handle unknown selections and empty states accurately.

### Delivery and race handling

- Default Numbers can load when enhancement starts; defer other domain modules
  until selection. Do not import the package root or all domains eagerly.
- Cache module promises, not sensitive user input across sessions.
- Use a monotonically increasing request ID or equivalent to prevent old async
  results from overwriting a newer selection/input.
- Expose real loading immediately during first module load; no fake delay.
- Avoid pulling palika datasets into the hero through full admin entrypoints.
- Render results with textContent, never interpolated untrusted HTML or eval.
- Clipboard actions confirm success only after write resolves and display a
  useful failure message when browser permissions prevent copying.

## 6. Motion direction: tactile, responsive, quiet

Motion should communicate cause and effect. The product is a reliable toolkit,
not an arcade switch panel.

| Moment | Behavior | Starting timing |
| --- | --- | --- |
| Hero arrival | Headline/support/CTA appear in a small stagger | 300–450ms, 50–70ms offset |
| Panel arrival | One soft opacity + 8px vertical reveal | 400ms, after headline |
| Pointer-down | Immediate modest press feedback on button surfaces | 80–100ms |
| Domain change | Thumb slides, selected border/label changes together | 180–240ms |
| Readout change | Small opacity crossfade; same spatial origin | 120–160ms |
| Input result | Update immediately; no digit-by-digit animation while typing | no artificial delay |
| Copy success | Label/icon changes, concise status announcement | no decorative burst |

- CSS transitions for simple thumb position and color changes can retarget
  naturally; do not build gesture physics for a control that is not draggable.
- If a spring library is warranted, use no-bounce, critically damped behavior;
  do not add it just to animate eight controls.
- No recurring pulses, spinning gears, sound, haptics, cursor tracking, parallax,
  autoplay domain cycling, or page-wide entrance sequences.
- Never lock controls until animation completes.
- Keep essential text visible even if animation scripts fail.
- Reduced motion: static positions with brief opacity/state feedback only.
- Reduced transparency: opaque navigation. Increased contrast: stronger edges.

## 7. SEO and semantic content

Do not assume the prior chat's SEO findings are verified. Existing domain labels
already render as HTML and there is a no-JS fallback; the concern is ensuring
useful descriptions are ordinary visible content as well, not script-only.

### Static domain index

Below the hero, render eight readable, indexable cards/rows directly in Astro:

- A real heading, e.g. “BS and AD dates.”
- Specific use case in one or two sentences.
- Public import path and one valid example.
- Direct docs link.

No hidden SEO paragraphs or keyword repetition. These sections explain the
actual product to both humans and crawlers and do not require JavaScript.

### Metadata and deployment

- Audit current `site`, `base`, and workflow values before calling them bugs:
  correct canonicals depend on both the configured origin and base prefix.
- Ensure homepage and playground have title, description, canonical and social
  metadata, as well as the existing Starlight docs metadata.
- Derive canonical URLs once; test origin plus `/repository/` without duplicate
  prefixes. Use the actual repository/domain, not a proposed unowned hostname.
- Include a real 1200×630 social preview asset carrying the headline and a small
  switchboard motif; its URL must be absolute in social metadata.
- Verify sitemap entries and robots.txt sitemap URL against the deployed origin.
- A SoftwareSourceCode JSON-LD object can describe the actual repository,
  programming language, and license. Do not fabricate ratings/download counts or
  promise a Google rich result for this schema.
- Optional llms.txt can point to docs; it is not a search-ranking guarantee and
  must not be represented as a recognized Google SEO requirement.
- Helpful query-specific guides (“BS to AD in JavaScript”, “Nepali number
  grouping”, etc.) should be accurate and substantial, not duplicate doorway pages.
- Preserve existing docs paths and verify relative links after nested routing.

## 8. Accessibility and progressive enhancement

- Real headings, navigation landmarks, existing skip link, visible focus rings.
- Fieldset/legend for domain radios; labelled inputs and status region.
- Invalid inputs have associated guidance and appropriate aria-invalid state.
- Polite status messages for completed actions; no screen-reader announcements
  for every pointer hover or each animated frame.
- Display enough Devanagari line height to avoid clipping.
- Decorative panel indicators excluded from accessibility traversal.
- Initial result and all domain docs links readable without JavaScript.
- Without JavaScript, show a clear “Interactive examples require JavaScript”
  note and use domain links as the way to explore; do not leave deceptive
  operable-looking switches that cannot change the readout.
- Prefer progressive enhancement that enables controls only after handlers are
  ready; maintain the static domain index irrespective of enhancement status.
- Selection/state distinguishable by position, label and contrast, not color alone.

## 9. File responsibilities

Inspect the current files before edits; cancelled agent work has already changed
the homepage and playground since the original plan was written.

Proposed changes:

```text
apps/website/src/
  components/
    DomainSwitchboard.astro       Panel, radios, served default readout
    DomainIndex.astro             Static, crawlable domain cards
    DomainConstellation.astro     Retire after switchboard integration
    SiteHeader.astro              Refine surfaces; shared theme behavior
    SiteFooter.astro              Cohesive closing CTA and navigation
  data/
    domains.ts                    One authoritative domain description inventory
  lib/
    demo-calls.ts                 Verified calls and snippets; no eager imports
    site-urls.ts                  Base-aware links/canonical helpers if needed
  scripts/
    switchboard.ts                Selection, input, race-safe lazy evaluation
  styles/
    tokens.css                    Monochrome surface/type/motion tokens
    switchboard.css               Panel and control styles
    landing.css                   Homepage hierarchy and responsive composition
  layouts/
    MarketingLayout.astro         Shared SEO and progressive enhancement framing
  pages/
    index.astro                   New hero, domain index, precision, getting started

apps/website/public/social/       Real preview image, not empty placeholder
apps/website/tests/               Interaction and static-output validation
```

Avoid copying the entire large standalone playground into the hero. Share small
verified execution/snippet helpers only where useful. Keep marketing metadata
free of imports retaining all datasets.

Preserve the standalone playground and Starlight docs. Only remove the octopus
component after confirming no other page uses it; retain historical plan docs.

## 10. Staged implementation and review

### Stage 1: visual prototype

Build the actual panel with Numbers selected and a real served result. Establish
headline hierarchy, two-column composition, material depth, and mobile stacking.
Review desktop/mobile in both themes before expanding behavior. Acceptance:
the page reads as a polished developer product and the panel is the clear visual
signature, not eight generic card tiles.

### Stage 2: interactive switchboard

Implement native radio behavior, all eight domain modes, per-domain input memory,
complete snippets, copy feedback, validation, loading and async race protection.
Verify fast repeated selections and edits while a module loads. Acceptance:
input → selected function → exact output is understandable without explanation.

### Stage 3: motion and accessible adaptation

Add one-time entrance and restrained selection/readout transitions. Verify
keyboard, screen-reader spot checks, mobile taps, reduced motion, disabled JS,
increased text size and contrast. Acceptance: all controls respond immediately
and all essential links/content remain available.

### Stage 4: static content and SEO

Ship visible domain descriptions, factual precision section, social preview,
correct metadata/schema and base-safe navigation. Inspect generated HTML and
validate all internal links and canonical URLs in root and project-base builds.
Acceptance: the product purpose, domains and docs are understandable in raw HTML.

### Stage 5: production verification

Run builds serially: Astro uses the same dist directory and concurrent root/base
builds interfere. Save browser evidence on desktop and mobile in both themes.
Record actual initial JS and lazy chunks; no admin palika table on initial load.

Commands from repository root:

```bash
pnpm --filter nepali-toolkit build
pnpm --filter @nepali-toolkit/website typecheck
pnpm --filter @nepali-toolkit/website test
pnpm --filter @nepali-toolkit/website build
SITE_BASE=/nepali-toolkit/ SITE_URL=https://kbohara315.github.io pnpm --filter @nepali-toolkit/website build
```

Add meaningful browser checks for selection, input results, invalid state,
copy failure, keyboard access, persisted theme across docs, and race safety.
Source regex tests alone cannot verify these behaviors. Inspect running servers
before starting another and follow applicable browser/terminal skill guidance.

### Final acceptance checklist

- [ ] Signature switchboard replaces the octopus and fits the hero coherently.
- [ ] Exactly one selected domain; native keyboard semantics work.
- [ ] All eight demos call actual public APIs with accurately labelled outputs.
- [ ] Old async results cannot overwrite current selection or input.
- [ ] Copy snippets contain required imports and match executed inputs.
- [ ] First-load and error feedback are truthful; no artificial waiting.
- [ ] Light/dark/system theme behavior is coherent with documentation.
- [ ] Mobile 320/390px, tablet and desktop have no page overflow or clipped text.
- [ ] Reduced-motion/no-JS users retain usable content and documentation links.
- [ ] All eight domain descriptions are visible static HTML, not script-only.
- [ ] Metadata, social preview, sitemap and canonical URLs respect real site/base.
- [ ] Root/project-base builds and nested docs navigation pass.
- [ ] No unsupported performance, adoption, accuracy or data claims appear.
- [ ] Typecheck/tests/build pass, browser evidence and bundle observations reported.

Do not change utility APIs to facilitate the redesign. Do not commit, push or
publish as part of implementation unless the user requests those actions.
