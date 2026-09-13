import type { UserProfile } from '@matrimony/shared-core'

import type { DetailSectionGroup } from '@/components/shared/profile-detail-sections'

/**
 * Map the real backend `UserProfile` into the read-only `DetailSectionGroup[]`
 * shape the shared `ProfileDetailSections` component renders. Used by the admin
 * moderation review modals and the member-360 detail view so every admin
 * profile summary looks identical. Blank/unset fields fall back to an em dash.
 */

const MARITAL_LABELS: Record<string, string> = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
}

function label(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  return value
}

function humanize(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

function measure(value: number | null | undefined, suffix: string): string {
  if (value == null || value === 0) return '—'
  return `${value} ${suffix}`
}

export function buildProfileSections(p: UserProfile): DetailSectionGroup[] {
  return [
    {
      title: 'Basics',
      icon: 'user',
      fields: [
        { label: 'Age', value: p.age != null ? `${p.age}` : '—' },
        { label: 'Gender', value: humanize(p.gender) },
        { label: 'Marital status', value: MARITAL_LABELS[p.maritalStatus] ?? humanize(p.maritalStatus) },
        { label: 'Mother tongue', value: label(p.motherTongue) },
        { label: 'Date of birth', value: label(p.dateOfBirth) },
      ],
    },
    {
      title: 'Religious',
      icon: 'sparkles',
      fields: [
        { label: 'Religion', value: label(p.religion) },
        { label: 'Caste', value: label(p.caste) },
        { label: 'Sub caste', value: label(p.subCaste) },
        { label: 'Gothram', value: label(p.gothram) },
        { label: 'Manglik', value: humanize(p.manglik) },
      ],
    },
    {
      title: 'Career',
      icon: 'layers',
      fields: [
        { label: 'Education', value: label(p.highestEducation) },
        { label: 'Education detail', value: label(p.educationDetail) },
        { label: 'Profession', value: label(p.profession) },
        { label: 'Employment', value: humanize(p.employmentType) },
        { label: 'Company', value: label(p.companyName) },
        {
          label: 'Annual income',
          value: p.annualIncome ? `${p.annualIncome.toLocaleString('en-IN')}` : '—',
        },
        { label: 'Work location', value: label(p.workLocation) },
      ],
    },
    {
      title: 'Location',
      icon: 'map-pin',
      fields: [
        { label: 'Current city', value: label(p.currentCity) },
        { label: 'Current state', value: label(p.currentState) },
        { label: 'Current country', value: label(p.currentCountry) },
        { label: 'Native city', value: label(p.nativeCity) },
        { label: 'Native state', value: label(p.nativeState) },
        { label: 'Native country', value: label(p.nativeCountry) },
        { label: 'Citizenship', value: label(p.citizenshipCountry) },
        { label: 'Residency', value: humanize(p.residencyStatus) },
      ],
    },
    {
      title: 'Physical',
      icon: 'heart',
      fields: [
        { label: 'Height', value: measure(p.heightCm, 'cm') },
        { label: 'Weight', value: measure(p.weightKg, 'kg') },
        { label: 'Blood group', value: bloodGroupLabel(p.bloodGroup) },
        { label: 'Complexion', value: humanize(p.complexion) },
        { label: 'Body type', value: humanize(p.bodyType) },
        { label: 'Physical status', value: humanize(p.physicalStatus) },
      ],
    },
    {
      title: 'Family',
      icon: 'users',
      fields: [
        { label: "Father's status", value: humanize(p.fatherStatus) },
        { label: "Father's profession", value: label(p.fatherProfession) },
        { label: "Mother's status", value: humanize(p.motherStatus) },
        { label: "Mother's profession", value: label(p.motherProfession) },
        { label: 'Brothers', value: siblingSummary(p.noOfBrothers, p.brothersMarried) },
        { label: 'Sisters', value: siblingSummary(p.noOfSisters, p.sistersMarried) },
        { label: 'Birth order', value: humanize(p.birthOrder) },
        { label: 'Family type', value: humanize(p.familyType) },
        { label: 'Family status', value: humanize(p.familyStatus) },
        { label: 'Own house', value: p.ownHouse ? 'Yes' : '—' },
        { label: 'Asset details', value: label(p.assetDetails) },
        { label: 'Native place', value: label(p.nativePlace) },
      ],
    },
    {
      title: 'Horoscope',
      icon: 'star',
      fields: [
        { label: 'Raasi', value: label(p.raasi) },
        { label: 'Nakshatra', value: label(p.nakshatra) },
        { label: 'Dhosam', value: humanize(p.dhosam) },
        { label: 'Lagnam', value: label(p.lagnam) },
        { label: 'Birth time', value: label(p.birthTime) },
        { label: 'Birth city', value: label(p.birthCity) },
        { label: 'Birth place', value: label(p.birthPlaceLabel) },
        { label: 'Tamil year', value: label(p.tamilYear) },
        { label: 'Tamil month', value: label(p.tamilMonth) },
        { label: 'Tamil date', value: label(p.tamilDate) },
        { label: 'Kilamai', value: label(p.kilamai) },
        { label: 'Willing to share horoscope', value: p.willingToShareHoroscope ? 'Yes' : '—' },
      ],
    },
    {
      title: 'About',
      icon: 'user',
      fields: [{ label: 'About me', value: label(p.aboutMe) }],
    },
  ]
}

/** "2 (1 married)" style summary, or an em dash when unset. */
function siblingSummary(count: number | null | undefined, married: number | null | undefined): string {
  if (count == null) return '—'
  return married ? `${count} (${married} married)` : `${count}`
}

/** Blood group with a friendly label for DONT_KNOW. */
function bloodGroupLabel(value: string | null | undefined): string {
  if (value === 'DONT_KNOW') return "Don't know"
  return humanize(value)
}
