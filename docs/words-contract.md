# Words Contract (Phase 4)

Number-to-words in Nepali (Devanagari) and English (lakh/crore scales).
No `Intl`, no DOM/Node APIs. May import digit utilities only — MUST NOT
import `formatNumber`/grouping engine (word tables must never leak into
`formatNPR`-only bundles; the reverse dependency is forbidden).

Public wording is Nepali throughout; "Indian" appears nowhere user-facing.

## Supported range

Integers 0 ≤ n < 10¹² (up to 99 खरब). Anything outside, or non-integral
input where integers are required, throws `InvalidWordsError`
(`code = 'INVALID_WORDS'`, extends `TypeError`).

## Nepali scale words

सय (10²), हजार (10³), लाख (10⁵), करोड (10⁷), अरब (10⁹), खरब (10¹¹).

Grouping for speech follows the lakh/crore layout: e.g. 123,456 →
`एक लाख तेइस हजार चार सय छपन्न`; 10,000,000 → `एक करोड`.

## Nepali 0–99 table (normative, standard published spellings)

Pending native-speaker review (see limitation note at the end), the
implementation uses exactly these spellings:

```
0 शून्य      10 दश        20 बीस        30 तीस        40 चालीस
1 एक        11 एघार       21 एक्काइस    31 एक्तीस     41 एकचालीस
2 दुई       12 बाह्र       22 बाइस       32 बत्तीस     42 बयालीस
3 तीन       13 तेह्र       23 तेइस       33 तेत्तीस    43 त्रियालीस
4 चार       14 चौध        24 चौबीस      34 चौंतीस    44 चवालीस
5 पाँच      15 पन्ध्र      25 पच्चीस     35 पैंतीस    45 पैंतालीस
6 छ         16 सोह्र       26 छब्बीस     36 छत्तीस    46 छयालीस
7 सात       17 सत्र        27 सत्ताइस    37 सैंतीस    47 सच्चालीस
8 आठ        18 अठार       28 अठ्ठाइस    38 अठतीस     48 अठचालीस
9 नौ        19 उन्नाइस    29 उनन्तीस    39 उनन्चालीस  49 उनन्चास

50 पचास      60 साठी       70 सत्तरी     80 असी       90 नब्बे
51 एकाउन्न   61 एकसठ्ठी    71 एकहत्तर    81 एकासी     91 एकान्नब्बे
52 बाउन्न    62 बैसठ्ठी    72 बहत्तर     82 बयासी     92 बयान्नब्बे
53 त्रिपन्न   63 त्रिसठ्ठी   73 तिहत्तर    83 तिरासी    93 त्रियान्नब्बे
54 चउन्न     64 चौंसठ्ठी    74 चौरहत्तर   84 चौरासी    94 चौरान्नब्बे
55 पचपन्न    65 पैंसठ्ठी    75 पचहत्तर    85 पचासी     95 पन्चान्नब्बे
56 छपन्न     66 छयासठ्ठी    76 छयहत्तर    86 छयासी     96 छयान्नब्बे
57 सन्ताउन्न  67 सड्सठ्ठी    77 सतहत्तर    87 सतासी     97 सन्तान्नब्बे
58 अन्ठाउन्न  68 अठसठ्ठी     78 अठहत्तर    88 अठासी     98 अन्ठान्नब्बे
59 उनन्साठी  69 उनन्सत्तरी  79 उनासी      89 उनान्नब्बे 99 उनानसय
```

Composition: space-separated, no conjunctions. 100 → `एक सय`;
101 → `एक सय एक`; 1000 → `एक हजार`; 100000 → `एक लाख`.
Zero → `शून्य`. Negatives prefix `माइनस` (`माइनस पाँच`).
Decimals: `दशमलव` + per-digit words (`1.5` → `एक दशमलव पाँच`,
`0` digit → `शून्य`); at most 6 fraction digits, else
`InvalidWordsError`.

## English words (lakh/crore scales)

Lowercase, space-separated, no hyphens: `one lakh twenty three thousand
four hundred fifty six`. Scales: `hundred`, `thousand`, `lakh`, `crore`,
`arab`, `kharab`. Zero → `zero`; negatives prefix `minus`; decimals use
`point` + digit words (`one point five`). Same range and fraction limits
as Nepali.

## NPR amounts

```ts
amountToNepaliWordsNPR(value: WordsInput, options?: NepaliAmountWordsOptions): string
amountToNepaliWordsNPRMinorUnits(paisa: bigint, options?: NepaliAmountWordsOptions): string
parseNepaliWords(input: string): bigint
numberWordsInText(input: string): string
```

Rupees take at most 2 fraction digits (else `InvalidWordsError`); minor
units are integer paisa (negative allowed). Rendering:

- paisa == 0 → `{rupeeWords} रुपैयाँ मात्र`
- else → `{rupeeWords} रुपैयाँ {paisaWords} पैसा मात्र`

Example: `'123.45'` → `एक सय तेइस रुपैयाँ पैंतालीस पैसा मात्र`.

Both amount functions accept `NepaliAmountWordsOptions`:

```ts
type NepaliAmountWordsOptions = {
  appendOnly?: boolean; // default true
  showPaisa?: boolean; // default true
  paisaSeparator?: 'space' | 'and'; // default 'space'
  zeroRupeeText?: string; // default `शून्य`
  chequeStyle?: boolean; // default false
}
```

`parseNepaliWords` accepts generated Nepali integer phrases, optional `माइनस`,
and the currency suffixes `रुपैयाँ` and `मात्र`. It returns a `bigint` and
rejects malformed grammar, unknown words, non-descending scales, and values
outside the supported range. `numberWordsInText` replaces standalone ASCII or
Devanagari integer/decimal spans while leaving embedded identifiers and
unsupported values unchanged.

## Functions (`nepali-toolkit/words`)

`numberToNepaliWords`, `numberToEnglishWords`, `parseNepaliWords`,
`numberWordsInText`,
`amountToNepaliWordsNPR`, `amountToNepaliWordsNPRMinorUnits`,
`InvalidWordsError`, `NepaliAmountWordsOptions`, and `WordsInput`. Numeric
inputs are `string | number | bigint`; floats approximate past float precision,
so exact callers should use strings.

Subpath `./words`, initial budget 4096 gzip (word tables are data-heavy;
adjust only with a recorded bundle diff). Isolation: no Patro tokens, no
`Intl`, no date/currency/land/number-engine internals (digit maps only).

## Non-goals (v1)

Ordinal words, feminine/masculine agreement, other currencies, scales
beyond खरब, spelling variants as options.

## Limitation note

The 0–99 spellings above are standard published forms but Nepali
orthography varies by region and publisher. They ship flagged as
**pending native-speaker review**; corrections follow the data-correction
policy (patch release, corpus test updated, no silent changes).
