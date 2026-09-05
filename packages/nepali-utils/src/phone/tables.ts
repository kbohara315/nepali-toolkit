// Versioned numbering data. Revision: nta-2026-09.
// Sources: NTA National Numbering Plan (mobile operator series `98-X`,
// CDMA-evolution `97` range; fixed-line district area codes; `1660`/`1800`
// toll-free and `19xx` premium shapes), ITU NNP (+977, IDD 00, no trunk
// prefix). Operator keys follow nepali-phone short names. Rows whose
// allocation is uncertain ship as `null` and are treated as unallocated.
// Toll-free / premium shapes below are best-effort prefix shapes, not
// exhaustive allocations.

/** Table revision pinned to the NTA numbering plan snapshot. */
export const metadataRevision = 'nta-2026-09' as const;

/**
 * Mobile prefix (first 3 digits of the 10-digit NSN) to operator short
 * name. `null` marks a plausible-but-uncertain series (NTA citation
 * pending); such rows parse as valid but unallocated.
 */
export const MOBILE_PREFIXES: Readonly<Record<string, string | null>> = {
  // NTA mobile series — Nepal Telecom (NTC).
  '984': 'NTC',
  '985': 'NTC',
  '986': 'NTC',
  '974': 'NTC',
  '975': 'NTC',
  '976': 'NTC',
  // NTA mobile series — Ncell.
  '980': 'Ncell',
  '981': 'Ncell',
  '982': 'Ncell',
  // NTA mobile series — Smart Cell.
  '961': 'SmartCell',
  '962': 'SmartCell',
  '988': 'SmartCell',
  // NTA mobile series — UTL.
  '972': 'UTL',
  // NTA mobile series — Hello Mobile.
  '963': 'HelloMobile',
  // Plausible 96x/97x series, allocation uncertain (NTA citation pending).
  '960': null,
  '964': null,
  '965': null,
  '966': null,
  '967': null,
  '968': null,
  '969': null,
  '970': null,
  '971': null,
  '973': null,
  '977': null,
  '978': null,
  '979': null,
  '987': null,
  '989': null,
};

/**
 * Fixed-line area code (with leading `0`) to district names. Lookup uses
 * longest match so `010`/`011`/`019` win over `01`.
 */
export const AREA_CODES: Readonly<Record<string, readonly string[]>> = {
  // Bagmati — Kathmandu valley trio plus Kavre / Sindhupalchok splits.
  '01': ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
  '010': ['Sindhupalchok'],
  '011': ['Kavrepalanchok'],
  '019': ['Dolakha'],
  // Koshi.
  '021': ['Morang'],
  '023': ['Jhapa'],
  '024': ['Ilam'],
  '025': ['Sunsari'],
  '026': ['Dhankuta'],
  '027': ['Sankhuwasabha'],
  '028': ['Terhathum'],
  '029': ['Bhojpur', 'Okhaldhunga', 'Solukhumbu'],
  // Madhesh.
  '031': ['Saptari'],
  '033': ['Siraha'],
  '036': ['Dhanusha'],
  '041': ['Mahottari', 'Sarlahi'],
  '044': ['Rautahat'],
  '046': ['Bara'],
  '053': ['Parsa'],
  // Bagmati (outside valley).
  '056': ['Chitwan'],
  '057': ['Makwanpur'],
  '058': ['Sindhuli'],
  '059': ['Ramechhap'],
  // Gandaki.
  '061': ['Kaski'],
  '062': ['Syangja'],
  '063': ['Tanahun'],
  '064': ['Gorkha'],
  '065': ['Lamjung'],
  '066': ['Manang', 'Mustang'],
  '067': ['Myagdi'],
  '068': ['Baglung'],
  '069': ['Parbat'],
  // Lumbini.
  '071': ['Rupandehi'],
  '072': ['Palpa'],
  '073': ['Gulmi'],
  '074': ['Arghakhanchi'],
  '075': ['Pyuthan'],
  '076': ['Rolpa', 'Rukum East'],
  '077': ['Dang'],
  '078': ['Banke'],
  '079': ['Bardiya'],
  '082': ['Kapilvastu'],
  '083': ['Jajarkot'],
  '085': ['Nawalparasi West'],
  '086': ['Rukum West'],
  // Karnali.
  '087': ['Surkhet'],
  '088': ['Dailekh'],
  '089': ['Dolpa', 'Humla', 'Jumla', 'Kalikot', 'Mugu'],
  // Sudurpashchim.
  '091': ['Kailali'],
  '093': ['Achham'],
  '094': ['Doti'],
  '095': ['Bajhang'],
  '096': ['Bajura'],
  '097': ['Baitadi'],
  '098': ['Dadeldhura', 'Darchula'],
  '099': ['Kanchanpur'],
};

/** Best-effort toll-free leading shapes (NTA `1660`/`1800` series). */
export const TOLL_FREE_PATTERNS: readonly string[] = ['1660', '1800'];

/** Best-effort premium-rate leading shape (NTA `19xx` series). */
export const PREMIUM_PATTERNS: readonly string[] = ['19'];
