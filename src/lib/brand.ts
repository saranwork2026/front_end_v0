/**
 * Magizh Matrimony brand constants. Single source of truth for brand copy and
 * contact details. Mirrors the existing app's lib/brand.ts.
 */

export const BRAND_NAME = 'Magizh Matrimony'

export const TAGLINES = {
  eyebrow: 'Trusted Connections. Beautiful Relationships.',
  primary: 'Find Your Perfect Life Partner',
  emotional: 'Where Hearts Meet & Families Unite',
  ribbon: 'A New Beginning • A Beautiful Journey • A Lifetime Together',
} as const

export const TRUST_PILLARS = [
  'Verified Profiles',
  'Safe & Secure',
  'Personalized Matching',
  'Trusted Service',
] as const

export const BRAND_CONTACT = {
  phone: '9943099050',
  email: 'info@magizhmatrimony.com',
  website: 'www.magizhmatrimony.com',
  address: '1st Floor, Najeem Complex, Town Extension, Mayiladuthurai – 609001',
} as const
