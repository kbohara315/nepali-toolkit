import test from 'node:test';
import assert from 'node:assert/strict';
import { demos, runDemo } from '../src/lib/demo-calls.ts';
import { siteUrl } from '../src/lib/site-urls.ts';

test('all eight real demos produce deterministic output with focused imports', async () => {
  const expected = { date: '2025-07-23', number: '1,23,45,678', currency: 'रु १,२३,४५६.५०', land: '1017.44', words: 'एक लाख तेइस हजार चार सय छपन्न', collation: 'किरण\nगीता\nराम', phone: 'true' };
  for (const [id, demo] of Object.entries(demos)) {
    const value = await runDemo(id, demo.sample);
    if (id === 'admin') {
      assert.ok(value.output.split('\n').includes('Kathmandu'));
      assert.ok(value.snippet.includes('nepali-toolkit/admin/districts'));
    } else assert.equal(value.output, expected[id]);
    assert.match(value.snippet, /import \{.*\} from 'nepali-toolkit\//);
  }
});

test('invalid and blank inputs reject instead of yielding plausible stale results', async () => {
  for (const id of Object.keys(demos)) await assert.rejects(runDemo(id, '   '));
  for (const value of ['oops', '-1', '1.5', '9007199254740992']) await assert.rejects(runDemo('land', value));
  await assert.rejects(runDemo('date', '2082-99-07'));
  await assert.rejects(runDemo('admin', 'unknown'));
  await assert.rejects(runDemo('number', 'not a number'));
  assert.equal((await runDemo('phone', '123')).output, 'false');
});

test('snippets preserve inputs and describe actual return types', async () => {
  const number = await runDemo('number', '9007199254740993.50');
  assert.ok(number.snippet.includes('"9007199254740993.50"'));
  assert.ok((await runDemo('phone', '123')).snippet.endsWith('// → false'));
  assert.match((await runDemo('collation', 'राम\nकिरण')).snippet, /\/\/ → \[/);
  assert.match((await runDemo('date', demos.date.sample)).snippet, /\/\/ → \{/);
});

test('canonical helper adds a Pages base exactly once, even with prefixed site config', () => {
  for (const site of ['https://kbohara315.github.io', 'https://kbohara315.github.io/nepali-toolkit/']) {
    assert.equal(siteUrl('/nepali-toolkit/playground/', site, '/nepali-toolkit/'), 'https://kbohara315.github.io/nepali-toolkit/playground/');
    assert.equal(siteUrl('social/switchboard.png', site, '/nepali-toolkit/'), 'https://kbohara315.github.io/nepali-toolkit/social/switchboard.png');
  }
  assert.equal(siteUrl('/', 'https://kbohara315.github.io', '/'), 'https://kbohara315.github.io/');
});
