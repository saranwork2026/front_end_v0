import type { IconName } from '@/components/ui/icon'
import type {
  UserProfile,
  BasicSectionRequest,
  ReligiousSectionRequest,
  ProfessionalSectionRequest,
  LocationSectionRequest,
  PhysicalSectionRequest,
  FamilySectionRequest,
  HoroscopeSectionRequest,
  FullProfileRequest,
} from '@matrimony/shared-core'
import { profileApi } from '@/src/lib/api'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import { RELIGIONS, MOTHER_TONGUES } from '@/src/data/religionCasteData'
import { NAKSHATRA_OPTIONS, RAASI_OPTIONS } from '@/src/data/horoscopeData'
import { HEIGHT_CM_OPTIONS, WEIGHT_KG_OPTIONS, SIBLING_COUNT_OPTIONS } from '@/src/data/numericOptions'

/**
 * Profile-wizard domain model for /profile/wizard, wired to the real per-section
 * save endpoints (profileApi.save*), submitProfile, and seeded from getProfile.
 * The 9 steps, mandatory fields (DOB, gender, maritalStatus, currentCity) and
 * the final redirect to /partner-preferences match the spec.
 */

export type StepKey =
  | 'photos' | 'basic' | 'religious' | 'professional'
  | 'location' | 'physical' | 'family' | 'horoscope' | 'review'

export interface StepMeta {
  key: StepKey
  label: string
  title: string
  description: string
  icon: IconName
}

export const steps: StepMeta[] = [
  { key: 'photos', label: 'Photos', title: 'Profile photos', description: 'Add clear, recent photos. The first photo is your primary.', icon: 'camera' },
  { key: 'basic', label: 'Basic', title: 'Basic details', description: 'Tell us the essentials about yourself.', icon: 'user' },
  { key: 'religious', label: 'Religious', title: 'Religious background', description: 'Community and religious details for better matches.', icon: 'sparkles' },
  { key: 'professional', label: 'Career', title: 'Education & career', description: 'Your qualifications and profession.', icon: 'settings' },
  { key: 'location', label: 'Location', title: 'Location', description: 'Your native and current location.', icon: 'map-pin' },
  { key: 'physical', label: 'Physical', title: 'Physical attributes', description: 'A few physical details.', icon: 'heart' },
  { key: 'family', label: 'Family', title: 'Family details', description: 'About your family and values.', icon: 'users' },
  { key: 'horoscope', label: 'Horoscope', title: 'Horoscope', description: 'Birth-chart details (optional but recommended).', icon: 'star' },
  { key: 'review', label: 'Review', title: 'Review & submit', description: 'Check everything, then submit for review.', icon: 'circle-check' },
]

export const stepOrder: StepKey[] = steps.map((s) => s.key)
export const lastStepIndex = steps.length - 1

/* --------------------------------- Photos --------------------------------- */

export type PhotoVisibility = 'PUBLIC' | 'REQUESTERS' | 'PREMIUM'
export interface PhotoItem {
  url: string
  visibility: PhotoVisibility
}
export const photoVisibilityOptions: { value: PhotoVisibility; label: string; hint: string; icon: IconName }[] = [
  { value: 'PUBLIC', label: 'Everyone', hint: 'Visible to all members', icon: 'users' },
  { value: 'REQUESTERS', label: 'On request', hint: 'Only members you approve', icon: 'lock' },
  { value: 'PREMIUM', label: 'Premium only', hint: 'Only premium members', icon: 'shield' },
]
export function visibilityLabel(v: PhotoVisibility): string {
  return photoVisibilityOptions.find((o) => o.value === v)?.label ?? v
}
export const defaultPhotoVisibility: PhotoVisibility = 'PUBLIC'

/* ------------------------------- Form shape ------------------------------- */

