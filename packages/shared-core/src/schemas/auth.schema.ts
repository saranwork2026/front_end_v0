import { z } from 'zod';

/**
 * Validation messages are emitted as STABLE KEYS (e.g.
 * 'validation.password.minLength'), not human sentences. This keeps
 * shared-core platform-agnostic — the web app maps these keys through its
 * i18n layer (see apps/web/src/i18n) to render English or Tamil, and a future
 * React Native app can map the same keys to its own translations. The keys
 * double as a stable contract: the English text can change in one place
 * (the locale files) without touching every schema or consumer.
 *
 * A consumer that doesn't localise can still show these keys, or map them via
 * VALIDATION_MESSAGES_EN below (the canonical English copy).
 */
const mobileNoPattern = /^[6-9]\d{9}$/;
const otpPattern = /^\d{6}$/;

const passwordSchema = z
  .string()
  .min(8, 'validation.password.minLength')
  .refine((val) => /[A-Z]/.test(val), 'validation.password.uppercase')
  .refine((val) => /[a-z]/.test(val), 'validation.password.lowercase')
  .refine((val) => /\d/.test(val), 'validation.password.digit')
  .refine((val) => /[^A-Za-z0-9]/.test(val), 'validation.password.special');

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'validation.firstName.required').max(50, 'validation.firstName.maxLength'),
    lastName: z.string().min(1, 'validation.lastName.required').max(50, 'validation.lastName.maxLength'),
    mobileNo: z.string().regex(mobileNoPattern, 'validation.mobile.invalid'),
    email: z
      .union([z.string().email('validation.email.invalid'), z.literal('')])
      .optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.password.mismatch',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, 'validation.identifier.required'),
  password: z.string().min(1, 'validation.password.required'),
});

export const otpSchema = z.object({
  otp: z.string().regex(otpPattern, 'validation.otp.invalid'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().regex(mobileNoPattern, 'validation.mobile.invalid'),
});

export const resetPasswordSchema = z
  .object({
    profileId: z.string().min(1, 'validation.profileId.required'),
    otp: z.string().regex(otpPattern, 'validation.otp.invalid'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.password.mismatch',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.currentPassword.required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.password.mismatch',
    path: ['confirmPassword'],
  });

/**
 * Canonical English copy for every validation key above. This is the single
 * source of truth for the English text — the web app's en locale re-exports
 * these, and any non-localised consumer (or a mobile app's English strings)
 * can map keys to sentences with it.
 */
export const VALIDATION_MESSAGES_EN: Record<string, string> = {
  'validation.firstName.required': 'First name is required',
  'validation.firstName.maxLength': 'First name must be at most 50 characters',
  'validation.lastName.required': 'Last name is required',
  'validation.lastName.maxLength': 'Last name must be at most 50 characters',
  'validation.mobile.invalid': 'Invalid mobile number',
  'validation.email.invalid': 'Invalid email address',
  'validation.identifier.required': 'Identifier is required',
  'validation.password.required': 'Password is required',
  'validation.password.minLength': 'Password must be at least 8 characters',
  'validation.password.uppercase': 'Password must contain an uppercase letter',
  'validation.password.lowercase': 'Password must contain a lowercase letter',
  'validation.password.digit': 'Password must contain a digit',
  'validation.password.special': 'Password must contain a special character',
  'validation.password.mismatch': 'Passwords do not match',
  'validation.otp.invalid': 'OTP must be exactly 6 numeric digits',
  'validation.profileId.required': 'Profile ID is required',
  'validation.currentPassword.required': 'Current password is required',
  // Profile section fields
  'validation.dateOfBirth.required': 'Date of birth is required',
  'validation.motherTongue.required': 'Mother tongue is required',
  'validation.currentCity.required': 'Current city is required',
  'validation.age.minMale': 'Male members must be at least {{min}} years old',
  'validation.age.minFemale': 'Female members must be at least {{min}} years old',
  'validation.annualIncome.min': 'Annual income must be at least 0',
  'validation.annualIncome.max': 'Annual income must be at most 999999999',
  'validation.height.min': 'Height must be at least 120 cm',
  'validation.height.max': 'Height must be at most 220 cm',
  'validation.weight.min': 'Weight must be at least 30 kg',
  'validation.weight.max': 'Weight must be at most 200 kg',
  'validation.brothers.max': 'Number of brothers must be at most 15',
  'validation.brothersMarried.max': 'Brothers married must be at most 15',
  'validation.sisters.max': 'Number of sisters must be at most 15',
  'validation.sistersMarried.max': 'Sisters married must be at most 15',
  // Partner preference
  'validation.pref.minAge.min': 'Minimum age must be at least 18',
  'validation.pref.minAge.max': 'Minimum age must be at most 70',
  'validation.pref.maxAge.min': 'Maximum age must be at least 18',
  'validation.pref.maxAge.max': 'Maximum age must be at most 70',
  'validation.pref.minHeight.min': 'Minimum height must be at least 120 cm',
  'validation.pref.minHeight.max': 'Minimum height must be at most 220 cm',
  'validation.pref.maxHeight.min': 'Maximum height must be at least 120 cm',
  'validation.pref.maxHeight.max': 'Maximum height must be at most 220 cm',
  'validation.pref.minIncome.min': 'Minimum annual income must be at least 0',
  'validation.pref.maxIncome.min': 'Maximum annual income must be at least 0',
  'validation.pref.tooMany': 'At most 20 items allowed',
  'validation.pref.ageOrder': 'Minimum age must be less than or equal to maximum age',
  'validation.pref.heightOrder': 'Minimum height must be less than or equal to maximum height',
  'validation.pref.incomeOrder': 'Minimum annual income must be less than or equal to maximum annual income',
  // Admin plan / notes
  'validation.plan.nameRequired': 'Plan name is required',
  'validation.plan.nameMax': 'Plan name must be at most 100 characters',
  'validation.plan.descRequired': 'Description is required',
  'validation.plan.descMax': 'Description must be at most 500 characters',
  'validation.plan.priceMin': 'Price must be at least 0',
  'validation.plan.validityMin': 'Validity must be at least 1 day',
  'validation.plan.contactLimitMin': 'Contact view limit must be at least -1 (-1 means unlimited)',
  'validation.plan.messageLimitMin': 'Message limit must be at least -1 (-1 means unlimited)',
  'validation.plan.interestLimitMin': 'Interest limit must be at least -1 (-1 means unlimited)',
  'validation.notes.max': 'Notes must be at most 500 characters',
};

// Inferred types
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
