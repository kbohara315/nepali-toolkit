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
const menuGlyph = (selector, open) => {
  assert.deepEqual(evaluate(`Array.from(document.querySelectorAll('${selector} svg')).filter(s => getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().width > 0).map(s => ({ glyph: s.classList.contains('open-menu') ? 'open-menu' : 'close-menu', path: s.querySelector('path').getAttribute('d') }))`),
    [{ glyph: open ? 'close-menu' : 'open-menu', path: open ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16' }], `${selector}: exactly one ${open ? 'X' : 'bars'} glyph`);
};
const menuSurface = selector => evaluate(`(() => { const s = getComputedStyle(document.querySelector('${selector}')); return [s.backgroundColor, s.borderColor, s.color, s.borderRadius]; })()`);
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
      assert.ok(evaluate(`(() => {
        const nav = document.querySelector('.site-header nav');
        const menu = document.querySelector('.menu-toggle');
        const brand = document.querySelector('.brand').getBoundingClientRect();
        const toggle = document.querySelector('.theme-toggle').getBoundingClientRect();
        return innerWidth <= 760
          ? nav.hidden && menu.getAttribute('aria-expanded') === 'false' && Math.abs(brand.top + brand.height / 2 - toggle.top - toggle.height / 2) < 1
          : !nav.hidden && getComputedStyle(menu).display === 'none';
      })()`), `${theme} ${width}px header alignment/visibility`);
    }
    cli('open', new URL('docs/reference/number/', url).href);
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
    assert.ok(evaluate("document.querySelector('h1').textContent").includes('Number'));
    cli('open', url); ready();
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
  }
  cli('open', new URL('playground/', url).href);
  assert.ok(evaluate("document.querySelectorAll('#playground-mode option').length") >= 10);
  for (const path of ['', 'playground/']) {
    for (const width of [320, 390, 430]) {
      const label = `${path || '/'} ${width}px`;
      cli('set', 'viewport', String(width), '1000');
      cli('open', new URL(path, url).href);
      cli('wait', '--fn', "document.querySelector('.site-header').classList.contains('is-enhanced')");
      assert.ok(evaluate(`(() => {
        const header = document.querySelector('.site-header');
        const menu = header.querySelector('.menu-toggle');
        const brand = header.querySelector('.brand').getBoundingClientRect();
        const theme = header.querySelector('.theme-toggle').getBoundingClientRect();
        const button = menu.getBoundingClientRect();
        return menu.getAttribute('aria-expanded') === 'false'
          && document.getElementById(menu.getAttribute('aria-controls')).hidden
          && button.width > 0 && brand.right <= theme.left && theme.right <= button.left
          && Math.abs(theme.top - button.top) < 1
          && Math.abs(brand.top + brand.height / 2 - theme.top - theme.height / 2) < 1
          && header.getBoundingClientRect().height < 80;
      })()`), `${label} defaults to one closed row`);
      menuGlyph('.menu-toggle', false);
      cli('focus', '.theme-toggle');
      cli('press', 'Shift+Tab');
      assert.ok(evaluate("document.activeElement.matches('.brand')"), `${label} closed links are skipped by Tab`);
      cli('click', '.menu-toggle');
      assert.equal(evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), 'true');
      menuGlyph('.menu-toggle', true);
      assert.deepEqual(evaluate("Array.from(document.querySelectorAll('#primary-navigation a'), a => a.textContent.trim())"), ['Documentation', 'Playground', 'GitHub ↗']);
      assert.ok(evaluate(`(() => {
        const nav = document.querySelector('#primary-navigation');
        const theme = document.querySelector('.theme-toggle').getBoundingClientRect();
        return !nav.hidden && nav.getBoundingClientRect().top >= theme.bottom
          && Array.from(nav.querySelectorAll('a')).every(a => a.getBoundingClientRect().height >= 44)
          && Math.abs(nav.getBoundingClientRect().width - document.querySelector('.site-header').clientWidth + 24) < 1;
      })()`), `${label} opens full-width accessible links`);
      cli('focus', '#primary-navigation a');
      assert.ok(evaluate("document.activeElement.matches('#primary-navigation a')"));
      cli('press', 'Escape');
      assert.ok(evaluate("document.querySelector('#primary-navigation').hidden && document.activeElement.matches('.menu-toggle')"), `${label} Escape closes and restores focus`);
      menuGlyph('.menu-toggle', false);
      const theme = evaluate('document.documentElement.dataset.theme');
      cli('click', '[data-theme-toggle]');
      assert.notEqual(evaluate('document.documentElement.dataset.theme'), theme, `${label} theme toggle works`);
      cli('click', '.menu-toggle');
      // Prevent navigation only; exercise the real link click and menu close handler.
      evaluate("document.querySelector('#primary-navigation').addEventListener('click', e => e.preventDefault(), { once: true }); true");
      cli('click', '#primary-navigation a');
      assert.ok(evaluate("document.querySelector('#primary-navigation').hidden && document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false'"), `${label} selecting a link closes`);
      assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${label} closed overflow`);
      cli('click', '.menu-toggle');
      assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${label} open overflow`);
      cli('set', 'viewport', '1440', '1000');
      cli('wait', '--fn', "document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false'");
      assert.ok(evaluate("!document.querySelector('#primary-navigation').hidden && getComputedStyle(document.querySelector('.menu-toggle')).display === 'none' && Array.from(document.querySelectorAll('#primary-navigation a')).every(a => a.getBoundingClientRect().width > 0)"), `${label} desktop resize resets and shows links`);
      assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${label} desktop overflow`);
      cli('set', 'viewport', String(width), '1000');
      cli('wait', '--fn', "document.querySelector('#primary-navigation').hidden");
    }
  }
  // Cross-route shell contract, measured in the browser rather than source CSS.
  const brandStyle = () => evaluate(`(() => {
    const brand = document.querySelector('header .brand');
    const icon = brand.querySelector('.brand-icon');
    const style = getComputedStyle(brand), mark = getComputedStyle(icon);
    return { href: brand.href, name: brand.querySelector('.brand-name').textContent.trim(),
      icon: icon.textContent.trim(), hidden: icon.getAttribute('aria-hidden'),
      font: style.font, spacing: style.letterSpacing, gap: style.gap,
      mark: [mark.width, mark.height, mark.border, mark.color, mark.backgroundColor] };
  })()`);
  for (const width of [320, 390, 430, 768, 799, 800, 1440]) {
    cli('set', 'viewport', String(width), '1000');
    for (const theme of ['light', 'dark']) {
      cli('open', url);
      cli('wait', '--fn', "document.querySelector('.site-header').classList.contains('is-enhanced')");
      if (evaluate('document.documentElement.dataset.theme') !== theme) cli('click', '[data-theme-toggle]');
      const marketingBrand = brandStyle();
      assert.equal(marketingBrand.href, new URL(url).href);
      assert.equal(marketingBrand.name, 'Nepali Toolkit');
      assert.equal(marketingBrand.icon, 'ने');
      assert.equal(marketingBrand.hidden, 'true');
      assert.ok(evaluate(`(() => {
        const name = document.querySelector('header .brand-name');
        const s = getComputedStyle(name), words = name.children;
        // A flex-item's inline-flex display is blockified to flex by the browser.
        return ['inline-flex', 'flex'].includes(s.display) && s.alignItems === 'baseline'
          && Math.abs(parseFloat(s.gap) - parseFloat(s.fontSize) * 0.3) < 0.01
          && Math.abs(words[1].getBoundingClientRect().left - words[0].getBoundingClientRect().right - parseFloat(s.gap)) < 0.02
          && getComputedStyle(words[0]).fontWeight === '650' && getComputedStyle(words[1]).fontWeight === '400';
      })()`), 'wordmark has explicit spacing and retains both weights');
      let marketingOpenSurface;
      if (width <= 760) {
        cli('click', '.menu-toggle');
        menuGlyph('.menu-toggle', true);
        marketingOpenSurface = menuSurface('.menu-toggle');
        cli('press', 'Escape');
        menuGlyph('.menu-toggle', false);
      }
      assert.deepEqual(evaluate(`Array.from(document.querySelectorAll('.brand'), b => ({href: b.href, name: b.querySelector('.brand-name').textContent.trim()}))`),
        [{ href: new URL(url).href, name: 'Nepali Toolkit' }, { href: new URL(url).href, name: 'Nepali Toolkit' }]);
      const marketingHeader = evaluate(`(() => { const r = document.querySelector('header').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`);
      for (const path of ['docs/', 'docs/reference/number/']) {
        if (evaluate('document.documentElement.dataset.theme') !== theme) cli('click', '[data-theme-toggle]');
        cli('open', new URL(path, url).href);
        cli('wait', '--fn', "!document.querySelector('button[data-open-modal]').disabled");
        assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
        assert.deepEqual(brandStyle(), marketingBrand, `${path} ${width}px ${theme}: identical brand`);
        assert.deepEqual(evaluate(`(() => { const r = document.querySelector('header').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`), marketingHeader, `${path}: same floating surface geometry`);
        assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${path} ${width}px ${theme}: overflow`);
        assert.ok(evaluate(`(() => { const h = document.querySelector('header'); return getComputedStyle(h).position === 'fixed' && parseFloat(getComputedStyle(document.querySelector('.main-frame')).paddingTop) >= h.getBoundingClientRect().bottom; })()`), 'fixed header preserves content offset');
        if (width < 800) {
          menuGlyph('.sl-menu-button', false);
          assert.ok(evaluate(`(() => {
            const brand = document.querySelector('header .brand').getBoundingClientRect();
            const search = document.querySelector('[data-open-modal]').getBoundingClientRect();
            const menu = document.querySelector('.sl-menu-button').getBoundingClientRect();
            return search.width >= 42 && search.height >= 42 && menu.width === search.width && menu.height === search.height
              && brand.right <= search.left && search.right <= menu.left && Math.abs(search.top - menu.top) < 1
              && getComputedStyle(document.querySelector('.sl-menu-button svg')).strokeWidth === '1.8px';
          })()`), 'mobile brand/search/menu fit with consistent hit targets');
          cli('click', '.sl-menu-button');
          cli('wait', '--fn', "document.querySelector('#starlight__sidebar').matches(':popover-open')");
          menuGlyph('.sl-menu-button', true);
          if (marketingOpenSurface) assert.deepEqual(menuSurface('.sl-menu-button'), marketingOpenSurface, 'same open-menu surface across routes');
          assert.ok(evaluate("document.querySelector('.main-frame').inert && document.querySelector('#starlight__sidebar starlight-theme-select select').getBoundingClientRect().width > 0"), 'native sidebar focus trap and theme control remain available');
          assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), 'open docs sidebar does not overflow');
          cli('press', 'Escape');
          cli('wait', '--fn', "!document.querySelector('#starlight__sidebar').matches(':popover-open') && !document.querySelector('.main-frame').inert");
          menuGlyph('.sl-menu-button', false);
        } else {
          assert.ok(evaluate("getComputedStyle(document.querySelector('.sl-menu-button')).display === 'none' && document.querySelector('.sl-menu-button').getBoundingClientRect().width === 0"), 'docs menu hidden at the native 800px desktop breakpoint');
        }
        cli('click', 'button[data-open-modal]');
        cli('wait', '--fn', "document.querySelector('site-search dialog').open && document.querySelector('.pagefind-ui__search-input')");
        cli('fill', '.pagefind-ui__search-input', 'currency');
        cli('wait', '--fn', "document.querySelectorAll('.pagefind-ui__result-link').length > 0");
        cli('press', 'Escape');
        assert.equal(evaluate("document.querySelector('site-search dialog').open"), false);
        // Native docs selector must persist preferences back to both marketing routes.
        if (width < 800) cli('click', '.sl-menu-button');
        cli('select', width < 800 ? '#starlight__sidebar starlight-theme-select select' : 'header starlight-theme-select select', theme === 'light' ? 'dark' : 'light');
        cli('open', new URL('playground/', url).href);
        assert.equal(evaluate('document.documentElement.dataset.theme'), theme === 'light' ? 'dark' : 'light');
        cli('open', url);
        assert.equal(evaluate('document.documentElement.dataset.theme'), theme === 'light' ? 'dark' : 'light');
      }
    }
  }
  console.log('PASS: demo regressions and marketing menus; explicit wordmark spacing/weights, shared bars/X glyphs and open surfaces, native docs search/sidebar/theme, cross-route persistence and overflow at 320/390/430/768/799/800/1440px in light/dark.');
} finally { cli('close'); }
