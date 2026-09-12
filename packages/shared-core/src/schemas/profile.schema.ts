import { z } from 'zod';

// Enum value arrays for Zod
const genderValues = ['MALE', 'FEMALE'] as const;
const maritalStatusValues = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'] as const;
const manglikValues = ['YES', 'NO', 'DONT_KNOW'] as const;
const employmentTypeValues = ['EMPLOYED_PRIVATE', 'EMPLOYED_GOVT', 'SELF_EMPLOYED', 'BUSINESS', 'FREELANCER', 'NOT_WORKING'] as const;
const residencyStatusValues = ['CITIZEN', 'PERMANENT_RESIDENT', 'WORK_PERMIT', 'STUDENT_VISA', 'TEMPORARY_VISA'] as const;
const bloodGroupValues = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'DONT_KNOW'] as const;
const complexionValues = ['VERY_FAIR', 'FAIR', 'WHEATISH', 'WHEATISH_BROWN', 'DARK'] as const;
const bodyTypeValues = ['SLIM', 'AVERAGE', 'ATHLETIC', 'HEAVY'] as const;
const physicalStatusValues = ['NORMAL', 'PHYSICALLY_CHALLENGED'] as const;
const familyTypeValues = ['NUCLEAR', 'JOINT', 'EXTENDED'] as const;
const familyStatusValues = ['MIDDLE_CLASS', 'UPPER_MIDDLE_CLASS', 'RICH', 'AFFLUENT'] as const;
const dhosamValues = ['NONE', 'SEVVAI', 'RAHU', 'KETHU', 'SHANI', 'KALATHRA'] as const;

// Minimum legal marriage age in India, by gender. Men must be at least 21,
// women at least 18. Non-male genders fall back to the lower bound (18). Kept in sync
// with the backend AgeGenderValidator (UserProfileRequest).
const MIN_AGE_MALE = 21;
const MIN_AGE_FEMALE = 18;

/** Full years between a YYYY-MM-DD date string and today. Null if unparseable. */
function ageFromDob(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validation messages are emitted as stable i18n keys (see auth.schema.ts for
 * the rationale). Messages that carry a runtime value (e.g. the minimum age)
 * use the convention `key||{json-params}` — the web app's useFieldError splits
 * on `||`, parses the params, and calls t(key, params). Consumers that don't
 * localise can map the key via VALIDATION_MESSAGES_EN in auth.schema.ts.
 */
export const basicSectionSchema = z
  .object({
    dateOfBirth: z.string().min(1, 'validation.dateOfBirth.required'),
    gender: z.enum(genderValues),
    maritalStatus: z.enum(maritalStatusValues),
    motherTongue: z.string().min(1, 'validation.motherTongue.required'),
    aboutMe: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Enforce the minimum marriage age by gender. Only runs once both DOB and
    // gender are present (their own required-field errors cover the empty case).
    if (!data.dateOfBirth || !data.gender) return;
    const age = ageFromDob(data.dateOfBirth);
    if (age === null) return;

    const minAge = data.gender === 'MALE' ? MIN_AGE_MALE : MIN_AGE_FEMALE;
    if (age < minAge) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message:
          data.gender === 'MALE'
            ? `validation.age.minMale||{"min":${MIN_AGE_MALE}}`
            : `validation.age.minFemale||{"min":${MIN_AGE_FEMALE}}`,
      });
    }
  });

// NOTE ON OPTIONALITY: per business rules, only Basic Information (except
// About Me) and Location's Current City are mandatory. Every other field
// across Religious/Professional/Location/Physical/Family/Horoscope is
// optional — many users legitimately don't know or don't wish to disclose
// these details. Enum fields use .optional() (allowing '' / undefined)
// rather than a bare z.enum(...), which would otherwise force a selection.

