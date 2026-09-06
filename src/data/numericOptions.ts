/**
 * Dropdown option generators for numeric profile fields that are better
 * presented as a bounded `<Select>` than a free-typed number input —
 * height, weight, and sibling counts all have small, well-known ranges.
 */

export interface NumericOption {
  value: string;
  label: string;
}

/** Height range for a marriage-age adult: 122cm (4'0") to 213cm (7'0"). */
export const HEIGHT_CM_OPTIONS: NumericOption[] = Array.from({ length: 213 - 122 + 1 }, (_, i) => {
  const cm = 122 + i;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { value: String(cm), label: `${cm} cm (${feet}'${inches}")` };
});

/** Weight range for a marriage-age adult: 30kg to 150kg. */
export const WEIGHT_KG_OPTIONS: NumericOption[] = Array.from({ length: 150 - 30 + 1 }, (_, i) => {
  const kg = 30 + i;
  return { value: String(kg), label: `${kg} kg` };
});

/** 0–10 range for sibling counts (Number of Brothers/Sisters, Brothers/Sisters Married). */
export const SIBLING_COUNT_OPTIONS: NumericOption[] = Array.from({ length: 11 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));
