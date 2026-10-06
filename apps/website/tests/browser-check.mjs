/** Real Chromium regression checks via agent-browser. Start `astro preview` first. */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getNepaliTextStats } from 'nepali-toolkit/collation';
import { numberToNepaliWords } from 'nepali-toolkit/words';
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
const playgroundReady = () => cli('wait', '--fn', "document.querySelector('#playground-result').getAttribute('aria-busy') !== 'true'");
const select = id => { cli('find', 'role', 'radio', 'check', '--name', ({ number: 'Numbers', date: 'Dates', currency: 'Currency', land: 'Land', words: 'Words', collation: 'Sorting', phone: 'Phone', admin: 'Admin' })[id], '--exact'); ready(); };
const menuGlyph = (selector, open) => {
  assert.deepEqual(evaluate(`Array.from(document.querySelectorAll('${selector} svg')).filter(s => getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().width > 0).map(s => ({ glyph: s.classList.contains('open-menu') ? 'open-menu' : 'close-menu', path: s.querySelector('path').getAttribute('d') }))`),
    [{ glyph: open ? 'close-menu' : 'open-menu', path: open ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16' }], `${selector}: exactly one ${open ? 'X' : 'bars'} glyph`);
};
const menuSurface = selector => evaluate(`(() => { const s = getComputedStyle(document.querySelector('${selector}')); return [s.backgroundColor, s.borderColor, s.color, s.borderRadius]; })()`);
async function executeSnippet(source, label, appendedExports) {
  const file = new URL(`.generated-playground-${process.pid}-${label}.mjs`, import.meta.url);
  try {
    await writeFile(file, `${source}\n${appendedExports}\n`);
    return await import(`${file.href}?run=${Date.now()}`);
  } finally {
    await rm(file, { force: true });
  }
}
async function startAdminDelayProxy(upstreamUrl) {
  const script = fileURLToPath(new URL('./admin-delay-proxy.mjs', import.meta.url));
  const child = spawn(process.execPath, [script, upstreamUrl], { stdio: ['ignore', 'pipe', 'inherit'] });
  child.stdout.setEncoding('utf8');
  const port = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      const newline = output.indexOf('\n');
      if (newline !== -1) {
        try {
          resolve(JSON.parse(output.slice(0, newline)).port);
        } catch (error) {
          reject(error);
        }
      }
    });
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Admin delay proxy exited before listening (${code}).`)));
  });
  return { child, origin: `http://127.0.0.1:${port}` };
}
async function waitForProxyStatus(origin, predicate) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${origin}/__test_status`);
    const status = await response.json();
    if (predicate(status)) return status;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for the delayed admin chunk request.');
}
let delayProxy;
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
    assert.ok(evaluate("document.querySelector('h1').textContent").toLocaleLowerCase().includes('number'));
    cli('open', url); ready();
    assert.equal(evaluate('document.documentElement.dataset.theme'), theme);
  }
  cli('open', new URL('playground/', url).href);
  assert.ok(evaluate("document.querySelectorAll('#playground-mode option').length") >= 10);
  assert.ok(evaluate("document.querySelectorAll('.playground-nav-item').length >= 10"), 'grouped utility navigation is rendered');
  assert.equal(evaluate("document.querySelectorAll('.playground-nav-item[aria-current=true]').length"), 1, 'one task is active');
  assert.ok(evaluate("document.querySelector('#playground-search').disabled === false"), 'search is enabled after enhancement');
  assert.equal(evaluate("document.querySelector('#playground-task-title').textContent"), 'Format number', 'workspace starts with the selected task title');
  const playgroundOwnership = evaluate(`(() => {
    const sidebar = document.querySelector('[data-utility-sidebar]');
    const workspace = document.querySelector('[data-playground-workspace]');
    const taskControlIds = ['playground-options', 'playground-input-label', 'playground-input', 'playground-hint', 'playground-examples', 'playground-status', 'playground-reset'];
    return {
      sidebarChildren: Array.from(sidebar.children, element => element.tagName.toLowerCase()),
      allTaskControlsInWorkspace: taskControlIds.every(id => workspace.contains(document.getElementById(id))),
      noTaskControlsInSidebar: taskControlIds.every(id => !sidebar.contains(document.getElementById(id))),
      visiblePageHeadings: Array.from(document.querySelectorAll('h1')).filter(heading => !heading.classList.contains('sr-only')).length,
    };
  })()`);
  assert.deepEqual(playgroundOwnership.sidebarChildren, ['label','input','nav','label','select'], 'sidebar only has utility search, nav, and the hidden synced selector');
  assert.ok(playgroundOwnership.allTaskControlsInWorkspace && playgroundOwnership.noTaskControlsInSidebar, 'task form controls belong to the workspace');
  assert.equal(playgroundOwnership.visiblePageHeadings, 0, 'no global visible Playground heading is added');
  cli('fill', '#playground-search', 'phone');
  assert.equal(evaluate("Array.from(document.querySelectorAll('.playground-nav-item:not([hidden])'),e=>e.dataset.tool).join(',')"), 'phone', 'search filters grouped navigation');
  cli('fill', '#playground-search', '');
  cli('click', '.playground-nav-item[data-tool="date-bs-to-ad"]'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-task-title').textContent"), 'Convert BS to AD', 'task heading changes with the selected utility');
  assert.ok(evaluate("document.querySelector('#playground-task-description').textContent.includes('Bikram Sambat')"), 'task description follows the active utility');
  assert.deepEqual(evaluate("['#playground-year','#playground-month','#playground-day'].map(s=>!!document.querySelector(s))"), [true,true,true], 'date task uses separate year/month/day controls');
  cli('fill', '#playground-year', '2082'); cli('fill', '#playground-month', '4'); cli('fill', '#playground-day', '7'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '2025-07-23', 'BS date fields invoke real conversion');
  assert.equal(evaluate("new URL(location.href).searchParams.get('tool')"), 'date-bs-to-ad', 'selected task is shareable');
  cli('select', '#playground-date-task', 'add'); cli('fill', '#playground-date-days', '1'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-task-title').textContent"), 'Add days', 'task heading follows the selected date action');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '2082-04-08', 'BS date arithmetic calls addDaysBS');
  assert.ok(evaluate("document.querySelector('#playground-snippet').textContent.includes('addDaysBS')"));
  cli('select', '#playground-date-task', 'difference'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '0', 'date difference uses the selected comparison fields');
  cli('select', '#playground-date-task', 'fiscal'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-snippet').textContent.includes('getFiscalYear')"), 'BS task offers fiscal-year lookup');
  cli('select', '#playground-date-task', 'parse-format'); playgroundReady();
  const bsParseSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(bsParseSnippet.includes('formatBS(parseBS("2082-04-07"), \'YYYY-MM-DD\')'), 'BS parse/format snippet pads month and day for the default parser format');
  const bsSnippetModule = await executeSnippet(bsParseSnippet, 'bs-date', `export const snippetResult = formatBS(parseBS("2082-04-07"), 'YYYY-MM-DD');`);
  assert.equal(bsSnippetModule.snippetResult, '2082-04-07', 'emitted BS parse/format module executes against package exports');
  cli('click', '#playground-reset'); playgroundReady();
  assert.deepEqual(evaluate("['#playground-year','#playground-month','#playground-day'].map(selector=>document.querySelector(selector).value)"), ['2082','04','07'], 'BS reset restores its own visible sample date');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '2025-07-23', 'BS reset output matches restored fields');
  cli('click', '.playground-nav-item[data-tool="date-ad-to-bs"]'); playgroundReady();
  cli('select', '#playground-date-task', 'parse-format'); playgroundReady();
  const adParseSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(adParseSnippet.includes('formatAD(parseAD("2025-07-23"), \'YYYY-MM-DD\')'), 'AD parse/format snippet uses a padded parser input');
  const adSnippetModule = await executeSnippet(adParseSnippet, 'ad-date', `export const snippetResult = formatAD(parseAD("2025-07-23"), 'YYYY-MM-DD');`);
  assert.equal(adSnippetModule.snippetResult, '2025-07-23', 'emitted AD parse/format module executes against package exports');
  cli('click', '#playground-reset'); playgroundReady();
  assert.deepEqual(evaluate("['#playground-year','#playground-month','#playground-day'].map(selector=>document.querySelector(selector).value)"), ['2025','07','23'], 'AD reset updates every visible calendar field');
  assert.equal(evaluate("document.querySelector('#playground-date-task').value"), 'convert', 'date reset restores the default operation');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '2082-04-07', 'AD reset result matches the restored fields');
  evaluate("document.querySelector('.playground-nav-item[data-tool=number]').click(); true"); cli('wait', '--fn', "document.querySelector('#playground-number-grouping')"); playgroundReady();
  cli('select', '#playground-number-grouping', 'western'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '12,345,678', 'number options drive real formatter');
  cli('select', '#playground-number-operation', 'parse'); cli('fill', '#playground-input', '+००१२,३४५.५०'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '12345.50', 'number parse is exact decimal text');
  assert.ok(evaluate("document.querySelector('#playground-view-toggle').hidden"), 'string-returning APIs remain simple text results');
  cli('click', '.playground-nav-item[data-tool="currency"]'); cli('wait', '--fn', "document.querySelector('#playground-currency-placement')"); playgroundReady();
  evaluate("document.querySelector('.playground-nav-item[data-tool=number]').click(); true"); cli('wait', '--fn', "document.querySelector('#playground-number-operation')"); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-number-operation').value"), 'parse', 'number operation survives task switching');
  assert.equal(evaluate("document.querySelector('#playground-input').value"), '+००१२,३४५.५०', 'number input survives task switching');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '12345.50', 'restored number state reruns the matching API operation');
  cli('click', '#playground-reset'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-input').value"), '12345678', 'number reset restores the visible sample');
  assert.equal(evaluate("document.querySelector('#playground-number-operation').value"), 'format', 'number reset restores formatting task');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), '1,23,45,678', 'number reset result matches its sample controls');
  cli('click', '.playground-nav-item[data-tool="currency"]'); cli('wait', '--fn', "document.querySelector('#playground-currency-placement')"); playgroundReady();
  cli('select', '#playground-currency-placement', 'after'); cli('select', '#playground-currency-digits', 'ascii'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-value').textContent.endsWith(' रु')"), 'currency options match supported formatter values');
  const currencyResult = evaluate("document.querySelector('#playground-value').textContent");
  const currencySnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(currencySnippet.includes('{"placement":"after","numerals":"ascii","symbol":"रु"}'), 'currency snippet records the selected formatter options');
  const currencyModule = await executeSnippet(currencySnippet, 'currency', 'export const snippetAmount = amount;');
  assert.equal(currencyModule.snippetAmount, currencyResult, 'currency snippet executes with the visible formatter options');
  cli('click', '.playground-nav-item[data-tool="words"]'); cli('wait', '--fn', "document.querySelector('#playground-words-task')"); playgroundReady();
  cli('click', '.playground-nav-item[data-tool="currency"]'); cli('wait', '--fn', "document.querySelector('#playground-currency-placement')"); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-currency-placement').value"), 'after', 'currency placement survives task switching');
  assert.equal(evaluate("document.querySelector('#playground-currency-digits').value"), 'ascii', 'currency numeral option survives task switching');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), currencyResult, 'restored currency options reproduce the matching result');
  cli('click', '#playground-reset'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-currency-placement').value"), 'before', 'currency reset restores symbol placement');
  assert.equal(evaluate("document.querySelector('#playground-currency-digits').value"), 'devanagari', 'currency reset restores numeral style');
  assert.ok(evaluate("document.querySelector('#playground-value').textContent.startsWith('रु १,२३,४५६.५०')"), 'currency reset result reflects its controls');
  cli('click', '.playground-nav-item[data-tool="words"]'); cli('wait', '--fn', "document.querySelector('#playground-words-task')"); playgroundReady();
  cli('select', '#playground-words-task', 'english'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-value').textContent.startsWith('two thousand')"), 'English words task calls exported API');
  cli('select', '#playground-words-task', 'npr'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-value').textContent.includes('रुपैयाँ')"), 'NPR words task calls exported API');
  cli('click', '#playground-reset'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-words-task').value"), 'nepali', 'words reset restores Nepali operation');
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), numberToNepaliWords('2082'), 'words reset result matches the sample and selected operation');
  cli('click', '.playground-nav-item[data-tool="land"]'); playgroundReady();
  cli('wait', '--fn', "document.querySelectorAll('[data-land-unit]').length === 7");
  assert.equal(evaluate("document.querySelectorAll('[data-land-unit]').length"), 7, 'both actual land systems expose all seven units');
  assert.ok(evaluate("document.querySelector('#playground-json').textContent.includes('squareMetres')"), 'land output is structured JSON');
  cli('select', '#playground-land-system', 'terai'); playgroundReady();
  evaluate("(() => {const field=document.querySelector('[data-land-unit=bigha]');field.value='1';field.dispatchEvent(new Event('input',{bubbles:true}));return true})()"); playgroundReady();
  assert.ok(evaluate("JSON.parse(document.querySelector('#playground-json').textContent).input.bigha === 1"), 'land output follows the edited visible Terai field');
  assert.ok(evaluate("document.querySelector('#playground-snippet').textContent.includes('teraiArea')"), 'Terai choice calls the Terai API and snippet');
  const teraiSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  const teraiResult = JSON.parse(evaluate("document.querySelector('#playground-json').textContent"));
  const teraiModule = await executeSnippet(teraiSnippet, 'terai-area', 'export const snippetArea = { squareMetres: toSquareMetres(area), squareFeet: toSquareFeet(area) };');
  assert.deepEqual(teraiModule.snippetArea, { squareMetres: teraiResult.squareMetres, squareFeet: teraiResult.squareFeet }, 'Terai snippet is executable and matches the displayed conversion');
  cli('click', '.playground-nav-item[data-tool="number"]'); playgroundReady();
  cli('click', '.playground-nav-item[data-tool="land"]'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-land-system').value"), 'terai', 'land system survives switching tasks');
  assert.equal(evaluate("document.querySelector('[data-land-unit=bigha]').value"), '1', 'land unit value survives switching tasks');
  cli('click', '#playground-reset'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-land-system').value"), 'hill', 'land reset restores Hill system');
  assert.equal(evaluate("document.querySelector('[data-land-unit=ropani]').value"), '2', 'land reset restores the sample ropani value');
  assert.equal(JSON.parse(evaluate("document.querySelector('#playground-json').textContent")).input.ropani, 2, 'land reset result matches visible fields');
  cli('click', '.playground-nav-item[data-tool="admin"]'); playgroundReady();
  cli('wait', '--fn', "document.querySelectorAll('#playground-province option').length > 1");
  cli('select', '#playground-province', '3'); playgroundReady();
  assert.ok(evaluate("document.querySelectorAll('#playground-district option').length > 1"), 'districts cascade from selected province');
  const provinceSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(!provinceSnippet.includes('getPalikaWards') && !provinceSnippet.includes('getPostalCode'), 'province-only result avoids calling postal APIs without a palika');
  assert.ok(provinceSnippet.includes('const districts = getDistricts(provinceCode);'), 'province-only snippet provides its district list');
  const provinceModule = await executeSnippet(provinceSnippet, 'admin-province', 'export const selection = { provinceCode, province, districts };');
  assert.equal(provinceModule.selection.province.code, '3');
  assert.ok(provinceModule.selection.districts.length > 0, 'province-only generated snippet executes and returns districts');
  const districtCode = evaluate("document.querySelector('#playground-district option:nth-child(2)').value");
  cli('select', '#playground-district', districtCode); playgroundReady();
  cli('wait', '--fn', "document.querySelectorAll('#playground-palika option').length > 1");
  const districtSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(districtSnippet.includes('const palikas = getPalikas(districtCode);'), 'district selection provides its palika list');
  assert.ok(!districtSnippet.includes('getPalikaWards') && !districtSnippet.includes('getPostalCode'), 'district-only result avoids postal calls without a palika');
  const districtModule = await executeSnippet(districtSnippet, 'admin-district', 'export const selection = { provinceCode, districtCode, district, palikas };');
  assert.equal(districtModule.selection.district.code, districtCode);
  assert.ok(districtModule.selection.palikas.length > 0, 'district-level generated snippet executes and returns palikas');
  const palikaCode = evaluate("document.querySelector('#playground-palika option:nth-child(2)').value");
  cli('select', '#playground-palika', palikaCode); playgroundReady();
  cli('wait', '--fn', "document.querySelectorAll('#playground-ward option').length > 1");
  const palikaSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(palikaSnippet.includes('const postalCode = getPostalCode(palikaCode);'), 'palika without ward uses the supported five-digit code');
  assert.ok(!palikaSnippet.includes('getWardPostalCode'), 'palika-only snippet does not call ward postal lookup');
  const palikaModule = await executeSnippet(palikaSnippet, 'admin-palika', 'export const selection = { provinceCode, districtCode, palikaCode, palika, wards, postalCode };');
  assert.equal(palikaModule.selection.postalCode, palikaCode, 'palika postal code follows the GPO-derived five-digit scheme');
  cli('select', '#playground-ward', '1'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-options').textContent.includes('not legacy post-office')"), 'postal scheme is explicit');
  cli('click', '.playground-nav-item[data-tool="collation"]'); playgroundReady();
  cli('click', '.playground-nav-item[data-tool="admin"]'); playgroundReady();
  cli('wait', '--fn', "document.querySelectorAll('#playground-province option').length > 1");
  assert.equal(evaluate("document.querySelector('#playground-province').value"), '3', 'admin province survives switching tasks');
  assert.equal(evaluate("document.querySelector('#playground-district').value"), districtCode, 'admin district survives switching tasks');
  assert.equal(evaluate("document.querySelector('#playground-palika').value"), palikaCode, 'admin palika survives switching tasks');
  assert.equal(evaluate("document.querySelector('#playground-ward').value"), '1', 'admin ward survives switching tasks');
  const adminSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  for (const declaration of [
    'const provinceCode = "3";',
    `const districtCode = "${districtCode}";`,
    `const palikaCode = "${palikaCode}";`,
    'const province = getProvince(provinceCode);',
    'const district = getDistrict(districtCode);',
    'const palika = getPalika(palikaCode);',
    'const wards = getPalikaWards(palikaCode);',
    'const postalCode = getWardPostalCode(palikaCode, wardNo);',
  ]) assert.ok(adminSnippet.includes(declaration), `admin snippet missing runnable declaration: ${declaration}`);
  assert.ok(adminSnippet.startsWith("import { getProvince, getDistricts, getDistrict, getPalikas, getPalika, getPalikaWards, getWardPostalCode } from 'nepali-toolkit/admin';"), 'admin snippet imports each referenced hierarchy/postal API');
  const adminSnippetModule = await executeSnippet(adminSnippet, 'admin', 'export const snippetSelection = { provinceCode, districtCode, palikaCode, wardNo, postalCode };');
  assert.deepEqual(adminSnippetModule.snippetSelection, { provinceCode: '3', districtCode, palikaCode, wardNo: 1, postalCode: `${palikaCode}01` }, 'selected admin snippet runs with its selected hierarchy and GPO ward code');
  cli('click', '#playground-reset'); playgroundReady();
  assert.deepEqual(evaluate("['#playground-province','#playground-district','#playground-palika','#playground-ward'].map(selector=>document.querySelector(selector).value)"), ['','','',''], 'admin reset clears all visible hierarchy selections');
  assert.ok(evaluate("document.querySelector('#playground-list').textContent.includes('Koshi')"), 'admin reset reruns the sample query');
  cli('click', '.playground-nav-item[data-tool="collation"]'); playgroundReady();
  const setCollationText = value => evaluate(`(() => {const el=document.querySelector('#playground-collation-text');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  const statsText = 'नेपाल सरकार।\nकाठमाडौँ उपत्यका';
  setCollationText(statsText); playgroundReady();
  assert.deepEqual(JSON.parse(evaluate("document.querySelector('#playground-json').textContent")), getNepaliTextStats(statsText), 'statistics follow the current multiline textarea value');
  assert.ok(evaluate(`document.querySelector('#playground-snippet').textContent.includes(${JSON.stringify(JSON.stringify(statsText))})`), 'stats snippet contains the current textarea source');
  cli('select', '#playground-collation-task', 'sort');
  const sortText = ['राम','किरण','गीता'].join('\n');
  setCollationText(sortText); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), 'किरण\nगीता\nराम', 'sorting uses the toolkit collator');
  assert.ok(evaluate("document.querySelector('#playground-snippet').textContent.includes('createNepaliCollator().sort')"), 'snippet describes the exact sort call');
  const sortSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  const sortModule = await executeSnippet(sortSnippet, 'collation-sort', 'export { sorted as snippetSorted };');
  assert.deepEqual(sortModule.snippetSorted, ['किरण','गीता','राम'], 'multiline collation sort snippet executes on the current textarea value');
  cli('select', '#playground-collation-task', 'search');
  cli('wait', '--fn', "document.querySelector('#playground-collation-query')");
  const searchText = 'नेपाल सरकार\nकाठमाडौँ';
  setCollationText(searchText);
  cli('fill', '#playground-collation-query', 'नेपाल सरकार'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), 'true', 'search uses current multiline text and query');
  const searchSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  assert.ok(searchSnippet.includes('नेपाल सरकार'), 'search snippet contains current text and query');
  const searchModule = await executeSnippet(searchSnippet, 'collation-search', 'export const snippetMatch = nepaliIncludes("नेपाल सरकार\\nकाठमाडौँ", "नेपाल सरकार");');
  assert.equal(searchModule.snippetMatch, true, 'search snippet executes using the current text and query');
  setCollationText('पोखरा'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-value').textContent"), 'false', 'search reruns when the textarea changes after the query');
  cli('click', '#playground-reset'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-collation-task').value"), 'stats', 'collation reset restores the stats operation');
  assert.equal(evaluate("document.querySelector('#playground-collation-text').value"), 'नेपाल सरकार। ठीक छ।', 'collation reset updates the visible multiline field');
  assert.deepEqual(JSON.parse(evaluate("document.querySelector('#playground-json').textContent")), getNepaliTextStats('नेपाल सरकार। ठीक छ।'), 'collation reset output matches its sample text');
  cli('click', '.playground-nav-item[data-tool="phone"]'); playgroundReady();
  assert.ok(evaluate("document.querySelector('#playground-json').textContent.includes('allocated')"), 'phone result includes possible/valid/allocation distinctions');
  const phoneJson = evaluate("document.querySelector('#playground-json').textContent");
  cli('click', '[data-result-view="json"]');
  assert.ok(evaluate("!document.querySelector('#playground-json').hidden && document.querySelector('[data-result-view=json]').getAttribute('aria-pressed') === 'true'"), 'JSON view is accessible and selected');
  evaluate("Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async text=>{window.__pgCopied=text}} }); true");
  cli('click', '#playground-copy-json'); cli('wait', '--text', 'JSON copied');
  assert.equal(evaluate('window.__pgCopied'), phoneJson, 'copy JSON reads the raw normalized serialization');
  const phoneSnippet = evaluate("document.querySelector('#playground-snippet').textContent");
  cli('click', '#playground-copy-snippet'); cli('wait', '--text', 'Snippet copied');
  assert.equal(evaluate('window.__pgCopied'), phoneSnippet, 'snippet copying reads raw source, never highlighted HTML');
  assert.ok(evaluate("document.querySelector('#playground-docs-link').pathname.endsWith('/docs/reference/phone/')"), 'reference link resolves through current site base');
  cli('focus', '.playground-nav-item[data-tool="number"]'); cli('press', 'Enter'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-mode').value"), 'number', 'grouped task navigation is keyboard operable');
  cli('click', '.playground-nav-item[data-tool="phone"]'); playgroundReady();
  evaluate(`(() => {
    const numberUrl = new URL(location.href);
    numberUrl.searchParams.set('tool', 'number');
    history.pushState({ playgroundTool: 'number' }, '', numberUrl);
    const phoneUrl = new URL(numberUrl);
    phoneUrl.searchParams.set('tool', 'phone');
    history.pushState({ playgroundTool: 'phone' }, '', phoneUrl);
    history.back();
    return true;
  })()`);
  cli('wait', '--fn', "new URL(location.href).searchParams.get('tool') === 'number'"); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-mode').value"), 'number', 'popstate restores the selected utility control');
  assert.equal(evaluate("new URL(location.href).searchParams.get('tool')"), 'number', 'back/forward restores tool and URL state');

  delayProxy = await startAdminDelayProxy(url);
  cli('open', `${delayProxy.origin}${new URL('playground/', url).pathname}`);
  cli('wait', '--fn', "document.querySelector('#playground-search').disabled === false");
  playgroundReady();
  cli('click', '.playground-nav-item[data-tool="admin"]');
  const pendingAdmin = await waitForProxyStatus(delayProxy.origin, status => status.adminRequests > 0);
  assert.ok(pendingAdmin.adminRequests > pendingAdmin.adminResponses, 'admin module request is still pending before task switch');
  cli('click', '.playground-nav-item[data-tool="number"]'); playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-mode').value"), 'number', 'switching tasks supersedes the pending admin run');
  assert.equal(evaluate("new URL(location.href).searchParams.get('tool')"), 'number', 'pending admin run cannot replace the current URL');
  assert.equal(evaluate("document.querySelector('#playground-number-operation').value"), 'format', 'active number controls remain mounted during admin load');
  assert.equal(evaluate("document.querySelector('#playground-province')"), null, 'pending admin run has not injected hierarchy controls');
  await waitForProxyStatus(delayProxy.origin, status => status.adminResponses === status.adminRequests);
  cli('wait', '--fn', "performance.getEntriesByType('resource').some(entry => /\\/_astro\\/admin\\.[^/]+\\.js/.test(entry.name))");
  playgroundReady();
  assert.equal(evaluate("document.querySelector('#playground-mode').value"), 'number', 'late admin module resolution leaves the active task unchanged');
  assert.equal(evaluate("new URL(location.href).searchParams.get('tool')"), 'number', 'late admin resolution does not mutate the URL');
  assert.equal(evaluate("document.querySelector('#playground-province')"), null, 'late admin resolution does not inject stale controls');
  assert.ok(evaluate("document.querySelector('#playground-snippet').textContent.includes('formatNumber')"), 'number result and snippet remain current after late import');

  for (const path of ['', 'playground/']) {
    for (const width of [320, 390, 430]) {
      const label = `${path || '/'} ${width}px`;
      cli('set', 'viewport', String(width), '1000');
      cli('open', new URL(path, url).href);
      cli('wait', '--fn', "document.querySelector('.site-header').classList.contains('is-enhanced')");
      assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${label}: route has no horizontal overflow`);
      if (path === 'playground/') {
        assert.ok(evaluate(`(() => {
          const nav = document.querySelector('#playground-utilities');
          const buttons = Array.from(nav.querySelectorAll('.playground-nav-item'));
          return getComputedStyle(nav).overflowX === 'auto'
            && nav.scrollWidth > nav.clientWidth
            && buttons.length >= 10
            && buttons.every(button => button.getBoundingClientRect().height >= 32);
        })()`), `${label}: utility navigation is a usable horizontal strip`);
      }
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
      icon: icon.tagName, iconPath: new URL(icon.src).pathname, alt: icon.alt, hidden: icon.getAttribute('aria-hidden'),
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
       assert.equal(marketingBrand.icon, 'IMG');
       assert.ok(marketingBrand.iconPath.endsWith('/favicon.svg'));
       assert.equal(marketingBrand.alt, '');
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
} finally {
  cli('close');
  if (delayProxy) {
    delayProxy.child.kill('SIGTERM');
    await new Promise(resolve => delayProxy.child.once('exit', resolve));
  }
}
