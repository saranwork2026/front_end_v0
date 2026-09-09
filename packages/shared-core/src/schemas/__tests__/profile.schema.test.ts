import { describe, it, expect } from 'vitest';
import { basicSectionSchema } from '../profile.schema';

/** Build a YYYY-MM-DD DOB string for someone exactly `age` years old today. */
function dobForAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().split('T')[0];
}

function baseBasic(overrides: Record<string, unknown> = {}) {
  return {
    dateOfBirth: dobForAge(30),
    gender: 'MALE' as const,
    maritalStatus: 'NEVER_MARRIED' as const,
    motherTongue: 'Tamil',
    aboutMe: '',
    ...overrides,
  };
}

describe('basicSectionSchema — gender/age validation', () => {
  it('should accept a male member who is exactly 21', () => {
    const result = basicSectionSchema.safeParse(baseBasic({ gender: 'MALE', dateOfBirth: dobForAge(21) }));
    expect(result.success).toBe(true);
  });

  it('should reject a male member under 21 with a dateOfBirth error carrying the min-age key + param', () => {
    const result = basicSectionSchema.safeParse(baseBasic({ gender: 'MALE', dateOfBirth: dobForAge(20) }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'dateOfBirth');
      // Messages are i18n keys now (see profile.schema.ts). Parameterized
      // ones use the `key||{json}` convention — assert on that stable
      // contract rather than English copy.
      expect(issue?.message).toBe('validation.age.minMale||{"min":21}');
    }
  });

  it('should accept a female member who is exactly 18', () => {
    const result = basicSectionSchema.safeParse(baseBasic({ gender: 'FEMALE', dateOfBirth: dobForAge(18) }));
    expect(result.success).toBe(true);
  });

  it('should reject a female member under 18 with a dateOfBirth error carrying the min-age key + param', () => {
    const result = basicSectionSchema.safeParse(baseBasic({ gender: 'FEMALE', dateOfBirth: dobForAge(17) }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'dateOfBirth');
      expect(issue?.message).toBe('validation.age.minFemale||{"min":18}');
    }
  });

  it('should accept a 19-year-old female but reject a 19-year-old male', () => {
    expect(basicSectionSchema.safeParse(baseBasic({ gender: 'FEMALE', dateOfBirth: dobForAge(19) })).success).toBe(true);
    expect(basicSectionSchema.safeParse(baseBasic({ gender: 'MALE', dateOfBirth: dobForAge(19) })).success).toBe(false);
  });
});
