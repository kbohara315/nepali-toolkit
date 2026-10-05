# Nepali Toolkit website — agent implementation plan

## 1. Purpose and implementation boundary

Build a premium showcase and documentation site for `nepali-toolkit` in
`apps/website/`. This document is a handoff specification, not permission to
implement immediately. Start implementation when the user requests it.

The current deliverable contains only this plan and a README. All directories,
components, configuration, and workflows below are proposed future work.

### Agreed direction

- Astro + Starlight for one cohesive showcase and documentation site.
- Fully static deployment on GitHub Pages.
- Black-and-white visual identity with both light and dark themes.
- A central toolkit node with curved, octopus-like connections to domain nodes.
- Hover/focus/tap reveals what each domain does; explicit links lead to docs.
- Real interactive examples using the library, not fabricated outputs.
- Premium through typography, spacing, contrast, and restrained movement.

Use **strictly neutral colors** for the initial design. The earlier suggestion
of saffron was optional and is not part of this specification. Communicate
success/errors through text, icons, borders, and accessible announcements.

### Scope boundaries

- Do not change toolkit public APIs to suit demos.
- Do not present the scaffold-level `nepali-ui` package as production-ready.
- Do not add a backend, authentication, database, CMS, or paid search service.
- Do not claim an unverified domain is available or already owned.
- Preserve existing work in the repository and read applicable AGENTS.md files.

## 2. Repository facts and terminology

At planning time:

- This is a pnpm monorepo with `apps/*` and `packages/*` workspace globs.
- Root package manager declaration is `pnpm@9.0.0`.
- Existing `apps/` contains `expo-example/`.
- The production utility package is `packages/nepali-toolkit`.
- Its README describes zero runtime dependencies, TypeScript-first APIs,
  ESM/CJS builds, and domain-specific entrypoints.
- The README marks the package as early development before 1.0.

The diagram represents **domains/subpath exports of one toolkit package**, not
eight separately published npm packages. Use accurate terminology in copy.

Before implementation, inspect the current package manifest, exports, source,
tests, existing `docs/`, and build scripts. They are the authority for function
signatures, supported inputs, data coverage, and limitations. Reuse verified
documentation instead of inventing parallel specifications.

## 3. Brand, copy, and visual system

### Recommended hero copy

Eyebrow: `NEPALI TOOLKIT`

Headline: **Build for Nepal. With less code.**

Supporting text:

> TypeScript utilities for Nepali dates, numbers, currency, land units,
> number words, phone numbers, sorting, and administrative data.

Primary CTA: `Get started` → `/docs/getting-started/`

Secondary CTA: `Try playground` → `/playground/`

Copyable install command: `pnpm add nepali-toolkit`, with npm and yarn tabs.

Verified benefit labels: `TypeScript-first`, `Zero runtime dependencies`,
`Import only what you need`. Do not publish size, speed, adoption, or coverage
numbers without reproducible evidence. Keep prerelease status visible in docs.

### Visual tokens

| Token | Light | Dark |
| --- | --- | --- |
| Canvas | #FAFAFA | #090909 |
| Surface | #FFFFFF | #111111 |
| Primary text | #111111 | #FAFAFA |
| Secondary text | #525252 | #B5B5B5 |
| Decorative border | #E5E5E5 | #2A2A2A |
| Active control | #111111 | #FAFAFA |
| Active control text | #FFFFFF | #111111 |

These are starting values; measure contrast in actual rendered states.
Decorative borders are not substitutes for sufficiently visible control edges.

- Use one clean sans-serif family with system fallbacks; consider Geist Sans.
- Use a monospace face for code, with a legible Devanagari fallback such as
  Noto Sans Devanagari. Verify mixed-script baselines and line heights.
- Prefer self-hosted, subsetted fonts if custom fonts are chosen.
- Desktop hero headline approximately 56–72px; mobile approximately 36–44px.
- Use a consistent spacing scale and a content max-width near 1200px.
- Restrained corner radii, thin rules, and generous whitespace.
- Avoid excessive rounded cards, glow, glass effects, gradients, and stock art.
- Diagram connectors may use muted grays; text must remain readable.

### Theme behavior

Offer Light / Dark / System selection, defaulting to system preference.
Reuse Starlight's supported theme mechanism and persistence across both layouts.
Check the installed Starlight version before integrating its theme primitives;
do not invent or depend on private storage keys. Prevent first-paint theme
flashes and verify navigation keeps the selected appearance.

## 4. Page structure

