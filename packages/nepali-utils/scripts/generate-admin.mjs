// Generates src/admin/data/{provinces,districts,palikas}.ts from the
// checked-in official-source extracts in src/admin/data/raw/*.json.
//
//   pnpm generate:admin
//
// Every join is re-derived here and asserted; see PROVENANCE.md for the
// source vintages, canonical rules, and known inter-source variants.
// Dependency-free (node:fs only) so generation never needs the network.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(root, 'src', 'admin', 'data', 'raw');
const outDir = join(root, 'src', 'admin', 'data');

const read = (name) =>
  JSON.parse(readFileSync(join(rawDir, name), 'utf8'));

const fail = (message) => {
  throw new Error(`generate:admin: ${message}`);
};

// Canonical revision for this snapshot (see PROVENANCE.md).
const REVISION = 'gov-2026-09';

const nsoDistricts = read('nso-districts.json');
const nsoPalikas = read('nso-palikas.json');
const portalWards = read('portal-wards.json');
const portalDistricts = read('portal-districts.json');
const mofaga = read('mofaga.json');
const gpoPostal = read('gpo-postal.json');

if (nsoDistricts.length !== 77) fail(`districts: ${nsoDistricts.length}`);
if (nsoPalikas.length !== 753) fail(`palikas: ${nsoPalikas.length}`);
if (portalWards.length !== 753) fail(`ward rows: ${portalWards.length}`);
if (portalDistricts.length !== 77) fail(`portal districts: ${portalDistricts.length}`);
if (mofaga.length !== 753) fail(`mofaga rows: ${mofaga.length}`);

/** Mechanical whitespace normalization only (no spelling changes). */
const clean = (value) =>
  value.normalize('NFC').replace(/\s+/g, ' ').trim();

const norm = (value) => value.toLowerCase();

// --- district S.N. (portal value 1..77) === NSO row order; province cross-check
const snToCode = new Map();
nsoDistricts.forEach((d, index) => {
  if (d.sn !== index + 1) fail(`district S.N. order broken at ${d.en}`);
  snToCode.set(d.sn, d.code);
});
const codeSet = new Set(nsoDistricts.map((d) => d.code));
if (codeSet.size !== 77) fail('duplicate district codes');
for (const p of portalDistricts) {
  const code = snToCode.get(p.value);
  if (code === undefined) fail(`portal district value ${p.value} unknown`);
  if (Math.floor(code / 100) !== p.province) {
    fail(`province cross-check failed for ${p.label}`);
  }
}

// --- district NE <-> EN: per-district majority vote over shared exact
// palika NE names (palika names repeat across districts, e.g. Miklajung
// in Morang and Panchthar, so a global unique match is impossible).
const anchorVotes = new Map(); // nso district code -> Map(mofaga district NE -> votes)
const anchorByPalika = new Map(); // cleaned palika NE -> cleaned district NE -> votes
for (const row of mofaga) {
  const p = clean(row.palika);
  const d = clean(row.district);
  if (!anchorByPalika.has(p)) anchorByPalika.set(p, new Map());
  const votes = anchorByPalika.get(p);
  votes.set(d, (votes.get(d) ?? 0) + 1);
}
for (const p of nsoPalikas) {
  const votes = anchorByPalika.get(clean(p.ne));
  if (!votes) continue;
  const dcode = Math.floor(p.code / 100);
  if (!anchorVotes.has(dcode)) anchorVotes.set(dcode, new Map());
  const tally = anchorVotes.get(dcode);
  for (const [dne, n] of votes) tally.set(dne, (tally.get(dne) ?? 0) + n);
}
if (anchorVotes.size !== 77) fail(`anchor coverage ${anchorVotes.size}/77`);
const districtNe = new Map();
for (const [dcode, tally] of anchorVotes) {
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, [, n]) => sum + n, 0);
  if (ranked[0][1] <= total / 2) fail(`no anchor majority for ${dcode}`);
  districtNe.set(dcode, ranked[0][0]);
}

