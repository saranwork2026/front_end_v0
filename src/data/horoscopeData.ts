/**
 * Nakshatra (birth star) / Raasi (moon sign) reference data for the
 * Horoscope profile section — FRONTEND ONLY, same rationale as
 * religionCasteData.ts (no backend enum/DB lookup table; the backend
 * `raasi`/`nakshatra` fields stay plain Strings, values ship in the JS
 * bundle since the list never changes).
 *
 * Standard Vedic/Tamil astrology reference: the ecliptic is divided into
 * 27 nakshatras of 13°20' each, and each nakshatra is further divided into
 * 4 padhams ("padas") of 3°20' each — 108 padhams total. The 12 raasis
 * (zodiac signs) are 30° each, i.e. exactly 9 padhams per raasi, and the
 * padhams are laid out back-to-back in the same fixed order as the
 * nakshatras and raasis themselves. That fixed relationship is what lets
 * getRaasiForNakshatraPadham() below compute the raasi purely from
 * (nakshatra index, padham) with no lookup table needed — it's exact
 * astronomical/mathematical fact, not an approximation:
 *   globalPadhamIndex = nakshatraIndex * 4 + (padham - 1)   // 0..107
 *   raasiIndex = floor(globalPadhamIndex / 9)                // 0..11
 */

export interface HoroscopeOption {
  value: string;
  label: string;
}

// Ordered starting from Mesham (Aries) — index in this array IS the
// mathematical raasi index used by getRaasiForNakshatraPadham().
export const RAASI_OPTIONS: HoroscopeOption[] = [
  { value: 'Mesham', label: 'Mesham (மேஷம் - Aries)' },
  { value: 'Rishabam', label: 'Rishabam (ரிஷபம் - Taurus)' },
  { value: 'Mithunam', label: 'Mithunam (மிதுனம் - Gemini)' },
  { value: 'Kadagam', label: 'Kadagam (கடகம் - Cancer)' },
  { value: 'Simmam', label: 'Simmam (சிம்மம் - Leo)' },
  { value: 'Kanni', label: 'Kanni (கன்னி - Virgo)' },
  { value: 'Thulam', label: 'Thulam (துலாம் - Libra)' },
  { value: 'Viruchigam', label: 'Viruchigam (விருச்சிகம் - Scorpio)' },
  { value: 'Dhanusu', label: 'Dhanusu (தனுசு - Sagittarius)' },
  { value: 'Magaram', label: 'Magaram (மகரம் - Capricorn)' },
  { value: 'Kumbam', label: 'Kumbam (கும்பம் - Aquarius)' },
  { value: 'Meenam', label: 'Meenam (மீனம் - Pisces)' },
];

// Ordered starting from Ashwini — index in this array IS the nakshatraIndex
// used by getRaasiForNakshatraPadham(). Do not reorder.
export const NAKSHATRA_OPTIONS: HoroscopeOption[] = [
  { value: 'Ashwini', label: 'Ashwini (அஸ்வினி)' },
  { value: 'Bharani', label: 'Bharani (பரணி)' },
  { value: 'Krittika', label: 'Krittika (கார்த்திகை)' },
  { value: 'Rohini', label: 'Rohini (ரோகிணி)' },
  { value: 'Mrigashira', label: 'Mrigashira (மிருகசீரிடம்)' },
  { value: 'Ardra', label: 'Ardra (திருவாதிரை)' },
  { value: 'Punarvasu', label: 'Punarvasu (புனர்பூசம்)' },
  { value: 'Pushya', label: 'Pushya (பூசம்)' },
  { value: 'Ashlesha', label: 'Ashlesha (ஆயில்யம்)' },
  { value: 'Magha', label: 'Magha (மகம்)' },
  { value: 'Purva Phalguni', label: 'Purva Phalguni (பூரம்)' },
  { value: 'Uttara Phalguni', label: 'Uttara Phalguni (உத்திரம்)' },
  { value: 'Hasta', label: 'Hasta (அஸ்தம்)' },
  { value: 'Chitra', label: 'Chitra (சித்திரை)' },
  { value: 'Swati', label: 'Swati (சுவாதி)' },
  { value: 'Vishakha', label: 'Vishakha (விசாகம்)' },
  { value: 'Anuradha', label: 'Anuradha (அனுஷம்)' },
  { value: 'Jyeshtha', label: 'Jyeshtha (கேட்டை)' },
  { value: 'Mula', label: 'Mula (மூலம்)' },
  { value: 'Purva Ashadha', label: 'Purva Ashadha (பூராடம்)' },
  { value: 'Uttara Ashadha', label: 'Uttara Ashadha (உத்திராடம்)' },
  { value: 'Shravana', label: 'Shravana (திருவோணம்)' },
  { value: 'Dhanishta', label: 'Dhanishta (அவிட்டம்)' },
  { value: 'Shatabhisha', label: 'Shatabhisha (சதயம்)' },
  { value: 'Purva Bhadrapada', label: 'Purva Bhadrapada (பூரட்டாதி)' },
  { value: 'Uttara Bhadrapada', label: 'Uttara Bhadrapada (உத்திரட்டாதி)' },
  { value: 'Revati', label: 'Revati (ரேவதி)' },
];

export const PADHAM_OPTIONS: HoroscopeOption[] = [
  { value: '1', label: 'Padham 1' },
  { value: '2', label: 'Padham 2' },
  { value: '3', label: 'Padham 3' },
  { value: '4', label: 'Padham 4' },
];

/**
 * Derives the raasi (moon sign) for a given nakshatra + padham (1-4), per
 * the fixed 108-padham layout described above. Returns null if the
 * nakshatra isn't recognized or padham is out of range (caller should
 * treat this as "not enough info yet" rather than an error).
 */
export function getRaasiForNakshatraPadham(nakshatra: string, padham: number): string | null {
  const nakshatraIndex = NAKSHATRA_OPTIONS.findIndex((n) => n.value === nakshatra);
  if (nakshatraIndex === -1 || padham < 1 || padham > 4) {
    return null;
  }
  const globalPadhamIndex = nakshatraIndex * 4 + (padham - 1);
  const raasiIndex = Math.floor(globalPadhamIndex / 9);
  return RAASI_OPTIONS[raasiIndex]?.value ?? null;
}
