import { describe, expect, it } from 'vitest';
import { createNepaliCollator } from '../index.js';

// Punctuation / mixed-text corpus. Rule basis: docs/collation-contract.md
// says primary weights follow barnamala order and every other code point
// falls to a code-point-derived weight (table.ts: U+E200 + cp for cp <
// U+E000). Danda U+0964 / double-danda U+0965 therefore sort AFTER all
// Devanagari letters (whose weights live at U+E020..U+E04E) — i.e. as
// terminators: 'घर' < 'घर।' < 'घर॥' by the prefix/terminator rule, which is
// the "punctuation is secondary, letters primary" decision in testable form.
// Hyphen-minus U+002D / space U+0020 likewise get U+E22D / U+E220 weights,
// which sort AFTER every letter weight — so they are NOT ignorable at
// primary (CONTRACT-AMENDMENT-NEEDED if the contract ever claims
// ignorability: actual is कक < 'क-क' and कक < 'क क'). Mixed-script
// sentences: pure-ASCII fast-path keys start with U+0001 while Devanagari
// keys start at PUA letter weights, and embedded Latin inside a
// Devanagari string weighs U+E200+cp (above every letter) — so Devanagari
// matter decides first. All expectations below were confirmed against the
// implementation (scratch /tmp/keys.ts) AND derived from the rules above.

describe('collation punctuation corpus', () => {
  it('danda sorts as terminator after letters: घर < घर। < घर॥', () => {
    // Rule-derived: । is U+0964 → weight U+EB64, above ह (U+E04E) and below
    // ॥ (U+0965 → U+EB65). Bare घर hits the terminator U+E010 first, which
    // is below both — prefix rule.
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('घर', 'घर।')).toBe(-1);
    expect(c.compare('घर।', 'घर॥')).toBe(-1);
    expect(c.sort(['घर॥', 'घर।', 'घर'])).toEqual(['घर', 'घर।', 'घर॥']);
  });

  it('CONTRACT-AMENDMENT-NEEDED: hyphen-minus is NOT ignorable (कक < क-क)', () => {
    // Actual: '-' U+002D → U+E22D > क U+E02E, so joined sorts first.
    // If the contract is ever amended to make hyphen ignorable at primary
    // with a secondary tiebreak, this test must flip to क-क secondary-after.
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कक', 'क-क')).toBe(-1);
    expect(c.compare('क-क', 'कक')).toBe(1);
  });

  it('CONTRACT-AMENDMENT-NEEDED: space is NOT ignorable (कक < "क क")', () => {
    // Actual: space U+0020 → U+E220 > क U+E02E, so joined sorts first.
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('कक', 'क क')).toBe(-1);
    expect(c.sort(['क क', 'कक', 'क-क'])).toEqual(['कक', 'क क', 'क-क']);
  });

  it('mixed-script sentences: Devanagari-first ordering is exact', () => {
    // Rule-derived: embedded Latin weighs U+E200+cp (above every
    // Devanagari letter weight), so at pos0 र(U+E048) < H(U+E248): any
    // राम-led string precedes 'Hari घर'. Between the राम-led pair, pos4
    // decides: घर(U+E031) < w(U+E277). Hence
    // 'राम घर गयो' < 'राम went home' < 'Hari घर' (verified by key dump).
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('राम घर गयो', 'राम went home')).toBe(-1);
    expect(c.compare('राम went home', 'Hari घर')).toBe(-1);
    expect(c.sort(['राम went home', 'राम घर गयो', 'Hari घर'])).toEqual([
      'राम घर गयो',
      'राम went home',
      'Hari घर',
    ]);
  });

  it('Devanagari digits inside words sort by code-point weight (lexicographic)', () => {
    // Rule-derived (numeric:false default): १ U+0967 → U+EB67 < २ → U+EB68.
    const c = createNepaliCollator({ backend: 'basic' });
    expect(c.compare('क१', 'क२')).toBe(-1);
    expect(c.sort(['वडा १०', 'वडा २'])).toEqual(['वडा १०', 'वडा २']);
  });
});
