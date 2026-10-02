export type Domain = {
  id: string;
  label: string;
  heading: string;
  path: string;
  description: string;
  example: string;
  docs: string;
};

export const domains: Domain[] = [
  { id: 'date', label: 'Dates', heading: 'BS and AD civil dates.', path: 'nepali-toolkit/date', description: 'Convert between Bikram Sambat and Gregorian dates within documented table coverage. Format calendars and perform civil-date arithmetic.', example: 'toAD(bs(2082, 4, 7))', docs: '/docs/reference/date/' },
  { id: 'number', label: 'Numbers', heading: 'Lakh and crore grouping.', path: 'nepali-toolkit/number', description: 'Format Nepali number grouping and parse numeric text. Pass decimal strings to preserve large values without floating-point rounding.', example: "formatNumber('12345678')", docs: '/docs/reference/number/' },
  { id: 'currency', label: 'Currency', heading: 'Rupees, expressed locally.', path: 'nepali-toolkit/currency', description: 'Format NPR amounts with configurable symbols, grouping, and numerals. Decimal-string inputs keep money formatting precise.', example: "formatNPR('123456.50')", docs: '/docs/reference/currency/' },
  { id: 'land', label: 'Land', heading: 'Ropani, bigha, and beyond.', path: 'nepali-toolkit/land', description: 'Convert supported Hill and Terai land-area units using documented conversion constants and exact internal area representation.', example: 'toSquareMetres(hillArea({ ropani: 2 }))', docs: '/docs/reference/land/' },
  { id: 'words', label: 'Words', heading: 'Numbers into Nepali words.', path: 'nepali-toolkit/words', description: 'Express supported numbers and NPR amounts in Nepali or English words, for readable statements and amount labels.', example: "numberToNepaliWords('123456')", docs: '/docs/reference/words/' },
  { id: 'collation', label: 'Sorting', heading: 'Order Nepali text.', path: 'nepali-toolkit/collation', description: 'Compare, sort, search, and inspect Nepali text. Choose a deterministic basic backend or the documented Intl behavior.', example: "createNepaliCollator({ backend: 'basic' }).compare('क', 'ख')", docs: '/docs/reference/collation/' },
  { id: 'phone', label: 'Phone', heading: 'Check the phone shape.', path: 'nepali-toolkit/phone', description: 'Parse and format supported Nepal phone numbers, or check whether raw input has a possible phone shape. This does not verify a subscriber.', example: "isPossibleNepalPhone('9841234567')", docs: '/docs/reference/phone/' },
  { id: 'admin', label: 'Admin', heading: 'Find administrative data.', path: 'nepali-toolkit/admin/districts', description: 'Look up districts by province with focused dataset imports. Province, palika, ward, and postal APIs have documented sources and revision notes.', example: "getDistricts('3')", docs: '/docs/reference/admin/' }
];
