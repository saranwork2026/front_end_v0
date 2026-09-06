/**
 * Single source of truth for the business-fillable values used across the
 * legal pages (Terms, Privacy Policy). Mirrors the existing app's
 * apps/web/src/pages/legal/legalContent.ts.
 *
 * ⚠️ SCAFFOLD ONLY — every value wrapped in `[PLACEHOLDER: ...]` MUST be
 * replaced with real, business/legal-approved content before public launch.
 * The prose in legal-view.tsx is a structured DRAFT, not reviewed legal copy.
 */
export const LEGAL_INFO = {
  brandName: 'Magizh Matrimony',
  legalEntityName: '[PLACEHOLDER: Registered legal entity name, e.g. "Magizh Matrimony Pvt. Ltd."]',
  registeredAddress: '[PLACEHOLDER: Registered office address — street, city, state, PIN]',
  cin: '[PLACEHOLDER: CIN / company registration number, if applicable]',
  gstin: '[PLACEHOLDER: GSTIN, if applicable]',
  governingLaw: '[PLACEHOLDER: Governing law, e.g. "the laws of India"]',
  jurisdiction: '[PLACEHOLDER: Courts of exclusive jurisdiction, e.g. "the courts at Chennai, Tamil Nadu"]',
  grievanceOfficerName: '[PLACEHOLDER: Grievance Officer name]',
  grievanceOfficerEmail: '[PLACEHOLDER: grievance officer email]',
  supportEmail: '[PLACEHOLDER: support email, e.g. info@magizhmatrimony.com]',
  supportPhone: '[PLACEHOLDER: support phone number]',
  supportHours: '[PLACEHOLDER: support hours, e.g. "Mon–Sat, 10am–6pm IST"]',
  effectiveDate: '[PLACEHOLDER: Effective date, e.g. "1 September 2026"]',
} as const

export type LegalInfo = typeof LEGAL_INFO
