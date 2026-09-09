import { z } from 'zod';

const manglikPreferenceValues = ['YES', 'NO', 'DONT_KNOW'] as const;

// Validation messages are stable i18n keys — see auth.schema.ts for rationale.
export const partnerPreferenceSchema = z
  .object({
    minAge: z.number().min(18, 'validation.pref.minAge.min').max(70, 'validation.pref.minAge.max'),
    maxAge: z.number().min(18, 'validation.pref.maxAge.min').max(70, 'validation.pref.maxAge.max'),
    minHeightCm: z.number().min(120, 'validation.pref.minHeight.min').max(220, 'validation.pref.minHeight.max'),
    maxHeightCm: z.number().min(120, 'validation.pref.maxHeight.min').max(220, 'validation.pref.maxHeight.max'),
    minAnnualIncome: z.number().min(0, 'validation.pref.minIncome.min'),
    maxAnnualIncome: z.number().min(0, 'validation.pref.maxIncome.min'),
    manglikPreference: z.enum(manglikPreferenceValues),
    religionNoBar: z.boolean(),
    casteNoBar: z.boolean(),
    preferredReligions: z.array(z.string()).max(20, 'validation.pref.tooMany'),
    preferredCastes: z.array(z.string()).max(20, 'validation.pref.tooMany'),
    preferredCities: z.array(z.string()).max(20, 'validation.pref.tooMany'),
    preferredEducations: z.array(z.string()).max(20, 'validation.pref.tooMany'),
    preferredMaritalStatuses: z.array(z.string()).max(20, 'validation.pref.tooMany'),
    preferredMotherTongues: z.array(z.string()).max(20, 'validation.pref.tooMany'),
  })
  .refine((data) => data.minAge <= data.maxAge, {
    message: 'validation.pref.ageOrder',
    path: ['maxAge'],
  })
  .refine((data) => data.minHeightCm <= data.maxHeightCm, {
    message: 'validation.pref.heightOrder',
    path: ['maxHeightCm'],
  })
  .refine((data) => data.minAnnualIncome <= data.maxAnnualIncome, {
    message: 'validation.pref.incomeOrder',
    path: ['maxAnnualIncome'],
  });

// Inferred type
export type PartnerPreferenceFormValues = z.infer<typeof partnerPreferenceSchema>;
