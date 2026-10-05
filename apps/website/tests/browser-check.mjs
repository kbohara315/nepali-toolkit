/** Real Chromium regression checks via agent-browser. Start `astro preview` first. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const url = process.env.BROWSER_URL ?? 'http://localhost:4321/';
const session = execFileSync('agent-browser', ['session', 'id', '--scope', 'worktree', '--prefix', 'switchboard-check'], { encoding: 'utf8' }).trim();
const cli = (...args) => execFileSync('agent-browser', ['--session', session, ...args], { encoding: 'utf8', timeout: 40000 });
const evaluate = code => {
  const response = JSON.parse(cli('--json', 'eval', code));
  if (!response.success) throw new Error(JSON.stringify(response));
  return response.data.result;
};
const state = () => evaluate(`(() => ({ selected: document.querySelector('[name="toolkit-domain"]:checked').value, count: document.querySelectorAll('[name="toolkit-domain"]:checked').length, input: document.querySelector('#board-input').value, output: document.querySelector('#board-output').textContent, snippet: document.querySelector('#board-snippet').textContent, invalid: document.querySelector('#board-input').getAttribute('aria-invalid'), copyDisabled: document.querySelector('#board-copy').disabled }))()`);
const ready = () => cli('wait', '--fn', "document.querySelector('.board-readout').dataset.state !== 'loading'");
const select = id => { cli('find', 'role', 'radio', 'check', '--name', ({ number: 'Numbers', date: 'Dates', currency: 'Currency', land: 'Land', words: 'Words', collation: 'Sorting', phone: 'Phone', admin: 'Admin' })[id], '--exact'); ready(); };
try {
  cli('--args', '--no-sandbox', 'open', url);
  cli('wait', '--fn', "document.querySelector('[data-switchboard]').classList.contains('is-enhanced')");
  ready();
  assert.equal(state().output, '1,23,45,678');
  const loadingFrame = evaluate(`(() => { const radio = document.querySelector('[name="toolkit-domain"][value="phone"]'); radio.checked = true; radio.dispatchEvent(new Event('change')); return { state: document.querySelector('.board-readout').dataset.state, output: document.querySelector('#board-output').textContent, snippet: document.querySelector('#board-snippet').textContent }; })()`);
  assert.equal(loadingFrame.state, 'loading');
  assert.ok(loadingFrame.output, 'keep the previous result visible while the next utility loads');
  assert.ok(loadingFrame.snippet, 'keep the previous code block visible while the next utility loads');
  ready();
  select('number');
  const initial = evaluate("performance.getEntriesByType('resource').filter(e => e.name.endsWith('.js')).map(e => ({ url: e.name, bytes: e.decodedBodySize }))");
  assert.ok(!initial.some(entry => /districts|provinces|palikas|date\.|words\.|land\./.test(entry.url)));
  console.log('Initial JS:', JSON.stringify(initial));

  // Start every first-load import and edit in the same task, before any promise resolves.
  evaluate(`(() => { for (const value of ['date','words','admin','land','phone','number']) { const radio = document.querySelector('[name="toolkit-domain"][value="' + value + '"]'); radio.checked = true; radio.dispatchEvent(new Event('change')); } const input = document.querySelector('#board-input'); for (const value of ['123', 'invalid', '7654321']) { input.value = value; input.dispatchEvent(new Event('input')); } return true; })()`);
  ready();
  assert.equal(state().output, '76,54,321');
  assert.ok(state().snippet.includes('7654321'));
  assert.equal(state().selected, 'number');
  select('date'); assert.equal(state().output, '2025-07-23');
  select('number'); assert.equal(state().input, '7654321');
  cli('fill', '#board-input', 'oops'); ready();
  assert.equal(state().output, ''); assert.equal(state().snippet, ''); assert.equal(state().invalid, 'true'); assert.equal(state().copyDisabled, true);
  cli('fill', '#board-input', ''); ready(); assert.equal(state().invalid, 'false');
  cli('fill', '#board-input', '12345678'); ready();
  select('currency'); assert.equal(state().output, 'रु १,२३,४५६.५०');
  select('land'); assert.equal(state().output, '1017.44');
  cli('fill', '#board-input', '-2'); ready(); assert.equal(state().snippet, '');
  select('words'); assert.equal(state().output, 'एक लाख तेइस हजार चार सय छपन्न');
  select('collation'); assert.equal(state().output, 'किरण\nगीता\nराम');
  select('phone'); assert.equal(state().output, 'true');
  cli('fill', '#board-input', '123'); ready(); assert.equal(state().output, 'false');
  select('admin'); assert.ok(state().output.includes('Kathmandu'));
  cli('select', '#board-province', '1'); ready(); assert.ok(!state().output.includes('Kathmandu'));
  select('number');
  cli('focus', '[name="toolkit-domain"][value="number"]');
  cli('press', 'ArrowRight'); ready(); assert.equal(state().selected, 'currency'); assert.equal(state().count, 1);
  cli('press', 'Space'); assert.equal(state().count, 1);
  cli('press', 'Tab'); assert.equal(evaluate('document.activeElement.id'), 'board-input');

  evaluate("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('permission denied'); } } }); true");
  cli('click', '#board-copy');
  cli('wait', '--text', 'Copy unavailable. Select the snippet');
  assert.equal(evaluate("document.querySelector('#board-copy').textContent"), 'Copy snippet');
  evaluate("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } }); true");
  cli('click', '#board-copy'); cli('wait', '--text', 'Snippet copied.');
  assert.equal(evaluate('window.__copied'), state().snippet);
  cli('find', 'role', 'button', 'click', '--name', 'npm', '--exact');
  assert.equal(evaluate("document.querySelector('#install-command').textContent"), 'npm install nepali-toolkit');
  cli('click', '#copy-install'); cli('wait', '--text', 'Install command copied.');

  for (const theme of ['light', 'dark']) {
    const current = evaluate('document.documentElement.dataset.theme');
    if (current !== theme) cli('click', '[data-theme-toggle]');
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
    for (const width of [320, 375, 390, 414, 768, 1440]) {
      cli('set', 'viewport', String(width), '1000');
      assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${theme} ${width}px overflows`);
      assert.ok(evaluate("document.querySelector('.theme-toggle').getBoundingClientRect().top < document.querySelector('.site-header nav').getBoundingClientRect().top"), `${theme} ${width}px theme button dropped below navigation`);
    }
    cli('open', new URL('docs/reference/number/', url).href);
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
    assert.ok(evaluate("document.querySelector('h1').textContent").includes('Number'));
    cli('open', url); ready();
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
  }
  cli('open', new URL('playground/', url).href);
  assert.ok(evaluate("document.querySelectorAll('#playground-mode option').length") >= 10);
  console.log('PASS: eight demos, first-load selection/input races, memory, errors, keyboard, clipboard success/failure, themes across docs, 320/375/390/414/768/1440px, header alignment, preserved playground.');
} finally { cli('close'); }