export interface WizardForm {
  photos: PhotoItem[]
  firstName: string
  lastName: string
  dob: string
  gender: string
  maritalStatus: string
  motherTongue: string
  religion: string
  sect: string
  caste: string
  subCaste: string
  gothram: string
  manglik: string
  openToOtherReligion: string
  openToOtherCaste: string
  education: string
  educationDetail: string
  profession: string
  employedIn: string
  annualIncome: string
  companyName: string
  workLocation: string
  nativeCountry: string
  nativeState: string
  nativeCity: string
  currentSameAsNative: boolean
  currentCountry: string
  currentState: string
  currentCity: string
  citizenshipCountry: string
  residencyStatus: string
  heightCm: string
  weightKg: string
  bloodGroup: string
  complexion: string
  physicalStatus: string
  bodyType: string
  familyType: string
  familyValues: string
  fatherStatus: string
  fatherProfession: string
  motherStatus: string
  motherProfession: string
  brothers: string
  brothersMarried: string
  sisters: string
  sistersMarried: string
  assetDetails: string
  birthTime: string
  birthCity: string
  nakshatra: string
  padam: string
  raasi: string
  dhosam: string
  lagnam: string
  horoscopeAvailable: boolean
  willingToShareHoroscope: boolean
  aboutMe: string
}

export const emptyForm: WizardForm = {
  photos: [], firstName: '', lastName: '', dob: '', gender: '', maritalStatus: '', motherTongue: '',
  religion: '', sect: '', caste: '', subCaste: '', gothram: '', manglik: '', openToOtherReligion: '', openToOtherCaste: '',
  education: '', educationDetail: '', profession: '', employedIn: '', annualIncome: '', companyName: '', workLocation: '',
  nativeCountry: '', nativeState: '', nativeCity: '', currentSameAsNative: false,
  currentCountry: '', currentState: '', currentCity: '', citizenshipCountry: '', residencyStatus: '',
  heightCm: '', weightKg: '', bloodGroup: '', complexion: '', physicalStatus: '', bodyType: '',
  familyType: '', familyValues: '', fatherStatus: '', fatherProfession: '', motherStatus: '', motherProfession: '',
  brothers: '', brothersMarried: '', sisters: '', sistersMarried: '', assetDetails: '',
  birthTime: '', birthCity: '', nakshatra: '', padam: '', raasi: '', dhosam: '', lagnam: '',
  horoscopeAvailable: false, willingToShareHoroscope: false, aboutMe: '',
}

/* Retained for the ?state=empty preview only. */
export const seededForm: WizardForm = { ...emptyForm }

/* --------------------------- Options (value/label) ------------------------ */
/* Values are the BACKEND enum/string values; labels are human display text. */

export interface Opt {
  value: string
  label: string
}