```text
/
├── Hero: promise + CTAs + install command
├── Interactive domain constellation
├── Live example: input → real toolkit result + import snippet
├── Why this toolkit: three concise, verifiable benefits
├── Getting started: install → import → use
└── Footer: Docs · Playground · GitHub · npm · License

/docs/
├── Getting started
├── Guides
├── Domain reference (eight domains)
└── Project: compatibility, data sources, release notes

/playground/
└── Select domain → edit valid inputs → inspect output → copy example
```

### Desktop landing sketch

```text
+------------------------------------------------------------------+
| Nepali Toolkit                Docs  Playground  GitHub  [Theme]   |
|------------------------------------------------------------------|
|                                                                  |
|  Build for Nepal.                  [Date]       [Numbers]         |
|  With less code.                        \       /                |
|                            [Currency] ---\     /--- [Land]       |
|  Small supporting paragraph.           [TOOLKIT]                 |
|                            [Words] ------/     \--- [Phone]      |
|  [Get started] [Try playground]          /       \                |
|                                    [Sorting]   [Admin]           |
|  $ pnpm add nepali-toolkit [Copy]                                 |
|                                  [Selected domain explanation]   |
|------------------------------------------------------------------|
| Try it: [Domain selector]  [Input] → [Output]   [Code / Copy]       |
|------------------------------------------------------------------|
| TypeScript-first   |   No runtime dependencies   |   Scoped imports|
|------------------------------------------------------------------|
| Install → Import → Use                         [Read the docs]    |
+------------------------------------------------------------------+
```

At small widths, stack the headline and a compact hub illustration above a
two-column or single-column list of domain controls. Preserve readable labels
and generous tap targets rather than shrinking the whole desktop diagram.

## 5. Interactive octopus / domain constellation

### Domain inventory

| Node label | Entrypoint | Explanation | Docs destination |
| --- | --- | --- | --- |
| Dates | `nepali-toolkit/date` | Convert BS/AD dates, format dates, and work with date arithmetic. | `/docs/reference/date/` |
| Numbers | `nepali-toolkit/number` | Format lakh/crore grouping and parse numeric values. Include digit conversion through `/number/digits`. | `/docs/reference/number/` |
| Currency | `nepali-toolkit/currency` | Format NPR amounts, including supported minor-unit options. | `/docs/reference/currency/` |
| Land | `nepali-toolkit/land` | Convert supported Hill and Terai land-area units. | `/docs/reference/land/` |
| Words | `nepali-toolkit/words` | Express numbers and NPR amounts as English or Nepali words. | `/docs/reference/words/` |
| Sorting | `nepali-toolkit/collation` | Sort text using Nepali-aware collation. | `/docs/reference/collation/` |
| Phone | `nepali-toolkit/phone` | Parse, format, and validate supported Nepal phone numbers. | `/docs/reference/phone/` |
| Admin | `nepali-toolkit/admin` | Explore province, district, palika, ward, and postal-code data within documented coverage. | `/docs/reference/admin/` |

Verify wording against current APIs. Model this inventory once as typed metadata
used by diagram controls, cards, and playground navigation. Do not put runtime
imports of every domain in this shared metadata file.

### Layout and rendering

- Render real HTML controls over an SVG connector layer, not text inside canvas.
- Use a responsive SVG viewBox and cubic Bézier paths to suggest tentacles.
- A stable, explicit layout for eight nodes is preferable to a force simulation.
- Keep all branches connected to the central toolkit; no implied dependency
  links between unrelated domains.
- SVG is decorative (`aria-hidden`); the actual controls carry meaning.
- Reserve space for the detail panel to avoid layout shifts during selection.

### Interaction contract

1. Default panel briefly explains the diagram; do not autoplay through modules.
2. Pointer hover previews a domain in the detail panel.
3. Keyboard focus previews the same information.
4. Click, Enter, Space, or tap selects/pins the domain.
5. The selected node exposes its state, e.g. with `aria-pressed` on a button.
6. A separate `Read date docs →` style link navigates; first tap never depends
   on an invisible hover state.
7. When a transient preview ends, return to the pinned domain or default panel.
8. Include a short description, import path, verified example, and docs link.
9. Keep focus where the user put it; avoid trapping focus or announcing each
   pointer movement through an overly chatty live region.
10. Without JavaScript, render a usable domain list with descriptions and links.

### Animation specification

