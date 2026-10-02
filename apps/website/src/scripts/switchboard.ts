import { demos, runDemo, type DemoId } from '../lib/demo-calls';
import { highlightCode } from '../lib/highlight-code';
import { domains } from '../data/domains';

const board = document.querySelector<HTMLElement>('[data-switchboard]');
if (board) {
  const element = <T extends HTMLElement>(id: string) => board.querySelector<T>(`#board-${id}`)!;
  const input = element<HTMLTextAreaElement>('input');
  const province = element<HTMLSelectElement>('province');
  const copy = element<HTMLButtonElement>('copy');
  const output = element<HTMLOutputElement>('output');
  const snippet = element('snippet');
  const status = element('status');
  const copyStatus = element('copy-status');
  const memory = new Map<DemoId, string>();
  let selected: DemoId = 'number';
  let request = 0;
  const base = import.meta.env.BASE_URL;

  async function evaluate() {
    const id = ++request;
    const domain = selected;
    const value = domain === 'admin' ? province.value : input.value;
    memory.set(domain, value);
    copy.disabled = true;
    copy.textContent = 'Copy snippet';
    copyStatus.textContent = '';
     snippet.textContent = '';
    output.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    province.setAttribute('aria-invalid', 'false');
    board!.querySelector('.board-readout')!.setAttribute('data-state', 'loading');
    status.textContent = value.trim() ? 'Loading selected utility…' : 'Enter an input to see a result.';
    try {
      const result = await runDemo(domain, value);
      if (id !== request) return;
      output.textContent = result.output || 'No matching results.';
       snippet.innerHTML = highlightCode(result.snippet);
      status.textContent = result.output ? 'Result ready.' : 'No matching results.';
      board!.querySelector('.board-readout')!.setAttribute('data-state', 'success');
      copy.disabled = false;
    } catch (error) {
      if (id !== request) return;
      status.textContent = error instanceof Error ? error.message : 'Utility could not load. Try selecting this domain again.';
      (domain === 'admin' ? province : input).setAttribute('aria-invalid', String(Boolean(value.trim())));
      board!.querySelector('.board-readout')!.setAttribute('data-state', value.trim() ? 'invalid' : 'empty');
    }
  }

  board.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      selected = radio.value as DemoId;
      const demo = demos[selected];
      const domain = domains.find(item => item.id === selected)!;
      element('title').textContent = demo.title;
      element('purpose').textContent = domain.description;
      element('input-label').textContent = demo.label;
      element('input-label').setAttribute('for', selected === 'admin' ? 'board-province' : 'board-input');
      element('hint').textContent = demo.hint;
      element('unit').textContent = selected === 'land' ? '/ m²' : '';
      input.hidden = selected === 'admin';
      province.hidden = selected !== 'admin';
      input.rows = selected === 'collation' ? 3 : 1;
      input.inputMode = ['number', 'currency', 'land', 'words'].includes(selected) ? 'decimal' : 'text';
      input.value = memory.get(selected) ?? demo.sample;
      if (selected === 'admin') province.value = memory.get(selected) ?? demo.sample;
      const docs = element<HTMLAnchorElement>('docs');
      docs.href = `${base}${domain.docs.slice(1)}`;
      docs.textContent = `Read ${domain.label.toLowerCase()} docs →`;
      void evaluate();
    });
  });
  input.addEventListener('input', () => void evaluate());
  province.addEventListener('change', () => void evaluate());
  copy.addEventListener('click', async () => {
    const version = request;
    const text = snippet.textContent;
    if (!text || copy.disabled) return;
    try {
      await navigator.clipboard.writeText(text);
      if (version !== request) return;
      copy.textContent = 'Copied';
      copyStatus.textContent = 'Snippet copied.';
    } catch {
      if (version !== request) return;
      copyStatus.textContent = 'Copy unavailable. Select the snippet to copy it manually.';
    }
  });
  board.querySelector<HTMLFieldSetElement>('fieldset')!.disabled = false;
  input.disabled = false;
  province.disabled = false;
  board.classList.add('is-enhanced');
  void evaluate();
}
