'use client'

import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { HoroscopePhotoManager } from '@/components/photos/horoscope-photo-manager'
import {
  bloodGroupOptions,
  bodyTypeOptions,
  complexionOptions,
  dhosamOptions,
  educationOptions,
  employedInOptions,
  familyTypeOptions,
  familyValuesOptions,
  genderOptions,
  heightOptions,
  manglikOptions,
  maritalOptions,
  motherTongueOptions,
  nakshatraOptions,
  padamOptions,
  parentStatusOptions,
  physicalStatusOptions,
  raasiOptions,
  religionOptions,
  residencyStatusOptions,
  siblingCountOptions,
  weightOptions,
  type FieldErrors,
  type StepKey,
  type WizardForm,
} from '@/lib/wizard-data'
import {
  SECTS_BY_RELIGION,
  getCasteOptions,
  hasSect,
  hasCasteField,
  hasGothramField,
  GOTHRAM_OPTIONS,
} from '@/src/data/religionCasteData'
import { COUNTRIES } from '@/src/data/countryData'
import { INDIAN_STATES } from '@/src/data/indianStatesData'
import { getRaasiForNakshatraPadham } from '@/src/data/horoscopeData'

interface StepFieldsProps {
  step: StepKey
  form: WizardForm
  errors: FieldErrors
  onChange: (patch: Partial<WizardForm>) => void
  /**
   * Hide the horoscope-chart uploader. Set by admin-assisted registration —
   * there the admin fills a member's profile fields, and photos (which upload
   * to the CURRENT user's own account) must not appear.
   */
  hideHoroscopeUpload?: boolean
}

/** A responsive 2-column field grid (single column on mobile). */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function optionList(values: readonly { value: string; label: string }[]) {
  return values.map((o) => (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  ))
}

/** A brand-styled checkbox row used for the wizard's boolean toggles. */
function CheckboxRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </label>
  )
}