// --- province NE per district must be unanimous; numbers must be 1..7
const provByDistNe = new Map();
for (const row of mofaga) {
  const dne = clean(row.district);
  const pne = clean(row.province);
  if (!provByDistNe.has(dne)) provByDistNe.set(dne, new Set());
  provByDistNe.get(dne).add(pne);
}
const PROVINCE_EN = {
  'कोशी प्रदेश': 'Koshi Province',
  'मधेश प्रदेश': 'Madhesh Province',
  'बागमती प्रदेश': 'Bagmati Province',
  'गण्डकी प्रदेश': 'Gandaki Province',
  'लुम्बिनी प्रदेश': 'Lumbini Province',
  'कर्णाली प्रदेश': 'Karnali Province',
  'सुदूरपश्चिम प्रदेश': 'Sudurpashchim Province',
};
const districtToProvNe = new Map();
for (const d of nsoDistricts) {
  const dne = districtNe.get(d.code);
  const pnes = provByDistNe.get(dne);
  if (!pnes || pnes.size !== 1) fail(`province not unanimous for ${d.en}`);
  districtToProvNe.set(d.code, [...pnes][0]);
}
const provNums = new Map();
for (const d of nsoDistricts) {
  const pne = districtToProvNe.get(d.code);
  const num = Math.floor(d.code / 100);
  if (provNums.has(pne) && provNums.get(pne) !== num) {
    fail(`province split across numbers: ${pne}`);
  }
  provNums.set(pne, num);
  if (!(pne in PROVINCE_EN)) fail(`unknown province NE: ${pne}`);
}
if (provNums.size !== 7) fail(`provinces: ${provNums.size}`);

// --- ward join: positional within district (portal value order ===
// NSO row order); names compared on type-stripped stems for the audit log.
const TYPE_WORDS = [
  'rural municipality',
  'urban municipality',
  'metropolitan city',
  'sub-metropolitan city',
  'sub-metropolitian city',
  'metropolitian city',
  'gaunpalika',
  'municipality',
];
const stem = (name) => {
  let out = norm(name.normalize('NFC'));
  for (const t of TYPE_WORDS) out = out.split(t).join(' ');
  return out.replace(/[^a-z]/g, '');
};
const xlsByDist = new Map();
for (const p of nsoPalikas) {
  const dcode = Math.floor(p.code / 100);
  if (!xlsByDist.has(dcode)) xlsByDist.set(dcode, []);
  xlsByDist.get(dcode).push(p);
}
const portalByDist = new Map();
for (const [d, v, label, wards] of portalWards) {
  if (!portalByDist.has(d)) portalByDist.set(d, []);
  portalByDist.get(d).push({ v, label, wards });
}
const wardByCode = new Map();
const stemMismatches = [];
for (const d of nsoDistricts) {
  const xs = xlsByDist.get(d.code) ?? [];
  const ps = (portalByDist.get(d.sn) ?? []).sort((a, b) => a.v - b.v);
  if (xs.length !== ps.length) fail(`palika count ${d.en}: ${xs.length}/${ps.length}`);
  xs.forEach((x, i) => {
    if (stem(x.en) !== stem(ps[i].label)) {
      stemMismatches.push([d.code, ps[i].v, x.en, ps[i].label]);
    }
    wardByCode.set(x.code, ps[i].wards);
  });
}
if (wardByCode.size !== 753) fail('ward map incomplete');
const wardTotal = [...wardByCode.values()].reduce((a, b) => a + b, 0);
if (wardTotal !== 6743) fail(`ward total ${wardTotal}`);
console.log(`ward stem variants (positional join kept): ${stemMismatches.length}`);

