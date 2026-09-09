import { z } from 'zod';

const reportReviewStatusValues = ['REVIEWED', 'ACTION_TAKEN', 'DISMISSED'] as const;
const flagReasonValues = ['SPAM', 'FRAUD', 'INAPPROPRIATE', 'DUPLICATE', 'SUSPICIOUS'] as const;

// Validation messages are stable i18n keys — see auth.schema.ts for rationale.
export const planFormSchema = z.object({
  name: z.string().min(1, 'validation.plan.nameRequired').max(100, 'validation.plan.nameMax'),
  description: z.string().min(1, 'validation.plan.descRequired').max(500, 'validation.plan.descMax'),
  price: z.number().min(0, 'validation.plan.priceMin'),
  validityDays: z.number().min(1, 'validation.plan.validityMin'),
  contactViewLimit: z.number().min(-1, 'validation.plan.contactLimitMin'),
  messageLimit: z.number().min(-1, 'validation.plan.messageLimitMin'),
  interestLimit: z.number().min(-1, 'validation.plan.interestLimitMin'),
  chatEnabled: z.boolean(),
  profileBoostEnabled: z.boolean(),
});

export const reportReviewSchema = z.object({
  status: z.enum(reportReviewStatusValues),
  notes: z.string().max(500, 'validation.notes.max').optional(),
});

export const flagSchema = z.object({
  reason: z.enum(flagReasonValues),
  notes: z.string().max(500, 'validation.notes.max').optional(),
});

// Inferred types
export type PlanFormValues = z.infer<typeof planFormSchema>;
export type ReportReviewFormValues = z.infer<typeof reportReviewSchema>;
export type FlagFormValues = z.infer<typeof flagSchema>;
