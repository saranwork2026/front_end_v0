/**
 * Country reference data — FRONTEND ONLY, same rationale as
 * religionCasteData.ts (static list shipped in the JS bundle, no DB lookup
 * table or backend enum — country names change rarely and a network round
 * trip per profile load just to populate a dropdown isn't worth it).
 *
 * Backend `currentCountry`/`nativeCountry`/`citizenshipCountry` fields stay
 * plain Strings — values here are full country names (e.g. "India"), not
 * ISO codes, to match how the rest of the profile fields are stored/read.
 *
 * Priority countries (common for the Indian diaspora / this platform's
 * expected user base) are pinned to the top of the list, followed by the
 * remaining countries in alphabetical order.
 */

export interface CountryOption {
  value: string;
  label: string;
}

const PRIORITY_COUNTRIES = [
  'India',
  'Singapore',
  'Malaysia',
  'Sri Lanka',
  'United States',
  'United Kingdom',
  'Australia',
];

const OTHER_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Austria',
  'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belgium', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Egypt', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'Iceland',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Macau',
  'Madagascar', 'Malawi', 'Maldives', 'Malta', 'Mauritius', 'Mexico',
  'Moldova', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria',
  'North Korea', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Papua New Guinea',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saudi Arabia', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea',
  'Spain', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Trinidad and Tobago', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe', 'Other',
];

export const COUNTRIES: CountryOption[] = [
  ...PRIORITY_COUNTRIES.map((name) => ({ value: name, label: name })),
  ...OTHER_COUNTRIES.map((name) => ({ value: name, label: name })),
];