// --- GPO postal table (S5) must agree exactly: same 753 codes, same ward
// counts, ward ranges shaped `{code5}{01} देखि {wards:02d}`. Postal codes
// are derived from these at runtime (no new tables); this check pins the
// derivation rule against the GPO publication on every regeneration.
if (gpoPostal.length !== 753) fail(`GPO rows: ${gpoPostal.length}`);
{
  const gpoCodes = new Set(gpoPostal.map((g) => g.code5));
  const nsoCodes = new Set(nsoPalikas.map((p) => String(p.code)));
  if (gpoCodes.size !== 753) fail('GPO postal codes not unique');
  for (const code of nsoCodes) {
    if (!gpoCodes.has(code)) fail(`GPO missing palika code ${code}`);
  }
  for (const g of gpoPostal) {
    const wards = wardByCode.get(Number(g.code5));
    if (wards === undefined) fail(`GPO unknown code ${g.code5}`);
    if (Number(g.wards) !== wards) {
      fail(`GPO ward count ${g.code5}: ${g.wards} vs ${wards}`);
    }
    const m = /^(\d{7}) देखि (\d{2})$/.exec(g.code7);
    if (!m || m[1] !== `${g.code5}01` || Number(m[2]) !== wards) {
      fail(`GPO ward range shape ${g.code5}: ${g.code7}`);
    }
  }
}
console.log('GPO postal cross-check: 753/753 codes and ward counts agree');

// --- types: EN suffix (typo-tolerant) must agree with NE suffix 100%
const typeOfEn = (en) => {
  const e = norm(en);
  if (e.includes('sub-metropolitian city') || e.includes('sub-metropolitan city')) {
    return 'sub-metropolitan';
  }
  if (e.includes('metropolitian city') || e.includes('metropolitan city')) {
    return 'metropolitan';
  }
  if (e.endsWith('rural municipality')) return 'rural';
  if (e.endsWith('urban municipality')) return 'municipality';
  fail(`unclassifiable EN type: ${en}`);
};
const NE_TYPE = {
  'गाउँपालिका': 'rural',
  'गाउंपालिका': 'rural',
  'नगरपालिका': 'municipality',
  'नगरापालिका': 'municipality',
  'महानगरपालिका': 'metropolitan',
  'उपमहानगरपालिका': 'sub-metropolitan',
};
const typeOfNe = (ne) => {
  const last = clean(ne).split(' ').at(-1);
  const t = NE_TYPE[last];
  if (!t) fail(`unclassifiable NE type: ${ne}`);
  return t;
};

const titleDist = (en) =>
  en
    .trim()
    .split(/\s+/)
    .map((tok) => tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase())
    .join(' ');

const provinces = [];
for (let num = 1; num <= 7; num += 1) {
  const ne = [...provNums.entries()].find(([, n]) => n === num)[0];
  provinces.push({ code: String(num), nameEn: PROVINCE_EN[ne], nameNe: ne });
}
const districts = nsoDistricts.map((d) => ({
  code: String(d.code),
  province: String(Math.floor(d.code / 100)),
  nameEn: titleDist(d.en),
  nameNe: districtNe.get(d.code),
}));
const palikas = nsoPalikas.map((p) => {
  const tEn = typeOfEn(p.en);
  const tNe = typeOfNe(p.ne);
  if (tEn !== tNe) fail(`type conflict ${p.code}: ${p.en} / ${p.ne}`);
  return {
    code: String(p.code),
    district: String(Math.floor(p.code / 100)),
    type: tEn,
    nameEn: clean(p.en),
    nameNe: clean(p.ne),
    wards: wardByCode.get(p.code),
  };
});

const header = `// Generated by \`pnpm generate:admin\` from src/admin/data/raw/*.json.
// DO NOT EDIT. Revision: ${REVISION}. See PROVENANCE.md.
`;
const emit = (name, typeName, rows) =>
  `${header}import type { ${typeName} } from '../types.js';\n\nexport const ${name}: readonly ${typeName}[] = ${JSON.stringify(rows, null, 2)} as const;\n`;

writeFileSync(join(outDir, 'provinces.ts'), emit('PROVINCES', 'Province', provinces));
writeFileSync(join(outDir, 'districts.ts'), emit('DISTRICTS', 'District', districts));
writeFileSync(join(outDir, 'palikas.ts'), emit('PALIKAS', 'Palika', palikas));
console.log(
  `generate:admin: ${provinces.length} provinces, ${districts.length} districts, ` +
    `${palikas.length} palikas, ${wardTotal} wards (revision ${REVISION})`,
);