| Moment | Treatment | Approximate duration |
| --- | --- | --- |
| Initial reveal | One-time subtle opacity/translate entrance | 300–450ms |
| Connector reveal | Optional one-time stroke draw | 450–650ms total |
| Hover/focus | Border and active connector emphasis | 120–180ms |
| Detail change | Short opacity transition, stable panel dimensions | 120–180ms |
| Demo output | Brief fade after recomputation | 100–150ms |

Use CSS and a small client script first. A short SVG stroke animation is fine,
but avoid continuous animated stroke work. No infinite pulses, floating nodes,
cursor-following lines, scroll hijacking, or heavy animation dependency.
With `prefers-reduced-motion`, show the final layout immediately and remove
movement. Content must not depend on animation completing to become accessible.

## 6. Starlight documentation

Use a custom Astro landing page at `/`, with Starlight docs under `/docs/`.
Use supported routing/content configuration from the installed version; check
for an index-route collision before investing in styling.

### Initial information architecture

```text
docs/
  index                      Documentation overview
  getting-started             Install, domain imports, first working example
  guides/
    imports-and-bundling       Subpaths, ESM/CJS, focused admin imports
    dates-and-calendars        BS/AD conventions, ranges, validation, timezones
    administrative-data       Hierarchy, identifiers, sources, limitations
  reference/
    date
    number                    Include dedicated digits entrypoint
    currency
    land
    words
    collation
    phone
    admin                     Include level-specific entrypoints
  project/
    compatibility             Verified runtimes and framework usage
    data-sources              Provenance and update/coverage notes
    releases                  Actual releases or links to canonical changelog
```

Every domain page should include:

- What the domain solves and which import path to use.
- Working, copyable quick-start code.
- Public function reference with types, arguments, defaults, and return shape.
- Validation/error behavior and known coverage limits.
- Practical examples and links to relevant guides/playground modes.
- Source/provenance notes where applicable.

Audit all public exports and maintain a checklist so less visible APIs are not
omitted. Group long APIs into subpages when necessary. Start with human-written
Markdown/MDX; only introduce API generation if it produces useful, maintainable
output. Compile/check representative documentation examples against the package.

Use Starlight's bundled static search integration (verify current configuration
and built-site indexing). Search must work on GitHub Pages without a server API.
Do not promise built-in versioned documentation: start with one current version
and defer any multi-version publishing until needed.

## 7. Playground

Use the workspace package through its public entrypoints. Run browser-safe
utilities entirely on the client; ship initial HTML for labels and instructions.

Recommended initial modes:

1. ASCII ↔ Devanagari digits and Nepali number grouping.
2. BS ↔ AD date conversion with explicit supported-range guidance.
3. NPR formatting.
4. Province → district → palika cascading lookup.

Add land, words, phone, and collation examples before declaring the full
playground complete. Verify signatures in source; examples in this plan describe
capabilities rather than a guessed implementation API.

- Use explicit per-domain dynamic imports so opening the landing page does not
  download all administrative datasets.
- Prefer focused `admin/provinces`, `admin/districts`, `admin/palikas` entrypoints.
- Preserve leading zeros and large/decimal numeric input using strings where
  the public API supports them; avoid unnecessary numeric coercion.
- Show invalid input as helpful inline feedback, not uncaught exceptions.
- Distinguish loading, valid result, empty state, and validation failure.
- Generate displayed snippets from the same normalized inputs used to execute.
- Render user input as text, never untrusted HTML; no arbitrary code evaluation.
- Copy snippet/output buttons have accessible labels and visible confirmation.
- Initial sample inputs should be deterministic, not dependent on today's date.

## 8. Proposed technology and file layout

Use Astro, Starlight, TypeScript, Markdown/MDX, plain CSS, and small browser
scripts. Add framework islands only if the interaction genuinely warrants them;
React and an animation library are not baseline requirements.

Choose compatible stable versions at implementation time and commit lockfile
changes then. Suggested workspace package name: `@nepali-toolkit/website`.
Dependency on the utility package: `nepali-toolkit: workspace:*`.