export const genderOptions: Opt[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
]
export const maritalOptions: Opt[] = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
]
export const motherTongueOptions: Opt[] = MOTHER_TONGUES.map((m) => ({ value: m.value, label: m.label }))
export const religionOptions: Opt[] = RELIGIONS.map((r) => ({ value: r.value, label: r.label }))
export const yesNoOptions: Opt[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]
export const manglikOptions: Opt[] = [
  { value: 'YES', label: 'Yes (Manglik)' },
  { value: 'NO', label: 'No' },
  { value: 'DONT_KNOW', label: "Don't Know" },
]
export const padamOptions: Opt[] = [
  { value: '1', label: 'Padam 1' },
  { value: '2', label: 'Padam 2' },
  { value: '3', label: 'Padam 3' },
  { value: '4', label: 'Padam 4' },
]
export const educationOptions: Opt[] = HIGHEST_EDUCATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const employedInOptions: Opt[] = [
  { value: 'EMPLOYED_PRIVATE', label: 'Private Sector' },
  { value: 'EMPLOYED_GOVT', label: 'Government / Public Sector' },
  { value: 'SELF_EMPLOYED', label: 'Self-Employed' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'NOT_WORKING', label: 'Not Working' },
]
export const residencyStatusOptions: Opt[] = [
  { value: 'CITIZEN', label: 'Citizen' },
  { value: 'PERMANENT_RESIDENT', label: 'Permanent Resident (PR)' },
  { value: 'WORK_PERMIT', label: 'Work Permit' },
  { value: 'STUDENT_VISA', label: 'Student Visa' },
  { value: 'TEMPORARY_VISA', label: 'Temporary Visa' },
]
export const bodyTypeOptions: Opt[] = [
  { value: 'SLIM', label: 'Slim' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'ATHLETIC', label: 'Athletic' },
  { value: 'HEAVY', label: 'Heavy' },
]
export const bloodGroupOptions: Opt[] = [
  { value: 'A_POSITIVE', label: 'A+' }, { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' }, { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'O_POSITIVE', label: 'O+' }, { value: 'O_NEGATIVE', label: 'O-' },
  { value: 'AB_POSITIVE', label: 'AB+' }, { value: 'AB_NEGATIVE', label: 'AB-' },
]
export const complexionOptions: Opt[] = [
  { value: 'VERY_FAIR', label: 'Very Fair' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'WHEATISH', label: 'Wheatish' },
  { value: 'WHEATISH_BROWN', label: 'Wheatish Brown' },
  { value: 'DARK', label: 'Dark' },
]
export const physicalStatusOptions: Opt[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PHYSICALLY_CHALLENGED', label: 'Physically Challenged' },
]
export const familyTypeOptions: Opt[] = [
  { value: 'NUCLEAR', label: 'Nuclear Family' },
  { value: 'JOINT', label: 'Joint Family' },
  { value: 'EXTENDED', label: 'Extended Family' },
]
export const familyValuesOptions: Opt[] = [
  { value: 'MIDDLE_CLASS', label: 'Middle Class' },
  { value: 'UPPER_MIDDLE_CLASS', label: 'Upper Middle Class' },
  { value: 'RICH', label: 'Rich' },
  { value: 'AFFLUENT', label: 'Affluent' },
]
export const parentStatusOptions: Opt[] = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'HOMEMAKER', label: 'Homemaker' },
  { value: 'PASSED_AWAY', label: 'Passed Away' },
]
export const siblingCountOptions: Opt[] = SIBLING_COUNT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const heightOptions: Opt[] = HEIGHT_CM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const weightOptions: Opt[] = WEIGHT_KG_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const nakshatraOptions: Opt[] = NAKSHATRA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const raasiOptions: Opt[] = RAASI_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
export const dhosamOptions: Opt[] = [
  { value: 'NONE', label: 'No Dhosam' },
  { value: 'SEVVAI', label: 'Sevvai (Mars)' },
  { value: 'RAHU', label: 'Rahu' },
  { value: 'KETHU', label: 'Kethu' },
  { value: 'SHANI', label: 'Shani (Saturn)' },
  { value: 'KALATHRA', label: 'Kalathra' },
]

/* ------------------------------ Validation -------------------------------- */

export type FieldErrors = Partial<Record<keyof WizardForm, string>>

export function validateStep(step: StepKey, form: WizardForm): FieldErrors {
  const errors: FieldErrors = {}
  if (step === 'basic') {
    if (!form.dob) errors.dob = 'Date of birth is required.'
    if (!form.gender) errors.gender = 'Gender is required.'
    if (!form.maritalStatus) errors.maritalStatus = 'Marital status is required.'
  }
  if (step === 'location') {
    if (!form.currentCity.trim()) errors.currentCity = 'Current city is required.'
  }
  return errors
}

export function isSubmittable(form: WizardForm): boolean {
  return Boolean(form.dob && form.gender && form.maritalStatus && form.currentCity.trim())
}

/* --------------------------- form → section DTOs -------------------------- */

const num = (v: string): number | undefined => (v === '' ? undefined : Number(v))
const str = (v: string): string | undefined => (v.trim() === '' ? undefined : v)

