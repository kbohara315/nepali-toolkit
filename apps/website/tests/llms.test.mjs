import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { docGroups, orderedDocs, markdownForDoc, llmsText, llmsFullText } from '../src/lib/llms.ts';

const root = resolve(import.meta.dirname, '..');
const content = resolve(root, 'src/content/docs');
const read = (path) => readFile(resolve(root, path), 'utf8');
const files = await readdir(content, { recursive: true });
const docs = await Promise.all(files.filter((file) => file.endsWith('.mdx')).map(async (file) => {
  const body = await readFile(resolve(content, file), 'utf8');
  const field = (name) => body.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1];
  return { id: file.replace(/\.mdx$/, '').replace(/\/index$/, ''), title: field('title'), description: field('description'), body };
}));

test('central inventory covers exactly the 21 published MDX docs, excluding 404', () => {
  const ordered = orderedDocs(docs);
  assert.equal(ordered.length, 21);
  assert.deepEqual(ordered.map((doc) => doc.id), docGroups.flatMap((group) => group.ids));
  assert.equal(ordered.some((doc) => doc.id === '404'), false);
  assert.throws(() => orderedDocs([...docs, { id: 'docs/new-page' }]), /inventory/);
  assert.throws(() => orderedDocs(docs.filter((doc) => doc.id !== 'docs')), /inventory/);
});