```text
apps/website/
├── README.md
├── IMPLEMENTATION_PLAN.md
├── package.json                 Future scripts and dependencies
├── astro.config.mjs             Static output, Starlight, site/base handling
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   ├── fonts/                   If self-hosted fonts are selected
│   └── social/                  Static preview image
├── src/
│   ├── content.config.ts        Or current-version content configuration
│   ├── content/docs/docs/       Route prefix; verify with installed Starlight
│   │   ├── index.mdx
│   │   ├── getting-started.mdx
│   │   ├── guides/
│   │   ├── reference/
│   │   └── project/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── playground.astro
│   │   └── 404.astro
│   ├── layouts/
│   │   └── MarketingLayout.astro
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── ThemeControl.astro
│   │   ├── Hero.astro
│   │   ├── DomainConstellation.astro
│   │   ├── DomainDetails.astro
│   │   ├── InstallCommand.astro
│   │   └── Playground.astro
│   ├── data/domains.ts          Shared descriptive metadata, no eager imports
│   ├── lib/urls.ts              Base-aware internal links
│   ├── scripts/
│   │   ├── constellation.ts
│   │   └── playground.ts        Explicit lazy domain loading
│   └── styles/
│       ├── tokens.css
│       ├── global.css
│       ├── landing.css
│       └── docs.css             Supported Starlight customization
└── tests/                       Focused behavior and deployment checks

.github/workflows/deploy-website.yml   Future Pages build/deploy workflow
```

This tree is a responsibility map, not a requirement to create empty placeholder
files. Align actual content paths and integrations with current official docs.
Keep the top-level existing `docs/` intact; determine what content should be
adapted or linked before moving anything.

## 9. GitHub Pages deployment

### Address ownership

`https://nepali-toolkit.github.io/` requires control of the GitHub account or
organization named `nepali-toolkit`, plus its special Pages repository named
`nepali-toolkit.github.io`. A repository with that name under another owner does
not grant the desired hostname.

During implementation, inspect the actual Git remote and ask the user to confirm
the intended owner/repository before enabling deployment. A public profile or
API check can show an existing account. A 404 from either the Pages site or
profile is **not proof of claimability**; GitHub's account/organization creation
validation is the authoritative next check. Never create an organization merely
to test availability.

### Both deployment modes must work

| Mode | Astro site | Astro base |
| --- | --- | --- |
| Owner Pages repository | `https://nepali-toolkit.github.io` | `/` |
| Ordinary project repository | `https://OWNER.github.io` | `/REPOSITORY/` |

Treat these as examples, not verified infrastructure. Centralize deployment
configuration with documented environment variables or build-time settings.
Use Astro's configured base for internal links, assets, playground URLs, and
canonical URLs; do not scatter assumed root-relative paths throughout the UI.

### Build and deployment approach

1. Keep `output: 'static'`; no server adapter, SSR route, or runtime-only endpoint.
2. Install dependencies from the root with the pinned pnpm version and frozen
   lockfile; use a Node version supported by the selected Astro release.
3. Build `nepali-toolkit` before the website so package exports resolve.
4. Run site checks and build the website for its actual site/base combination.
5. Upload `apps/website/dist` as the Pages artifact using maintained official
   GitHub actions and deploy with the official Pages deployment action.
6. Use `contents: read`, `pages: write`, and `id-token: write` permissions as
   appropriate, the `github-pages` environment, and deployment concurrency.
7. Build/check pull requests; deploy only trusted default-branch pushes or
   explicit workflow dispatch. Confirm the default branch rather than guessing.
8. Configure repository Pages source to GitHub Actions. Record any manual
   repository settings required; do not claim deployment succeeded before it has.

If the desired owner Pages repository is separate from this monorepo, that needs
an explicit cross-repository publishing design and user-authorized credentials;
the monorepo's normal Pages action does not automatically deploy to another
repository. Prefer deploying to this repository's project URL first unless the
target repository is already established.

Validate direct navigation and refresh at nested docs routes, search results,
static assets, the playground, and the custom 404. Prefer generated directory
URLs/trailing slashes compatible with Pages. No SPA fallback assumptions.
Do not add CNAME unless a real custom domain is supplied later.

## 10. Accessibility, performance, and discoverability

- Semantic landmarks, a skip link, coherent heading hierarchy, descriptive links.
- Keyboard operation for every control and visibly contrasting focus rings.
- At least 44px tap targets where practical; readable layouts down to 320px.
- Contrast target: WCAG AA, including muted text and both theme variants.
- Diagram descriptions available without hover; decorative SVG excluded from
  accessibility traversal; no color-only state communication.
- No horizontal page overflow; code examples can scroll within their own region.
- Progressive enhancement: essential content and docs links work without JS.
- Honor reduced motion and system appearance; avoid flashing theme transitions.
- Reserve diagram, detail panel, and font space to prevent layout shifts.
- No global import of all toolkit domains; inspect emitted chunks for admin data.
- Target initial landing JS under 50KB gzip excluding optional search and
  on-demand demos; measure the real result and document any justified deviation.
- Aim for mobile Lighthouse performance/accessibility scores of at least 95 on
  representative built pages; treat scores as supporting evidence, not proof.