function basicDto(f: WizardForm): BasicSectionRequest {
  return {
    dateOfBirth: f.dob,
    gender: f.gender as BasicSectionRequest['gender'],
    maritalStatus: f.maritalStatus as BasicSectionRequest['maritalStatus'],
    motherTongue: str(f.motherTongue),
    aboutMe: str(f.aboutMe),
  }
}
function religiousDto(f: WizardForm): ReligiousSectionRequest {
  return {
    religion: str(f.religion),
    sect: str(f.sect),
    caste: str(f.caste),
    subCaste: str(f.subCaste),
    gothram: str(f.gothram),
    manglik: (str(f.manglik) as ReligiousSectionRequest['manglik']) ?? undefined,
    canConsiderOtherReligion: f.openToOtherReligion === 'true' ? true : f.openToOtherReligion === 'false' ? false : undefined,
    canConsiderOtherCaste: f.openToOtherCaste === 'true' ? true : f.openToOtherCaste === 'false' ? false : undefined,
  }
}
function professionalDto(f: WizardForm): ProfessionalSectionRequest {
  return {
    highestEducation: str(f.education),
    educationDetail: str(f.educationDetail),
    employmentType: (str(f.employedIn) as ProfessionalSectionRequest['employmentType']) ?? undefined,
    profession: str(f.profession),
    companyName: str(f.companyName),
    annualIncome: num(f.annualIncome),
    workLocation: str(f.workLocation),
  }
}
function locationDto(f: WizardForm): LocationSectionRequest {
  return {
    currentCity: str(f.currentCity),
    currentState: str(f.currentState),
    currentCountry: str(f.currentCountry),
    nativeCity: str(f.nativeCity),
    nativeState: str(f.nativeState),
    nativeCountry: str(f.nativeCountry),
    citizenshipCountry: str(f.citizenshipCountry),
    residencyStatus: (str(f.residencyStatus) as LocationSectionRequest['residencyStatus']) ?? undefined,
  }
}
function physicalDto(f: WizardForm): PhysicalSectionRequest {
  return {
    heightCm: num(f.heightCm),
    weightKg: num(f.weightKg),
    bloodGroup: (str(f.bloodGroup) as PhysicalSectionRequest['bloodGroup']) ?? undefined,
    complexion: (str(f.complexion) as PhysicalSectionRequest['complexion']) ?? undefined,
    bodyType: (str(f.bodyType) as PhysicalSectionRequest['bodyType']) ?? undefined,
    physicalStatus: (str(f.physicalStatus) as PhysicalSectionRequest['physicalStatus']) ?? undefined,
  }
}
function familyDto(f: WizardForm): FamilySectionRequest {
  return {
    fatherStatus: (str(f.fatherStatus) as FamilySectionRequest['fatherStatus']) ?? undefined,
    fatherProfession: str(f.fatherProfession),
    motherStatus: (str(f.motherStatus) as FamilySectionRequest['motherStatus']) ?? undefined,
    motherProfession: str(f.motherProfession),
    noOfBrothers: num(f.brothers),
    brothersMarried: num(f.brothersMarried),
    noOfSisters: num(f.sisters),
    sistersMarried: num(f.sistersMarried),
    familyType: (str(f.familyType) as FamilySectionRequest['familyType']) ?? undefined,
    familyStatus: (str(f.familyValues) as FamilySectionRequest['familyStatus']) ?? undefined,
    assetDetails: str(f.assetDetails),
    nativePlace: str(f.nativeCity),
  }
}
function horoscopeDto(f: WizardForm): HoroscopeSectionRequest {
  return {
    raasi: str(f.raasi),
    nakshatra: str(f.nakshatra),
    dhosam: (str(f.dhosam) as HoroscopeSectionRequest['dhosam']) ?? undefined,
    lagnam: str(f.lagnam),
    birthTime: str(f.birthTime),
    birthCity: str(f.birthCity),
    horoscopeAvailable: f.horoscopeAvailable,
    willingToShareHoroscope: f.willingToShareHoroscope,
  }
}

/* ------------------------------- real APIs -------------------------------- */

/** Per-step save → the matching profileApi.save* endpoint. Photos/review are no-ops. */
export async function saveStep(step: StepKey, form: WizardForm): Promise<void> {
  switch (step) {
    case 'basic': await profileApi.saveBasic(basicDto(form)); break
    case 'religious': await profileApi.saveReligious(religiousDto(form)); break
    case 'professional': await profileApi.saveProfessional(professionalDto(form)); break
    case 'location': await profileApi.saveLocation(locationDto(form)); break
    case 'physical': await profileApi.savePhysical(physicalDto(form)); break
    case 'family': await profileApi.saveFamily(familyDto(form)); break
    case 'horoscope': await profileApi.saveHoroscope(horoscopeDto(form)); break
    default: break // photos handled by PhotoUploadSection; review has nothing to save
  }
}

