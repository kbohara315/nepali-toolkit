/** Only the selected public entrypoint is requested. Failed imports can be retried. */
export type DemoId = 'date' | 'number' | 'currency' | 'land' | 'words' | 'collation' | 'phone' | 'admin';
export const demos = {
  date: { title: 'BS → AD date', label: 'Bikram Sambat date', sample: '2082-04-07', hint: 'YYYY-MM-DD within the documented BS conversion table.' },
  number: { title: 'Number grouping', label: 'Decimal text', sample: '12345678', hint: 'Decimal string. Large values stay out of floating-point arithmetic.' },
  currency: { title: 'NPR currency', label: 'Amount in rupees', sample: '123456.50', hint: 'Decimal string; default NPR formatting uses Devanagari digits.' },
  land: { title: 'Ropani → square metres', label: 'Whole ropani', sample: '2', hint: 'Non-negative whole ropani. Finer units are in the full playground and docs.' },
  words: { title: 'Nepali number words', label: 'Number as decimal text', sample: '123456', hint: 'Ungrouped decimal text, without exponent notation.' },
  collation: { title: 'Nepali name sorting', label: 'Names, one per line', sample: 'राम\nगीता\nकिरण', hint: 'Blank lines are ignored. Uses the deterministic basic backend.' },
  phone: { title: 'Possible phone shape', label: 'Raw phone input', sample: '9841234567', hint: 'Shape possibility only; this does not verify an active subscriber.' },
  admin: { title: 'Province → districts', label: 'Province', sample: '3', hint: 'Province identifiers are strings. Only province and district tables load.' },
} satisfies Record<DemoId, { title: string; label: string; sample: string; hint: string }>;

export type DemoResult = { output: string; snippet: string };
type Runner = (input: string) => DemoResult;
const quote = JSON.stringify;
function result(path: string, names: string, body: string, output: string, returned: unknown = output): DemoResult {
  return { output, snippet: `import { ${names} } from 'nepali-toolkit/${path}';\n\n${body}\n// → ${quote(returned)}` };
}
const loaders: Record<DemoId, () => Promise<Runner>> = {
  number: async () => {
    const { formatNumber } = await import('nepali-toolkit/number');
    return input => result('number', 'formatNumber', `const result = formatNumber(${quote(input)});`, formatNumber(input));
  },
  currency: async () => {
    const { formatNPR } = await import('nepali-toolkit/currency');
    return input => result('currency', 'formatNPR', `const result = formatNPR(${quote(input)});`, formatNPR(input));
  },
  words: async () => {
    const { numberToNepaliWords } = await import('nepali-toolkit/words');
    return input => result('words', 'numberToNepaliWords', `const result = numberToNepaliWords(${quote(input)});`, numberToNepaliWords(input));
  },
  date: async () => {
    const { bs, toAD } = await import('nepali-toolkit/date');
    return input => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new Error('Use a BS date in YYYY-MM-DD format.');
      const [year, month, day] = input.split('-').map(Number);
      const value = toAD(bs(year, month, day));
      return result('date', 'bs, toAD', `const result = toAD(bs(${year}, ${month}, ${day}));`, `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`, value);
    };
  },
  land: async () => {
    const { hillArea, toSquareMetres } = await import('nepali-toolkit/land');
    return input => {
      if (!/^\d+$/.test(input) || !Number.isSafeInteger(Number(input))) throw new Error('Enter a non-negative safe whole number of ropani.');
      const ropani = Number(input);
      const value = toSquareMetres(hillArea({ ropani }));
      return result('land', 'hillArea, toSquareMetres', `const result = toSquareMetres(hillArea({ ropani: ${ropani} }));`, value);
    };
  },
  collation: async () => {
    const { createNepaliCollator } = await import('nepali-toolkit/collation');
    return input => {
      const names = input.split('\n').map(name => name.trim()).filter(Boolean);
      const collator = createNepaliCollator({ backend: 'basic' });
      const body = `const collator = createNepaliCollator({ backend: 'basic' });\nconst result = ${quote(names)}.sort(collator.compare);`;
      const sorted = names.sort(collator.compare);
      return result('collation', 'createNepaliCollator', body, sorted.join('\n'), sorted);
    };
  },
  phone: async () => {
    const { isPossibleNepalPhone } = await import('nepali-toolkit/phone');
    return input => {
      const value = isPossibleNepalPhone(input);
      return result('phone', 'isPossibleNepalPhone', `const result = isPossibleNepalPhone(${quote(input)});`, String(value), value);
    };
  },
  admin: async () => {
    const [{ getProvince }, { getDistricts }] = await Promise.all([import('nepali-toolkit/admin/provinces'), import('nepali-toolkit/admin/districts')]);
    return input => {
      if (!getProvince(input)) throw new Error('Choose a known province.');
      const output = getDistricts(input).map(district => district.nameEn).join('\n');
      return { output, snippet: `import { getProvince } from 'nepali-toolkit/admin/provinces';\nimport { getDistricts } from 'nepali-toolkit/admin/districts';\n\nconst code = ${quote(input)};\nconst result = getProvince(code)\n  ? getDistricts(code).map(district => district.nameEn)\n  : [];\n// → ${quote(output.split('\n').filter(Boolean))}` };
    };
  },
};
const cache = new Map<DemoId, Promise<Runner>>();
export async function runDemo(id: DemoId, input: string): Promise<DemoResult> {
  if (!input.trim()) throw new Error('Enter an input to see a result.');
  let promise = cache.get(id);
  if (!promise) {
    promise = loaders[id]();
    cache.set(id, promise);
    promise.catch(() => cache.delete(id));
  }
  return (await promise)(input);
}
