export const NEPALI_ONES_0_99: readonly string[] = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  'दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तीस',
  'तीस', 'एक्तीस', 'बत्तीस', 'तेत्तीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अठतीस', 'उनन्चालीस',
  'चालीस', 'एकचालीस', 'बयालीस', 'त्रियालीस', 'चवालीस', 'पैंतालीस', 'छयालीस', 'सच्चालीस', 'अठचालीस', 'उनन्चास',
  'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चउन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी',
  'साठी', 'एकसठ्ठी', 'बैसठ्ठी', 'त्रिसठ्ठी', 'चौंसठ्ठी', 'पैंसठ्ठी', 'छयासठ्ठी', 'सड्सठ्ठी', 'अठसठ्ठी', 'उनन्सत्तरी',
  'सत्तरी', 'एकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौरहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'असी', 'एकासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
  'नब्बे', 'एकान्नब्बे', 'बयान्नब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पन्चान्नब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनानसय',
];

export const ENGLISH_ONES: readonly string[] = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];

export const ENGLISH_TENS: readonly string[] = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

export const NEPALI_SCALES: readonly { readonly value: bigint; readonly word: string }[] = [
  { value: 100000000000n, word: 'खरब' },
  { value: 1000000000n, word: 'अरब' },
  { value: 10000000n, word: 'करोड' },
  { value: 100000n, word: 'लाख' },
  { value: 1000n, word: 'हजार' },
  { value: 100n, word: 'सय' },
];

export const ENGLISH_SCALES: readonly { readonly value: bigint; readonly word: string }[] = [
  { value: 100000000000n, word: 'kharab' },
  { value: 1000000000n, word: 'arab' },
  { value: 10000000n, word: 'crore' },
  { value: 100000n, word: 'lakh' },
  { value: 1000n, word: 'thousand' },
  { value: 100n, word: 'hundred' },
];
