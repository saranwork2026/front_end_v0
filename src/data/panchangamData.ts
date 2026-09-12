/**
 * Tamil-calendar (Panchangam) option lists for the Horoscope profile section,
 * plus the Birth-order list for the Family section — FRONTEND ONLY, same
 * rationale as horoscopeData.ts / religionCasteData.ts: the backend stores
 * these as plain Strings (no enum / DB lookup), and the option lists ship in
 * the JS bundle since they never change.
 *
 * IMPORTANT: the Tamil year / month / kilamai option VALUES are the exact Tamil
 * strings the backend TamilCalendarService emits, and Tamil date values are
 * "1".."30". This makes the DOB-derived pre-fill a direct value match — no
 * mapping layer between the auto-derive endpoint and these dropdowns.
 */

export interface PanchangamOption {
  value: string;
  label: string;
}

/** 60-year Tamil (Jovian) cycle, in order (index 0 = Prabhava / பிரபவ). */
export const TAMIL_YEARS: PanchangamOption[] = [
  'பிரபவ', 'விபவ', 'சுக்ல', 'பிரமோதூத', 'பிரசோற்பத்தி',
  'பிரஜோற்பத்தி', 'ஆங்கீரச', 'ஸ்ரீமுக', 'பவ', 'யுவ',
  'தாது', 'ஈஸ்வர', 'வெகுதான்ய', 'பிரமாதி', 'விக்கிரம',
  'விஷு', 'சித்திரபானு', 'சுபானு', 'தாரண', 'பார்த்திப',
  'விய', 'சர்வஜித்', 'சர்வதாரி', 'விரோதி', 'விக்ருதி',
  'கர', 'நந்தன', 'விஜய', 'ஜய', 'மன்மத',
  'துன்முகி', 'ஹேவிளம்பி', 'விளம்பி', 'விகாரி', 'சார்வரி',
  'பிலவ', 'சுபகிருது', 'சோபகிருது', 'குரோதி', 'விசுவாவசு',
  'பரபாவ', 'பிலவங்க', 'கீலக', 'சௌமிய', 'சாதாரண',
  'விரோதகிருது', 'பரிதாபி', 'பிரமாதீச', 'ஆனந்த', 'ராட்சச',
  'நள', 'பிங்கள', 'காளயுக்தி', 'சித்தார்த்தி', 'ரௌத்திரி',
  'துன்மதி', 'துந்துபி', 'ருத்ரோத்காரி', 'ரக்தாட்சி', 'குரோதன',
  'அட்சய',
].map((y) => ({ value: y, label: y }));

/** 12 Tamil (solar) months, Chithirai → Panguni. */
export const TAMIL_MONTHS: PanchangamOption[] = [
  { value: 'சித்திரை', label: 'சித்திரை (Chithirai)' },
  { value: 'வைகாசி', label: 'வைகாசி (Vaikasi)' },
  { value: 'ஆனி', label: 'ஆனி (Aani)' },
  { value: 'ஆடி', label: 'ஆடி (Aadi)' },
  { value: 'ஆவணி', label: 'ஆவணி (Aavani)' },
  { value: 'புரட்டாசி', label: 'புரட்டாசி (Purattasi)' },
  { value: 'ஐப்பசி', label: 'ஐப்பசி (Aippasi)' },
  { value: 'கார்த்திகை', label: 'கார்த்திகை (Karthigai)' },
  { value: 'மார்கழி', label: 'மார்கழி (Margazhi)' },
  { value: 'தை', label: 'தை (Thai)' },
  { value: 'மாசி', label: 'மாசி (Masi)' },
  { value: 'பங்குனி', label: 'பங்குனி (Panguni)' },
];

/** Tamil date: day within the Tamil month, "1".."30". */
export const TAMIL_DATES: PanchangamOption[] = Array.from({ length: 30 }, (_, i) => {
  const d = String(i + 1);
  return { value: d, label: d };
});

/** 7 Tamil weekdays (கிழமை), Sunday → Saturday. */
export const KILAMAI_OPTIONS: PanchangamOption[] = [
  { value: 'ஞாயிறு', label: 'ஞாயிறு (Sunday)' },
  { value: 'திங்கள்', label: 'திங்கள் (Monday)' },
  { value: 'செவ்வாய்', label: 'செவ்வாய் (Tuesday)' },
  { value: 'புதன்', label: 'புதன் (Wednesday)' },
  { value: 'வியாழன்', label: 'வியாழன் (Thursday)' },
  { value: 'வெள்ளி', label: 'வெள்ளி (Friday)' },
  { value: 'சனி', label: 'சனி (Saturday)' },
];

/**
 * Birth order among siblings (Family section). Stable tokens as VALUES so the
 * stored value is language-independent while the label can be localized.
 */
export const BIRTH_ORDER_OPTIONS: PanchangamOption[] = [
  { value: 'FIRST', label: 'First' },
  { value: 'SECOND', label: 'Second' },
  { value: 'THIRD', label: 'Third' },
  { value: 'FOURTH', label: 'Fourth' },
  { value: 'FIFTH_OR_LATER', label: 'Fifth or later' },
];