export async function submitProfile(_form: WizardForm): Promise<void> {
  await profileApi.submitProfile()
}

/**
 * Assemble the full 7-section payload for admin-assisted registration from the
 * shared wizard form. Basic + Location are mandatory (business rule); the other
 * five sections are always sent but with all-optional fields omitted when
 * blank. Reuses the same per-section DTO mappers as the self-service saves so
 * enum values and field names stay in sync.
 */
export function buildFullProfileRequest(form: WizardForm): FullProfileRequest {
  return {
    basic: basicDto(form),
    religious: religiousDto(form),
    professional: professionalDto(form),
    location: locationDto(form),
    physical: physicalDto(form),
    family: familyDto(form),
    horoscope: horoscopeDto(form),
  }
}

/** Seed the wizard from the user's existing profile (getProfile flattened). */
export function seedFromProfile(p: UserProfile): WizardForm {
  return {
    ...emptyForm,
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    dob: p.dateOfBirth ?? '',
    gender: p.gender ?? '',
    maritalStatus: p.maritalStatus ?? '',
    motherTongue: p.motherTongue ?? '',
    religion: p.religion ?? '',
    sect: p.sect ?? '',
    caste: p.caste ?? '',
    subCaste: p.subCaste ?? '',
    gothram: p.gothram ?? '',
    manglik: p.manglik ?? '',
    openToOtherReligion: p.canConsiderOtherReligion === true ? 'true' : p.canConsiderOtherReligion === false ? 'false' : '',
    openToOtherCaste: p.canConsiderOtherCaste === true ? 'true' : p.canConsiderOtherCaste === false ? 'false' : '',
    education: p.highestEducation ?? '',
    educationDetail: p.educationDetail ?? '',
    profession: p.profession ?? '',
    employedIn: p.employmentType ?? '',
    annualIncome: p.annualIncome != null ? String(p.annualIncome) : '',
    companyName: p.companyName ?? '',
    workLocation: p.workLocation ?? '',
    nativeCountry: p.nativeCountry ?? '',
    nativeState: p.nativeState ?? '',
    nativeCity: p.nativeCity ?? '',
    currentSameAsNative: false,
    currentCountry: p.currentCountry ?? '',
    currentState: p.currentState ?? '',
    currentCity: p.currentCity ?? '',
    citizenshipCountry: p.citizenshipCountry ?? '',
    residencyStatus: p.residencyStatus ?? '',
    heightCm: p.heightCm != null ? String(p.heightCm) : '',
    weightKg: p.weightKg != null ? String(p.weightKg) : '',
    bloodGroup: p.bloodGroup ?? '',
    complexion: p.complexion ?? '',
    physicalStatus: p.physicalStatus ?? '',
    bodyType: p.bodyType ?? '',
    familyType: p.familyType ?? '',
    familyValues: p.familyStatus ?? '',
    fatherStatus: p.fatherStatus ?? '',
    fatherProfession: p.fatherProfession ?? '',
    motherStatus: p.motherStatus ?? '',
    motherProfession: p.motherProfession ?? '',
    brothers: p.noOfBrothers != null ? String(p.noOfBrothers) : '',
    brothersMarried: p.brothersMarried != null ? String(p.brothersMarried) : '',
    sisters: p.noOfSisters != null ? String(p.noOfSisters) : '',
    sistersMarried: p.sistersMarried != null ? String(p.sistersMarried) : '',
    assetDetails: p.assetDetails ?? '',
    birthTime: p.birthTime ?? '',
    birthCity: p.birthCity ?? '',
    nakshatra: p.nakshatra ?? '',
    padam: '',
    raasi: p.raasi ?? '',
    dhosam: p.dhosam ?? '',
    lagnam: p.lagnam ?? '',
    horoscopeAvailable: p.horoscopeAvailable ?? false,
    willingToShareHoroscope: p.willingToShareHoroscope ?? false,
    aboutMe: p.aboutMe ?? '',
  }
}
