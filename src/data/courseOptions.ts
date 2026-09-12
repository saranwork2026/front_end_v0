/**
 * Course / qualification list for the profile "Education detail" field —
 * FRONTEND ONLY, same rationale as educationOptions.ts / religionCasteData.ts
 * (no backend enum or DB lookup; the backend `educationDetail` column stays a
 * plain String, and this list ships in the JS bundle since it changes rarely).
 *
 * Grouped roughly by discipline for scanability, but exposed as one flat
 * searchable list (the field uses a typeahead SearchableSelect). Always ends
 * with "Other" so anything not listed can still be chosen. Value === label so
 * the stored string is human-readable and needs no mapping.
 */

export interface CourseOption {
  value: string;
  label: string;
}

const COURSE_NAMES: string[] = [
  // Engineering & Technology
  'B.E. / B.Tech',
  'M.E. / M.Tech',
  'B.Arch',
  'B.Sc (Computer Science)',
  'BCA',
  'MCA',
  'Diploma in Engineering',
  // Medical & Health
  'MBBS',
  'MD',
  'MS (Surgery)',
  'BDS',
  'MDS',
  'BAMS (Ayurveda)',
  'BHMS (Homeopathy)',
  'BUMS (Unani)',
  'B.Pharm',
  'M.Pharm',
  'Pharm.D',
  'BPT (Physiotherapy)',
  'B.Sc Nursing',
  'GNM Nursing',
  'B.Sc (Medical Lab Technology)',
  'Veterinary Science (B.V.Sc)',
  // Commerce, Management & Finance
  'B.Com',
  'M.Com',
  'BBA',
  'MBA',
  'CA (Chartered Accountancy)',
  'CS (Company Secretary)',
  'ICWA / CMA',
  'CFA',
  // Arts, Science & Humanities
  'B.A.',
  'M.A.',
  'B.Sc',
  'M.Sc',
  'B.Ed',
  'M.Ed',
  'B.Sc (Agriculture)',
  'BFA (Fine Arts)',
  'BSW / MSW (Social Work)',
  // Law
  'LLB',
  'LLM',
  'BA LLB',
  // Aviation, Hotel & Others
  'Hotel Management',
  'B.Des / M.Des (Design)',
  'Pilot / Aviation',
  'ITI',
  'Ph.D',
  // Schooling
  'SSLC / 10th',
  'HSC / 12th',
  // Catch-all — keep last.
  'Other',
];

export const COURSE_OPTIONS: CourseOption[] = COURSE_NAMES.map((c) => ({
  value: c,
  label: c,
}));
