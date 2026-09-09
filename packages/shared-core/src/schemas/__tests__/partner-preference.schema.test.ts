import { describe, it, expect } from 'vitest';
import { partnerPreferenceSchema } from '../partner-preference.schema';

const validPreference = {
  minAge: 25,
  maxAge: 35,
  minHeightCm: 150,
  maxHeightCm: 180,
  minAnnualIncome: 0,
  maxAnnualIncome: 1_000_000,
  manglikPreference: 'DONT_KNOW' as const,
  religionNoBar: true,
  casteNoBar: false,
  preferredReligions: ['Hindu'],
  preferredCastes: [],
  preferredCities: ['Chennai'],
  preferredEducations: [],
  preferredMaritalStatuses: [],
  preferredMotherTongues: [],
};

describe('partnerPreferenceSchema', () => {
  it('should accept a fully valid preference', () => {
    expect(partnerPreferenceSchema.safeParse(validPreference).success).toBe(true);
  });

  it('should reject when minAge is greater than maxAge, flagged on maxAge', () => {
    const result = partnerPreferenceSchema.safeParse({ ...validPreference, minAge: 40, maxAge: 30 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('maxAge'))).toBe(true);
    }
  });

  it('should reject when minHeightCm is greater than maxHeightCm', () => {
    const result = partnerPreferenceSchema.safeParse({ ...validPreference, minHeightCm: 190, maxHeightCm: 160 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('maxHeightCm'))).toBe(true);
    }
  });

  it('should reject when minAnnualIncome is greater than maxAnnualIncome', () => {
    const result = partnerPreferenceSchema.safeParse({
      ...validPreference,
      minAnnualIncome: 500_000,
      maxAnnualIncome: 100_000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject an out-of-range age', () => {
    expect(partnerPreferenceSchema.safeParse({ ...validPreference, minAge: 10 }).success).toBe(false);
  });

  it('should reject an invalid manglik preference value', () => {
    const result = partnerPreferenceSchema.safeParse({ ...validPreference, manglikPreference: 'MAYBE' });
    expect(result.success).toBe(false);
  });

  it('should reject more than 20 preferred religions', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `R${i}`);
    const result = partnerPreferenceSchema.safeParse({ ...validPreference, preferredReligions: tooMany });
    expect(result.success).toBe(false);
  });
});