/** A section subheading used to group fields within a single step. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  )
}

export function StepFields({ step, form, errors, onChange, hideHoroscopeUpload }: StepFieldsProps) {
  switch (step) {
    case 'basic':
      return (
        <FieldGrid>
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            autoComplete="family-name"
          />
          <Input
            label="Date of birth"
            type="date"
            value={form.dob}
            error={errors.dob}
            onChange={(e) => onChange({ dob: e.target.value })}
          />
          <Select
            label="Gender"
            value={form.gender}
            error={errors.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
          >
            <option value="">Select gender</option>
            {optionList(genderOptions)}
          </Select>
          <Select
            label="Marital status"
            value={form.maritalStatus}
            error={errors.maritalStatus}
            onChange={(e) => onChange({ maritalStatus: e.target.value })}
          >
            <option value="">Select status</option>
            {optionList(maritalOptions)}
          </Select>
          <SearchableSelect
            label="Mother tongue"
            value={form.motherTongue}
            onChange={(motherTongue) => onChange({ motherTongue })}
            options={motherTongueOptions}
            placeholder="Search language"
          />
        </FieldGrid>
      )

    case 'religious': {
      // Caste / sect / gothram vocabularies are scoped to the chosen religion
      // (data/religionCasteData.ts). Changing religion resets those three so a
      // stale value from the old religion can't linger.
      const casteOptions = form.religion ? getCasteOptions(form.religion) : []
      const sectOptions = form.religion ? SECTS_BY_RELIGION[form.religion] : undefined
      const showSect = Boolean(form.religion) && hasSect(form.religion) && Boolean(sectOptions)
      const showCaste = Boolean(form.religion) && hasCasteField(form.religion)
      const showGothram = Boolean(form.religion) && hasGothramField(form.religion)
      return (
        <div className="flex flex-col gap-5">
          <FieldGrid>
            <Select
              label="Religion"
              value={form.religion}
              onChange={(e) =>
                onChange({ religion: e.target.value, sect: '', caste: '', gothram: '' })
              }
            >
              <option value="">Select religion</option>
              {optionList(religionOptions)}
            </Select>

            {showSect && sectOptions && (
              <Select
                label="Sect"
                value={form.sect}
                onChange={(e) => onChange({ sect: e.target.value })}
              >
                <option value="">Select sect</option>
                {optionList(sectOptions)}
              </Select>
            )}

            {showCaste && (
              <SearchableSelect
                label="Caste / community"
                value={form.caste}
                onChange={(caste) => onChange({ caste })}
                options={casteOptions}
                placeholder="Search caste / community"
              />
            )}

            {showCaste && (
              <Input
                label="Sub caste"
                value={form.subCaste}
                onChange={(e) => onChange({ subCaste: e.target.value })}
              />
            )}

            {showGothram && (
              <SearchableSelect
                label="Gothram"
                value={form.gothram}
                onChange={(gothram) => onChange({ gothram })}
                options={GOTHRAM_OPTIONS}
                placeholder="Search gothram"
              />
            )}

            <Select
              label="Manglik / Dhosam"
              value={form.manglik}
              onChange={(e) => onChange({ manglik: e.target.value })}
            >
              <option value="">Select</option>
              {optionList(manglikOptions)}
            </Select>
          </FieldGrid>

          <div className="flex flex-col gap-2.5">
            <CheckboxRow
              id="open-other-religion"
              label="Open to other religion"
              hint="Show me matches from other religions too."
              checked={form.openToOtherReligion === 'true'}
              onChange={(checked) =>
                onChange({ openToOtherReligion: checked ? 'true' : 'false' })
              }
            />
            <CheckboxRow
              id="open-other-caste"
              label="Open to other caste"
              hint="Show me matches from other castes / communities too."
              checked={form.openToOtherCaste === 'true'}
              onChange={(checked) =>
                onChange({ openToOtherCaste: checked ? 'true' : 'false' })
              }
            />
          </div>
        </div>
      )
    }

    case 'professional':
      return (
        <FieldGrid>
          <Select
            label="Highest education"
            value={form.education}
            onChange={(e) => onChange({ education: e.target.value })}
          >
            <option value="">Select education</option>
            {educationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Education detail"
            value={form.educationDetail}
            onChange={(e) => onChange({ educationDetail: e.target.value })}
            placeholder="e.g. B.E. Computer Science, Anna University"
          />
          <Input
            label="Profession"
            value={form.profession}
            onChange={(e) => onChange({ profession: e.target.value })}
          />
          <Select
            label="Employed in"
            value={form.employedIn}
            onChange={(e) => onChange({ employedIn: e.target.value })}
          >
            <option value="">Select</option>
            {optionList(employedInOptions)}
          </Select>
          <Input
            label="Annual income (LPA)"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.annualIncome}
            onChange={(e) => onChange({ annualIncome: e.target.value })}
          />
          <Input
            label="Company name"
            value={form.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            autoComplete="organization"
          />
          <Input
            label="Work location"
            value={form.workLocation}
            onChange={(e) => onChange({ workLocation: e.target.value })}
          />
        </FieldGrid>
      )

    case 'location':
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <GroupLabel>Current location</GroupLabel>
            <FieldGrid>
              <SearchableSelect
                label="Current country"
                value={form.currentCountry}
                onChange={(currentCountry) => onChange({ currentCountry })}
                options={COUNTRIES}
                placeholder="Search country"
              />
              {form.currentCountry === 'India' ? (
                <SearchableSelect
                  label="Current state"
                  value={form.currentState}
                  onChange={(currentState) => onChange({ currentState })}
                  options={INDIAN_STATES}
                  placeholder="Search state"
                />
              ) : (
                <Input
                  label="Current state"
                  value={form.currentState}
                  onChange={(e) => onChange({ currentState: e.target.value })}
                />
              )}
              <Input
                label="Current city"
                value={form.currentCity}
                error={errors.currentCity}
                onChange={(e) => onChange({ currentCity: e.target.value })}
                autoComplete="address-level2"
              />
            </FieldGrid>
          </div>

          <CheckboxRow
            id="native-same-as-current"
            label="Native place same as current"
            hint="Copies your current location into the native-place fields."
            checked={form.currentSameAsNative}
            onChange={(checked) =>
              onChange(
                checked
                  ? {
                      currentSameAsNative: true,
                      nativeCountry: form.currentCountry,
                      nativeState: form.currentState,
                      nativeCity: form.currentCity,
                    }
                  : { currentSameAsNative: false },
              )
            }
          />

          <div className="flex flex-col gap-3">
            <GroupLabel>Native place</GroupLabel>
            <FieldGrid>
              {form.currentSameAsNative ? (
                <Input label="Native country" value={form.nativeCountry} disabled />
              ) : (
                <SearchableSelect
                  label="Native country"
                  value={form.nativeCountry}
                  onChange={(nativeCountry) => onChange({ nativeCountry })}
                  options={COUNTRIES}
                  placeholder="Search country"
                />
              )}
              {form.currentSameAsNative ? (
                <Input label="Native state" value={form.nativeState} disabled />
              ) : form.nativeCountry === 'India' ? (
                <SearchableSelect
                  label="Native state"
                  value={form.nativeState}
                  onChange={(nativeState) => onChange({ nativeState })}
                  options={INDIAN_STATES}
                  placeholder="Search state"
                />
              ) : (
                <Input
                  label="Native state"
                  value={form.nativeState}
                  onChange={(e) => onChange({ nativeState: e.target.value })}
                />
              )}
              <Input
                label="Native city"
                value={form.nativeCity}
                disabled={form.currentSameAsNative}
                onChange={(e) => onChange({ nativeCity: e.target.value })}
              />
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>Citizenship & residency</GroupLabel>
            <FieldGrid>
              <SearchableSelect
                label="Citizenship country"
                value={form.citizenshipCountry}
                onChange={(citizenshipCountry) => onChange({ citizenshipCountry })}
                options={COUNTRIES}
                placeholder="Search country"
              />
              <Select
                label="Residency status"
                value={form.residencyStatus}
                onChange={(e) =>
                  onChange({ residencyStatus: e.target.value })
                }
              >
                <option value="">Select</option>
                {optionList(residencyStatusOptions)}
              </Select>
            </FieldGrid>
          </div>
        </div>
      )

    case 'physical':
      return (
        <FieldGrid>
          <Select
            label="Height"
            value={form.heightCm}
            onChange={(e) => onChange({ heightCm: e.target.value })}
          >
            <option value="">Select height</option>
            {heightOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Weight (kg)"
            value={form.weightKg}
            onChange={(e) => onChange({ weightKg: e.target.value })}
          >
            <option value="">Select weight</option>
            {weightOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Blood group"
            value={form.bloodGroup}
            onChange={(e) => onChange({ bloodGroup: e.target.value })}
          >
            <option value="">Select</option>
            {optionList(bloodGroupOptions)}
          </Select>
          <Select
            label="Complexion"
            value={form.complexion}
            onChange={(e) => onChange({ complexion: e.target.value })}
          >
            <option value="">Select</option>
            {optionList(complexionOptions)}
          </Select>
          <Select
            label="Physical status"
            value={form.physicalStatus}
            onChange={(e) => onChange({ physicalStatus: e.target.value })}
          >
            <option value="">Select</option>
            {optionList(physicalStatusOptions)}
          </Select>
          <Select
            label="Body type"
            value={form.bodyType}
            onChange={(e) => onChange({ bodyType: e.target.value })}
          >
            <option value="">Select</option>
            {optionList(bodyTypeOptions)}
          </Select>
        </FieldGrid>
      )

    case 'family':
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <GroupLabel>Family</GroupLabel>
            <FieldGrid>
              <Select
                label="Family type"
                value={form.familyType}
                onChange={(e) => onChange({ familyType: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(familyTypeOptions)}
              </Select>
              <Select
                label="Family values"
                value={form.familyValues}
                onChange={(e) => onChange({ familyValues: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(familyValuesOptions)}
              </Select>
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>Parents</GroupLabel>
            <FieldGrid>
              <Select
                label="Father's status"
                value={form.fatherStatus}
                onChange={(e) => onChange({ fatherStatus: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(parentStatusOptions)}
              </Select>
              <Input
                label="Father's profession"
                value={form.fatherProfession}
                onChange={(e) =>
                  onChange({ fatherProfession: e.target.value })
                }
              />
              <Select
                label="Mother's status"
                value={form.motherStatus}
                onChange={(e) => onChange({ motherStatus: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(parentStatusOptions)}
              </Select>
              <Input
                label="Mother's profession"
                value={form.motherProfession}
                onChange={(e) =>
                  onChange({ motherProfession: e.target.value })
                }
              />
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>Siblings</GroupLabel>
            <FieldGrid>
              <Select
                label="Number of brothers"
                value={form.brothers}
                onChange={(e) => onChange({ brothers: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(siblingCountOptions)}
              </Select>
              <Select
                label="Brothers married"
                value={form.brothersMarried}
                onChange={(e) =>
                  onChange({ brothersMarried: e.target.value })
                }
              >
                <option value="">Select</option>
                {optionList(siblingCountOptions)}
              </Select>
              <Select
                label="Number of sisters"
                value={form.sisters}
                onChange={(e) => onChange({ sisters: e.target.value })}
              >
                <option value="">Select</option>
                {optionList(siblingCountOptions)}
              </Select>
              <Select
                label="Sisters married"
                value={form.sistersMarried}
                onChange={(e) =>
                  onChange({ sistersMarried: e.target.value })
                }
              >
                <option value="">Select</option>
                {optionList(siblingCountOptions)}
              </Select>
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="asset-details"
              className="text-sm font-medium text-foreground"
            >
              Asset details
            </label>
            <textarea
              id="asset-details"
              rows={3}
              value={form.assetDetails}
              onChange={(e) => onChange({ assetDetails: e.target.value })}
              placeholder="Property, investments or other family assets (optional)."
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
      )

    case 'horoscope':
      return (
        <div className="flex flex-col gap-5">
          <FieldGrid>
            <Input
              label="Birth time"
              type="time"
              value={form.birthTime}
              onChange={(e) => onChange({ birthTime: e.target.value })}
            />
            <Input
              label="Birth city"
              value={form.birthCity}
              onChange={(e) => onChange({ birthCity: e.target.value })}
            />
            <Select
              label="Nakshatra (birth star)"
              value={form.nakshatra}
              onChange={(e) => {
                const nakshatra = e.target.value
                // Derive raasi automatically once nakshatra + padam are both set.
                const derived = form.padam
                  ? getRaasiForNakshatraPadham(nakshatra, Number(form.padam))
                  : null
                onChange(derived ? { nakshatra, raasi: derived } : { nakshatra })
              }}
            >
              <option value="">Select nakshatra</option>
              {optionList(nakshatraOptions)}
            </Select>
            <Select
              label="Padam (Pada)"
              value={form.padam}
              onChange={(e) => {
                const padam = e.target.value
                const derived = form.nakshatra
                  ? getRaasiForNakshatraPadham(form.nakshatra, Number(padam))
                  : null
                onChange(derived ? { padam, raasi: derived } : { padam })
              }}
            >
              <option value="">Select padam</option>
              {padamOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              label="Raasi (moon sign)"
              value={form.raasi}
              onChange={(e) => onChange({ raasi: e.target.value })}
            >
              <option value="">Select raasi (auto-filled from nakshatra + padam)</option>
              {optionList(raasiOptions)}
            </Select>
            <Select
              label="Dhosam"
              value={form.dhosam}
              onChange={(e) => onChange({ dhosam: e.target.value })}
            >
              <option value="">Select</option>
              {optionList(dhosamOptions)}
            </Select>
            <Input
              label="Lagnam (ascendant)"
              value={form.lagnam}
              onChange={(e) => onChange({ lagnam: e.target.value })}
            />
          </FieldGrid>

          <div className="flex flex-col gap-2.5">
            <CheckboxRow
              id="horoscope-available"
              label="Horoscope available"
              hint="I have my horoscope / jathagam ready to share."
              checked={form.horoscopeAvailable}
              onChange={(horoscopeAvailable) =>
                onChange({ horoscopeAvailable })
              }
            />
            <CheckboxRow
              id="willing-share-horoscope"
              label="Willing to share horoscope"
              hint="Allow connected members to view your horoscope."
              checked={form.willingToShareHoroscope}
              onChange={(willingToShareHoroscope) =>
                onChange({ willingToShareHoroscope })
              }
            />
          </div>

          {form.horoscopeAvailable && !hideHoroscopeUpload && <HoroscopePhotoManager />}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="about-me"
              className="text-sm font-medium text-foreground"
            >
              About me
            </label>
            <textarea
              id="about-me"
              rows={4}
              value={form.aboutMe}
              onChange={(e) => onChange({ aboutMe: e.target.value })}
              placeholder="Share a little about yourself and what you're looking for."
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}


