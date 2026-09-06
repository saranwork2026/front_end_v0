/**
 * Indian states / union territories reference data — FRONTEND ONLY, same
 * rationale as countryData.ts (static list shipped in the JS bundle, no DB
 * lookup table or backend enum — state names change rarely).
 *
 * Backend `currentState`/`nativeState` fields stay plain Strings — values
 * here are full state/UT names to match how the rest of the profile fields
 * are stored/read.
 *
 * Used to render a dropdown for the State field when the corresponding
 * Country field is "India" (LocationStep.tsx wizard step and
 * ProfileEditPage.tsx's LocationForm) — falls back to free text for
 * non-Indian addresses.
 */

export interface StateOption {
  value: string;
  label: string;
}

const INDIAN_STATE_NAMES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const INDIAN_STATES: StateOption[] = INDIAN_STATE_NAMES.map((name) => ({
  value: name,
  label: name,
}));
