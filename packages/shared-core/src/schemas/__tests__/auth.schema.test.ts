import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../auth.schema';

/** A DOB that is `years` full years before today (YYYY-MM-DD). */
function dobForAge(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  // Shift a day earlier so the birthday has definitively passed today.
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const validRegister = {
  firstName: 'John',
  lastName: 'Doe',
  mobileNo: '9876543210',
  dateOfBirth: dobForAge(25),
  gender: 'MALE' as const,
  email: 'john@example.com',
  password: 'Passw0rd!',
  confirmPassword: 'Passw0rd!',
};

describe('registerSchema', () => {
  it('should accept a fully valid registration', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it('should accept an empty email (optional)', () => {
    const result = registerSchema.safeParse({ ...validRegister, email: '' });
    expect(result.success).toBe(true);
  });

  it('should reject a mobile number not starting with 6-9', () => {
    const result = registerSchema.safeParse({ ...validRegister, mobileNo: '1234567890' });
    expect(result.success).toBe(false);
  });

  it('should reject a password missing a special character', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'Passw0rd',
      confirmPassword: 'Passw0rd',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'Pa0!',
      confirmPassword: 'Pa0!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when confirmPassword does not match, flagged on confirmPassword', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'Different1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });

  it('should reject an invalid email when one is provided', () => {
    const result = registerSchema.safeParse({ ...validRegister, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should reject a missing date of birth', () => {
    const result = registerSchema.safeParse({ ...validRegister, dateOfBirth: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('dateOfBirth'))).toBe(true);
    }
  });

  it('should reject a missing gender with the required key', () => {
    const result = registerSchema.safeParse({ ...validRegister, gender: '' as never });
    expect(result.success).toBe(false);
    if (!result.success) {
      const genderIssue = result.error.issues.find((i) => i.path.includes('gender'));
      expect(genderIssue?.message).toBe('validation.gender.required');
    }
  });

  it('should reject an underage male (20) on the dateOfBirth path', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      gender: 'MALE',
      dateOfBirth: dobForAge(20),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('dateOfBirth'));
      expect(issue?.message).toContain('validation.age.minMale');
    }
  });

  it('should reject an underage female (17) on the dateOfBirth path', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      gender: 'FEMALE',
      dateOfBirth: dobForAge(17),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('dateOfBirth'));
      expect(issue?.message).toContain('validation.age.minFemale');
    }
  });

  it('should accept a male exactly at the minimum age (21)', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      gender: 'MALE',
      dateOfBirth: dobForAge(21),
    });
    expect(result.success).toBe(true);
  });

  it('should accept a female exactly at the minimum age (18)', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      gender: 'FEMALE',
      dateOfBirth: dobForAge(18),
    });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('should accept a non-empty identifier and password', () => {
    expect(loginSchema.safeParse({ identifier: 'SM1', password: 'x' }).success).toBe(true);
  });

  it('should reject a blank identifier', () => {
    expect(loginSchema.safeParse({ identifier: '', password: 'x' }).success).toBe(false);
  });
});

describe('otpSchema', () => {
  it('should accept exactly 6 digits', () => {
    expect(otpSchema.safeParse({ otp: '123456' }).success).toBe(true);
  });

  it('should reject fewer than 6 digits', () => {
    expect(otpSchema.safeParse({ otp: '12345' }).success).toBe(false);
  });

  it('should reject non-numeric characters', () => {
    expect(otpSchema.safeParse({ otp: '12345a' }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept a valid Indian mobile number', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '9876543210' }).success).toBe(true);
  });

  it('should reject an invalid mobile number', () => {
    expect(forgotPasswordSchema.safeParse({ identifier: '12345' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept a valid reset payload', () => {
    const result = resetPasswordSchema.safeParse({
      profileId: 'SM1',
      otp: '123456',
      newPassword: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject mismatched passwords on the confirmPassword path', () => {
    const result = resetPasswordSchema.safeParse({
      profileId: 'SM1',
      otp: '123456',
      newPassword: 'Passw0rd!',
      confirmPassword: 'Other1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
});
