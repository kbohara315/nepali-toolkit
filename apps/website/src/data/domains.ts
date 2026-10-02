export type Domain = {
  id: string;
  label: string;
  path: string;
  description: string;
  example: string;
  docs: string;
};

export const domains: Domain[] = [
  { id: 'date', label: 'Dates', path: 'nepali-toolkit/date', description: 'Convert BS and AD dates, format calendars, and do date arithmetic.', example: "formatBS(bs(2082, 4, 7), 'YYYY-MM-DD')", docs: '/docs/reference/date/' },
  { id: 'number', label: 'Numbers', path: 'nepali-toolkit/number', description: 'Format lakh and crore grouping or parse exact numeric text.', example: "formatNumber('12345678')", docs: '/docs/reference/number/' },
  { id: 'currency', label: 'Currency', path: 'nepali-toolkit/currency', description: 'Format exact NPR amounts with symbols, grouping, and numerals.', example: "formatNPR('123456.50')", docs: '/docs/reference/currency/' },
  { id: 'land', label: 'Land', path: 'nepali-toolkit/land', description: 'Convert supported Hill and Terai land-area units exactly.', example: 'formatHillArea(hillArea({ ropani: 2, aana: 3 }))', docs: '/docs/reference/land/' },
  { id: 'words', label: 'Words', path: 'nepali-toolkit/words', description: 'Express numbers and NPR amounts as English or Nepali words.', example: 'numberToNepaliWords(2082)', docs: '/docs/reference/words/' },
  { id: 'collation', label: 'Sorting', path: 'nepali-toolkit/collation', description: 'Sort, search, and inspect Nepali text with aware collation.', example: "createNepaliCollator().compare('क', 'ख')", docs: '/docs/reference/collation/' },
  { id: 'phone', label: 'Phone', path: 'nepali-toolkit/phone', description: 'Parse, format, and validate supported Nepal phone numbers.', example: "isPossibleNepalPhone('9841234567')", docs: '/docs/reference/phone/' },
  { id: 'admin', label: 'Admin', path: 'nepali-toolkit/admin', description: 'Explore province, district, palika, ward, and postal data.', example: 'getProvinces()', docs: '/docs/reference/admin/' }
];