export const religiousSectionSchema = z.object({
  religion: z.string().optional(),
  sect: z.string().optional(),
  caste: z.string().optional(),
  subCaste: z.string().optional(),
  gothram: z.string().optional(),
  manglik: z.enum(manglikValues).optional(),
  canConsiderOtherReligion: z.boolean().optional(),
  canConsiderOtherCaste: z.boolean().optional(),
});

export const professionalSectionSchema = z.object({
  highestEducation: z.string().optional(),
  educationDetail: z.string().optional(),
  employmentType: z.enum(employmentTypeValues).optional(),
  profession: z.string().optional(),
  companyName: z.string().optional(),
  annualIncome: z.number().min(0, 'validation.annualIncome.min').max(999999999, 'validation.annualIncome.max').optional(),
  workLocation: z.string().optional(),
});

export const locationSectionSchema = z.object({
  currentCity: z.string().min(1, 'validation.currentCity.required'),
  currentState: z.string().optional(),
  currentCountry: z.string().optional(),
  nativeCity: z.string().optional(),
  nativeState: z.string().optional(),
  nativeCountry: z.string().optional(),
  citizenshipCountry: z.string().optional(),
  residencyStatus: z.enum(residencyStatusValues).optional(),
});

export const physicalSectionSchema = z.object({
  heightCm: z.number().min(120, 'validation.height.min').max(220, 'validation.height.max').optional(),
  weightKg: z.number().min(30, 'validation.weight.min').max(200, 'validation.weight.max').optional(),
  bloodGroup: z.enum(bloodGroupValues).optional(),
  complexion: z.enum(complexionValues).optional(),
  bodyType: z.enum(bodyTypeValues).optional(),
  physicalStatus: z.enum(physicalStatusValues).optional(),
});

export const familySectionSchema = z.object({
  fatherStatus: z.string().optional(),
  fatherProfession: z.string().optional(),
  motherStatus: z.string().optional(),
  motherProfession: z.string().optional(),
  noOfBrothers: z.number().min(0).max(15, 'validation.brothers.max').optional(),
  brothersMarried: z.number().min(0).max(15, 'validation.brothersMarried.max').optional(),
  noOfSisters: z.number().min(0).max(15, 'validation.sisters.max').optional(),
  sistersMarried: z.number().min(0).max(15, 'validation.sistersMarried.max').optional(),
  familyType: z.enum(familyTypeValues).optional(),
  familyStatus: z.enum(familyStatusValues).optional(),
  assetDetails: z.string().max(200, 'validation.assetDetails.max').optional(),
  birthOrder: z.string().optional(),
  ownHouse: z.boolean().optional(),
  nativePlace: z.string().optional(),
});

export const horoscopeSectionSchema = z.object({
  raasi: z.string().optional(),
  nakshatra: z.string().optional(),
  dhosam: z.enum(dhosamValues).optional(),
  lagnam: z.string().optional(),
  birthTime: z.string().optional(),
  birthCity: z.string().optional(),
  horoscopeAvailable: z.boolean().optional(),
  willingToShareHoroscope: z.boolean().optional(),
  tamilYear: z.string().optional(),
  tamilMonth: z.string().optional(),
  tamilDate: z.string().optional(),
  kilamai: z.string().optional(),
  birthPlaceLabel: z.string().optional(),
  birthLatitude: z.number().optional(),
  birthLongitude: z.number().optional(),
  birthTimezone: z.string().optional(),
  padam: z.number().optional(),
});

// Inferred types
export type BasicSectionFormValues = z.infer<typeof basicSectionSchema>;
export type ReligiousSectionFormValues = z.infer<typeof religiousSectionSchema>;
export type ProfessionalSectionFormValues = z.infer<typeof professionalSectionSchema>;
export type LocationSectionFormValues = z.infer<typeof locationSectionSchema>;
export type PhysicalSectionFormValues = z.infer<typeof physicalSectionSchema>;
export type FamilySectionFormValues = z.infer<typeof familySectionSchema>;
export type HoroscopeSectionFormValues = z.infer<typeof horoscopeSectionSchema>;
