/**
 * Preferred-city reference data for Partner Preferences — FRONTEND ONLY (same
 * rationale as religionCasteData.ts). The backend stores `preferredCities` as
 * a plain flat string list, so these values are the human-readable city names.
 * Mirrors the existing app's PartnerPreferencesPage city list.
 */

export interface CityOption {
  value: string
  label: string
}

export const PREFERRED_CITIES: CityOption[] = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Indore',
  'Coimbatore',
  'Madurai',
  'Kochi',
  'Thiruvananthapuram',
  'Visakhapatnam',
  'Nagpur',
  'Surat',
  'Vadodara',
].map((name) => ({ value: name, label: name }))
