import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (file) => readFile(resolve(root, file), 'utf8');

test('site documents all eight toolkit domains', async () => {
  const source = await read('src/data/domains.ts');
  for (const domain of [
    'date',
    'number',
    'currency',
    'land',
    'words',
    'collation',
    'phone',
    'admin',
  ])
    assert.match(source, new RegExp(`id: '${domain}'`));
});

test('site is static and Pages-ready', async () => {
  const config = await read('astro.config.mjs');
  const workflow = await read('../../.github/workflows/deploy-website.yml');
  assert.match(config, /output: 'static'/);
  assert.match(workflow, /actions\/deploy-pages/);
  assert.match(workflow, /SITE_BASE/);
});

test('favicon and site brand share the Nepali developer mark', async () => {
  const favicon = await read('public/favicon.svg');
  const brand = await read('src/components/SiteBrand.astro');
  assert.match(favicon, /M33 47L19 64L33 81/);
  assert.match(favicon, /M95 47L109 64L95 81/);
  assert.match(favicon, />\s*ने\s*</);
  assert.match(favicon, /prefers-color-scheme:\s*dark/);
  assert.match(favicon, /font-size="46"/);
  assert.match(brand, /src=\{`\$\{import\.meta\.env\.BASE_URL\}favicon\.svg`\}/);
  assert.match(brand, /alt="" aria-hidden="true"/);
});