for (const base of ['/', '/nepali-toolkit/']) {
  const site = `https://example.com${base}`;
  test(`generated Markdown uses source metadata, bodies, and absolute links at ${base}`, () => {
    const concise = llmsText(docs, site, base);
    const full = llmsFullText(docs, site, base);
    assert.match(concise, /^# Nepali Toolkit\n/);
    assert.match(concise, /root exports no utilities/);
    const summary = concise.split('## Start here')[0];
    assert.match(summary, /no runtime dependencies/);
    assert.doesNotMatch(summary, /\b\d{4}-\d{2}-\d{2}\b|\bES\d+\b|working transcription|live reachability|legacy post offices/);
    for (const id of ['docs/reference/date', 'docs/project/compatibility', 'docs/project/data-sources']) {
      const doc = docs.find((entry) => entry.id === id);
      assert.ok(summary.includes(`[${doc.title}](https://example.com${base}${id}/)`));
      const updated = docs.map((entry) => entry.id === id ? { ...entry, title: 'Updated source title' } : entry);
      assert.ok(llmsText(updated, site, base).split('## Start here')[0].includes(`[Updated source title](https://example.com${base}${id}/)`));
    }
    for (const doc of orderedDocs(docs)) {
      assert.ok(concise.includes(`- [${doc.title}](https://example.com${base}${doc.id}/): ${doc.description}`));
      assert.ok(full.includes(`# ${doc.title}\n\nSource: https://example.com${base}${doc.id}/`));
      assert.ok(full.includes(markdownForDoc(doc.body, doc.id, site, base)));
      const fences = (text) => [...text.matchAll(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm)].map((match) => match[0].trimEnd());
      assert.deepEqual(fences(markdownForDoc(doc.body, doc.id, site, base)), fences(doc.body));
    }
    assert.doesNotMatch(full, /^title:|^description:|<html|<nav|<footer|Not found|Page not found/m);
    assert.doesNotMatch(full, /\]\((?:\.\.?\/|\/|#)/);
    assert.ok(full.includes(`[playground](https://example.com${base}playground/)`));
    assert.doesNotMatch(full, /nepali-toolkit\/nepali-toolkit\//);
  });
}

test('link resolution preserves titles, reference links, fragments, queries, and code literals', () => {
  const source = '---\ntitle: Test\n---\n## Heading\n[Sibling](../number/#digits "Title")\n[Root](/playground/?a=1#demo)\n[Local](#heading)\n[Ref][r]\n[r]: <../../guides/exact-money-and-words/> "Guide"\n[External](https://other.test/x)\n`[literal](../raw/)`\n```md\n[code](../untouched/)\n<div>code</div>\n```';
  const output = markdownForDoc(source, 'docs/reference/date', 'https://example.com/nepali-toolkit/', '/nepali-toolkit/');
  assert.match(output, /^## Heading/);
  assert.ok(output.includes('[Sibling](https://example.com/nepali-toolkit/docs/reference/number/#digits "Title")'));
  assert.ok(output.includes('[Root](https://example.com/nepali-toolkit/playground/?a=1#demo)'));
  assert.ok(output.includes('[Local](https://example.com/nepali-toolkit/docs/reference/date/#heading)'));
  assert.ok(output.includes('[r]: <https://example.com/nepali-toolkit/docs/guides/exact-money-and-words/> "Guide"'));
  assert.ok(output.includes('[External](https://other.test/x)'));
  assert.ok(output.includes('`[literal](../raw/)`'));
  assert.ok(output.endsWith('```md\n[code](../untouched/)\n<div>code</div>\n```'));
  assert.throws(() => markdownForDoc('<Widget />', 'docs', 'https://example.com', '/'), /Non-Markdown/);
});

test('Starlight package-manager tabs become readable Markdown for AI docs', () => {
  const source = docs.find((doc) => doc.id === 'docs/getting-started').body;
  const output = markdownForDoc(source, 'docs/getting-started', 'https://example.com', '/');
  assert.match(output, /### npm\n\n```sh\nnpm install nepali-toolkit/);
  assert.match(output, /### pnpm\n\n```sh\npnpm add nepali-toolkit/);
  assert.match(output, /### Yarn\n\n```sh\nyarn add nepali-toolkit/);
  assert.match(output, /### Bun\n\n```sh\nbun add nepali-toolkit/);
  assert.doesNotMatch(output, /<Tabs|<TabItem|from '@astrojs\/starlight\/components'/);
});

test('static endpoints load authoritative content and discovery makes no license claim', async () => {
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const endpoint = await read(`src/pages/${name}.ts`);
    assert.match(endpoint, /export const prerender = true/);
    assert.match(endpoint, /await loadLlmDocs\(\)/);
    assert.match(endpoint, /text\/plain; charset=utf-8/);
  }
  const loader = await read('src/lib/llms-docs.ts');
  assert.match(loader, /getCollection\('docs'/);
  assert.match(loader, /query: '\?raw'/);
  const footer = await read('src/components/SiteFooter.astro');
  const layout = await read('src/layouts/MarketingLayout.astro');
  for (const name of ['llms.txt', 'llms-full.txt']) assert.ok(footer.includes(name));
  assert.doesNotMatch(footer + layout, /MIT|opensource.org\/license|\/LICENSE/);
});

// Run after each root/Pages build with LLMS_BUILD_BASE to verify real Astro artifacts.
test('built Astro endpoints equal the source-derived Markdown', { skip: process.env.LLMS_BUILD_BASE === undefined }, async () => {
  const base = process.env.LLMS_BUILD_BASE;
  const site = process.env.SITE_URL ?? 'https://kbohara315.github.io';
  assert.equal(await read('dist/llms.txt'), llmsText(docs, site, base));
  assert.equal(await read('dist/llms-full.txt'), llmsFullText(docs, site, base));
  const homepage = await read('dist/index.html');
  const source = await read('src/pages/index.astro');
  const title = source.match(/title="([^"]+)"/)[1];
  const description = source.match(/description="([^"]+)"/)[1];
  const escapedTitle = title.replaceAll('&', '&amp;');
  assert.ok(homepage.includes(`<title>${escapedTitle}</title>`));
  for (const property of ['og:title', 'twitter:title']) {
    assert.ok(homepage.includes(`property="${property}" content="${escapedTitle}"`) ||
      homepage.includes(`name="${property}" content="${escapedTitle}"`));
  }
  for (const name of ['description', 'og:description', 'twitter:description']) {
    assert.ok(homepage.includes(`name="${name}" content="${description}"`) ||
      homepage.includes(`property="${name}" content="${description}"`));
  }
  assert.match(homepage, /Nepali conventions\./);
  assert.match(homepage, /Ready to import\./);
});
