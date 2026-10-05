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

test('playground uses lazy public toolkit imports', async () => {
  const source = await read('src/components/Playground.astro');
  assert.match(source, /import\('nepali-toolkit\/number'\)/);
  assert.match(source, /import\('nepali-toolkit\/admin\/provinces'\)/);
  assert.doesNotMatch(source, /eval\(/);
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
  assert.match(source, /\[The playground\]\(\.\.\/\.\.\/playground\/\)/);
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