test('playground uses lazy public toolkit imports', async () => {
  const source = await read('src/components/Playground.astro');
  assert.match(source, /import\('nepali-toolkit\/number'\)/);
  assert.match(source, /import\('nepali-toolkit\/admin\/provinces'\)/);
  assert.doesNotMatch(source, /eval\(/);
});

test('playground workbench exposes grouped navigation, real task controls, safe snippets, and package provenance', async () => {
  const source = await read('src/components/Playground.astro');
  for (const feature of [
    'playground-nav-group', 'playground-nav-item', 'playground-search',
    'playground-${id}', "[['Year', year, 'year'], ['Month', month, 'month'], ['Day', day, 'day']]",
    'playground-land-system', 'teraiArea(fields)', 'toSquareMetres(area)',
    'playground-collation-task', 'createNepaliCollator().sort(values)',
    'playground-province', 'playground-district', 'playground-palika', 'playground-ward',
    'getWardPostalCode', 'playground-view-toggle', 'serializeResult(outcome.json)', "typeof item === 'bigint' ? item.toString() : item",
    "searchParams.set('tool', mode.id)", "addEventListener('popstate'",
    'published on npm', 'not sent to a remote', 'highlightSnippet(nextSnippet)',
  ]) assert.ok(source.includes(feature), `missing workbench contract: ${feature}`);
  assert.doesNotMatch(source, /not published to npm yet|workspace library, which is not published/);
  assert.match(source, /snippet\.innerHTML = nextSnippet === '' \? '' : highlightSnippet\(nextSnippet\)/);
  assert.doesNotMatch(source, /innerHTML\s*=\s*(?:raw|painted\.snippet)/);
  assert.doesNotMatch(source, /<h1[^>]*>[^<]*(?:Try|Playground)/i);
});

test('no-JS controls are disabled while the build-time result remains real', async () => {
  const source = await read('src/components/Playground.astro');
  assert.match(source, /id="playground-search"[^>]*disabled/);
  assert.match(source, /class="playground-nav-item"[^>]*disabled/);
  assert.match(source, /id="playground-input"[\s\S]*?disabled/);
  assert.match(source, /formatNumber\(sampleMode\.sample\)/);
  assert.match(source, /JavaScript is off, so the utility controls are inert/);
});

test('playground keeps navigation in the sidebar and every task/result panel in the workspace', async () => {
  const source = await read('src/components/Playground.astro');
  const sidebarStart = source.indexOf('<aside class="demo-controls playground-sidebar"');
  const sidebarEnd = source.indexOf('</aside>', sidebarStart);
  const workspaceStart = source.indexOf('data-playground-workspace');
  const workspaceEnd = source.indexOf('<details class="playground-provenance"', workspaceStart);
  assert.ok(sidebarStart >= 0 && sidebarEnd > sidebarStart && workspaceStart > sidebarEnd);
  assert.match(source, /<section class="playground-workspace"[^>]*aria-label="Selected utility workspace"/);

  const sidebar = source.slice(sidebarStart, sidebarEnd);
  assert.match(sidebar, /id="playground-search"/);
  assert.match(sidebar, /id="playground-utilities"/);
  assert.match(sidebar, /id="playground-mode"[^>]*aria-hidden="true"/);
  for (const control of [
    'playground-options', 'playground-input-label', 'playground-input',
    'playground-hint', 'playground-examples', 'playground-status', 'playground-reset',
  ]) assert.doesNotMatch(sidebar, new RegExp(`id="${control}"`), `${control} must not be in the navigation sidebar`);

  const workspace = source.slice(workspaceStart, workspaceEnd);
  for (const control of [
    'playground-task-title', 'playground-task-description', 'playground-options',
    'playground-input-label', 'playground-input', 'playground-hint',
    'playground-examples', 'playground-status', 'playground-reset',
    'playground-result', 'playground-snippet', 'playground-docs-link',
  ]) assert.match(workspace, new RegExp(`id="${control}"`), `${control} belongs to the workspace`);
  assert.match(source, /taskTitle\.textContent = selectedTaskTitle\(mode\)/);
  assert.doesNotMatch(source, /<h1\b/i, 'Playground does not add a visible global title');
});

test('marketing pages provide a skip link and progressive domain controls', async () => {
  const layout = await read('src/layouts/MarketingLayout.astro');
  const switchboard = await read('src/components/DomainSwitchboard.astro');
  assert.match(layout, /class="skip-link" href="#main"/);
  assert.match(switchboard, /<fieldset disabled/);
  assert.match(switchboard, /type="radio"/);
  assert.match(switchboard, /Interactive examples require JavaScript/);
});

test('phone examples use raw-input validation correctly', async () => {
  const domains = await read('src/data/domains.ts');
  const reference = await read('src/content/docs/docs/reference/phone.mdx');
  assert.match(domains, /isPossibleNepalPhone\('9841234567'\)/);
  assert.match(reference, /isPossibleNepalPhone\('9841234567'\)/);
  assert.match(reference, /isValidNepalPhone\(phone\)/);
});

test('getting started relies on Starlight title rendering once', async () => {
  const source = await read('src/content/docs/docs/getting-started.mdx');
  assert.doesNotMatch(source, /^# Getting started$/m);
});

test('reference pages offer a uniform playground link without manual headings', async () => {
  for (const domain of [
    'date',
    'number',
    'currency',
    'land',
    'words',
    'collation',
    'phone',
    'admin',
  ]) {
    const source = await read(
      `src/content/docs/docs/reference/${domain}.mdx`,
    );
    assert.match(
      source,
      /Try it live in the \[playground\]\(\.\.\/\.\.\/\.\.\/playground\/\)/,
    );
    assert.doesNotMatch(source, /^# /m);
  }
});

test('sidebar exposes the playground as a top-level link', async () => {
  const config = await read('astro.config.mjs');
  assert.match(config, /\{ label: 'Playground', link: '\/playground\/' \}/);
});

test('docs landing still points at the playground', async () => {
  const source = await read('src/content/docs/docs/index.mdx');
  assert.match(source, /\[playground\]\(\.\.\/playground\/\)/i);
});

test('docs pages render sidebar-driven breadcrumbs above the title', async () => {
  const config = await read('astro.config.mjs');
  assert.match(
    config,
    /PageTitle: '\.\/src\/components\/overrides\/PageTitle\.astro'/,
  );
  const title = await read('src/components/overrides/PageTitle.astro');
  assert.match(title, /<Breadcrumbs \/>/);
  assert.match(title, /<h1 id="_top">/);
  const crumbs = await read('src/components/overrides/Breadcrumbs.astro');
  assert.match(crumbs, /aria-label="Breadcrumb"/);
  assert.match(crumbs, /aria-current="page"/);
  assert.match(crumbs, /isCurrent/);
});