- Unique titles/descriptions, canonical URLs respecting base, sitemap, social
  preview metadata, favicon, and working GitHub/npm links verified from metadata.
- Keep descriptions of administrative sources and date limits precise.

## 11. Implementation phases and acceptance checkpoints

### Phase 1 — Verify and scaffold

- Read repository guidance and inspect exports, docs, build requirements, remotes.
- Verify current Astro/Starlight setup, theme APIs, static search, and routing.
- Create the website workspace with dev, build, preview, and typecheck scripts.
- Render a placeholder home page and one real docs page without route collision.
- Build under `/` and a project base prefix; verify links and assets in both.

**Checkpoint:** Static build and direct nested route loads work before polishing.

### Phase 2 — Design foundation and landing

- Implement tokens, typography, header, theme control, footer, and hero copy.
- Add install command tabs/copy and actual benefits grounded in package facts.
- Build the responsive domain constellation and its no-JS fallback.
- Implement pointer, keyboard, touch, selection, and reduced-motion behavior.

**Checkpoint:** All eight real domains are discoverable at mobile and desktop
sizes, in both themes, without overlap, hover-only content, or layout jumps.

### Phase 3 — Documentation

- Populate getting started, guides, and every domain reference from actual APIs.
- Verify examples; cover subpaths, errors, limitations, and data provenance.
- Style supported Starlight surfaces to match the landing design.
- Verify built-site search and links under the project base.

**Checkpoint:** A new user can install the toolkit, choose the correct import,
run an example, and find validation/coverage details without reading source.

### Phase 4 — Interactive examples

- Ship number/date/currency/admin modes first, then remaining domain modes.
- Wire actual library calls and explicit lazy imports.
- Validate input errors, loading, copied snippets, and focused admin entrypoints.

**Checkpoint:** Outputs match direct package calls; no unnecessary full-dataset
download occurs on the initial landing view.

### Phase 5 — Quality and publishing

- Add targeted browser checks for critical interactions and navigation.
- Complete keyboard, screen-reader spot checks, reduced-motion, and theme QA.
- Audit emitted bundles, representative performance, metadata, and dead links.
- Add the Pages workflow after the deployment target is confirmed.
- Document local development, site/base settings, and deployment steps in README.
- Report which URLs were actually deployed/tested and which remain unverified.

**Checkpoint:** All acceptance criteria below pass or are explicitly identified
as blockers; visual completion alone is not deployment completion.

## 12. Verification and final delivery checklist

Proposed website commands to establish during implementation:

```bash
pnpm --filter nepali-toolkit build
pnpm --filter @nepali-toolkit/website typecheck
pnpm --filter @nepali-toolkit/website build
```

Add a documented browser-test command once the test runner exists. Test the
built static site, not just the development server. Inspect existing running
servers before starting another. Keep tests focused on user-visible behavior.

- [ ] Root and project-prefix builds pass; assets and links stay within base.
- [ ] All eight domain nodes reveal accurate descriptions and correct docs links.
- [ ] Keyboard and touch have the same essential functionality as hover.
- [ ] Themes persist across landing, playground, and docs without a flash.
- [ ] Reduced-motion users see complete content without animated movement.
- [ ] No-JS users can read the landing and follow documentation links.
- [ ] All reference pages cover current public exports and tested examples.
- [ ] Search works on the built static deployment, including prefixed routes.
- [ ] Valid and invalid playground inputs are handled; outputs use real APIs.
- [ ] No large admin dataset is eagerly loaded by the landing diagram.
- [ ] Mobile (320/390px), tablet, and desktop layouts have no overlap/overflow.
- [ ] Direct docs URLs and refresh work on Pages; 404 links respect base.
- [ ] Contrast, focus, copy confirmations, and screen-reader labels are checked.
- [ ] Metadata, repository/npm links, installation commands, and license agree
      with current repository/package information.
- [ ] Deployment destination/ownership is confirmed and workflow is documented.
- [ ] README includes local commands, content authoring, and deployment setup.

No utility source changes are expected. If implementation changes utility
source/packaging, follow root and package AGENTS.md gates, including typecheck,
tests, package verification, tree-shaking verification, and applicable before/
after runtime benchmarks. Do not modify utility code merely to bypass website
build issues.

Final implementation handoff should summarize created pages, exact checks run,
measured performance/bundle observations, preview evidence in both themes, and
any user action still needed to enable GitHub Pages. Commit, push, or publish
only when requested.
