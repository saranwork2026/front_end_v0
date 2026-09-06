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
        { label: 'Residency', value: humanize(p.residencyStatus) },
      ],
    },
    {
      title: 'Physical',
      icon: 'heart',
      fields: [
        { label: 'Height', value: measure(p.heightCm, 'cm') },
        { label: 'Weight', value: measure(p.weightKg, 'kg') },
        { label: 'Blood group', value: humanize(p.bloodGroup) },
        { label: 'Complexion', value: humanize(p.complexion) },
        { label: 'Body type', value: humanize(p.bodyType) },
      ],
    },
    {
      title: 'Family',
      icon: 'users',
      fields: [
        { label: "Father's status", value: humanize(p.fatherStatus) },
        { label: "Mother's status", value: humanize(p.motherStatus) },
        { label: 'Brothers', value: p.noOfBrothers != null ? `${p.noOfBrothers}` : '—' },
        { label: 'Sisters', value: p.noOfSisters != null ? `${p.noOfSisters}` : '—' },
        { label: 'Family type', value: humanize(p.familyType) },
        { label: 'Family status', value: humanize(p.familyStatus) },
      ],
    },
    {
      title: 'Horoscope',
      icon: 'star',
      fields: [
        { label: 'Raasi', value: label(p.raasi) },
        { label: 'Nakshatra', value: label(p.nakshatra) },
        { label: 'Dhosam', value: humanize(p.dhosam) },
        { label: 'Birth time', value: label(p.birthTime) },
        { label: 'Birth city', value: label(p.birthCity) },
      ],
    },
  ]
}
