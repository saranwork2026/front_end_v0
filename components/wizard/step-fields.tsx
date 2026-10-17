'use client'

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { profileApi } from '@/src/lib/api'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { HoroscopePhotoManager } from '@/components/photos/horoscope-photo-manager'
import { HoroscopeChartPanel } from '@/components/horoscope/horoscope-chart-panel'
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
  birthOrderOptions,
  tamilYearOptions,
  tamilMonthOptions,
  tamilDateOptions,
  kilamaiOptions,
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
import { districtsForState, hasDistrictsForState, districtTamilLabel } from '@/src/data/indianDistrictsData'
import { getRaasiForNakshatraPadham } from '@/src/data/horoscopeData'
import { COURSE_OPTIONS } from '@/src/data/courseOptions'
import { optionLabel } from '@/src/i18n/optionLabel'
import type { TFunction } from 'i18next'

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

/**
 * Render a localized <option> list. Only the DISPLAYED label switches with
 * language — the option `value` stays the exact English string the backend
 * stores (NFR-1). `ns` selects the `options.<ns>` locale sub-object; `sub` is
 * the optional second level for caste (keyed by religion).
 */
function optionList(
  t: TFunction,
  ns: string,
  values: readonly { value: string; label: string }[],
  sub?: string,
) {
  return values.map((o) => (
    <option key={o.value} value={o.value}>
      {optionLabel(t, ns, o.value, o.label, sub)}
    </option>
  ))
}

/** Localize an option array for SearchableSelect (keeps `value`, swaps label). */
function localizedOptions(
  t: TFunction,
  ns: string,
  values: readonly { value: string; label: string }[],
  sub?: string,
): { value: string; label: string }[] {
  return values.map((o) => ({ value: o.value, label: optionLabel(t, ns, o.value, o.label, sub) }))
}

/**
 * Language-aware district options for SearchableSelect. District names are a
 * controlled vocabulary like state/city, so they are NOT authored in the i18n
 * `options.*` table (see optionLabel.ts); their Tamil display comes from the
 * DISTRICT_TA map (districtTamilLabel) instead — authoritative for the 38 Tamil
 * Nadu districts, English fallback elsewhere. Keeps the stored `value` English,
 * swaps only the DISPLAYED label when the active language is Tamil — the same
 * value-stays / label-switches contract as localizedOptions.
 */
function localizedDistrictOptions(
  lang: string,
  values: readonly { value: string; label: string }[],
): { value: string; label: string }[] {
  if (!lang || !lang.startsWith('ta')) return values.map((o) => ({ ...o }))
  return values.map((o) => ({ value: o.value, label: districtTamilLabel(o.value) }))
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

/**
 * Invisible helper that auto-derives the Tamil-calendar dropdowns from the
 * member's date of birth (the Tamil calendar is solar, so the date alone is
 * enough — no birth time/place needed). It pre-fills ONLY the fields that are
 * still empty, so a member's own selection or edit is never overwritten
 * (override wins). Re-runs when the DOB changes; fails silently so manual entry
 * always works even if the endpoint is unavailable. Rendered inside the
 * Horoscope step, so its hook runs unconditionally within this component.
 */
function TamilCalendarPrefill({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (patch: Partial<WizardForm>) => void
}) {
  const lastDob = useRef<string | null>(null)

  useEffect(() => {
    const dob = form.dob
    if (!dob || dob === lastDob.current) return
    lastDob.current = dob

    let cancelled = false
    profileApi
      .getTamilCalendar(dob)
      .then((res) => {
        if (cancelled) return
        const s = res.data
        // Only fill fields the member hasn't already set (override wins).
        const patch: Partial<WizardForm> = {}
        if (!form.tamilYear && s.tamilYear) patch.tamilYear = s.tamilYear
        if (!form.tamilMonth && s.tamilMonth) patch.tamilMonth = s.tamilMonth
        if (!form.tamilDate && s.tamilDate) patch.tamilDate = s.tamilDate
        if (!form.kilamai && s.kilamai) patch.kilamai = s.kilamai
        if (Object.keys(patch).length > 0) onChange(patch)
      })
      .catch(() => {
        // Non-fatal — manual dropdown entry still works.
      })

    return () => {
      cancelled = true
    }
    // Intentionally keyed on DOB only; we read the current field values inside
    // but do not want edits to those fields to re-trigger a fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dob])

  return null
}

export function StepFields({ step, form, errors, onChange, hideHoroscopeUpload }: StepFieldsProps) {
  const { t, i18n } = useTranslation()
  switch (step) {
    case 'basic':
      return (
        <FieldGrid>
          <Input
            label={t('wizard.fields.firstName')}
            value={form.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            autoComplete="given-name"
          />
          <Input
            label={t('wizard.fields.lastName')}
            value={form.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            autoComplete="family-name"
          />
          <DateOfBirthPicker
            label={t('wizard.fields.dob')}
            value={form.dob}
            error={errors.dob}
            onChange={(dob) => onChange({ dob })}
          />
          <Select
            label={t('wizard.fields.gender')}
            value={form.gender}
            error={errors.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'gender', genderOptions)}
          </Select>
          <Select
            label={t('wizard.fields.maritalStatus')}
            value={form.maritalStatus}
            error={errors.maritalStatus}
            onChange={(e) => onChange({ maritalStatus: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'marital', maritalOptions)}
          </Select>
          <SearchableSelect
            label={t('wizard.fields.motherTongue')}
            value={form.motherTongue}
            onChange={(motherTongue) => onChange({ motherTongue })}
            options={localizedOptions(t, 'motherTongue', motherTongueOptions)}
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
              label={t('wizard.fields.religion')}
              value={form.religion}
              onChange={(e) =>
                onChange({ religion: e.target.value, sect: '', caste: '', gothram: '' })
              }
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'religion', religionOptions)}
            </Select>

            {showSect && sectOptions && (
              <Select
                label={t('wizard.fields.sect')}
                value={form.sect}
                onChange={(e) => onChange({ sect: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'sect', sectOptions)}
              </Select>
            )}

            {showCaste && (
              <SearchableSelect
                label={t('wizard.fields.caste')}
                value={form.caste}
                onChange={(caste) => onChange({ caste })}
                options={localizedOptions(t, 'caste', casteOptions, form.religion)}
                placeholder={t('common.search')}
              />
            )}

            {showCaste && (
              <Input
                label={t('wizard.fields.subCaste')}
                value={form.subCaste}
                onChange={(e) => onChange({ subCaste: e.target.value })}
              />
            )}

            {showGothram && (
              <SearchableSelect
                label={t('wizard.fields.gothram')}
                value={form.gothram}
                onChange={(gothram) => onChange({ gothram })}
                options={localizedOptions(t, 'gothram', GOTHRAM_OPTIONS)}
                placeholder={t('common.search')}
              />
            )}

            <Select
              label={t('wizard.fields.manglik')}
              value={form.manglik}
              onChange={(e) => onChange({ manglik: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'manglik', manglikOptions)}
            </Select>
          </FieldGrid>

          <div className="flex flex-col gap-2.5">
            <CheckboxRow
              id="open-other-religion"
              label={t('wizard.fields.openToOtherReligion')}
              hint={t('wizard.hints.openToOtherReligion')}
              checked={form.openToOtherReligion === 'true'}
              onChange={(checked) =>
                onChange({ openToOtherReligion: checked ? 'true' : 'false' })
              }
            />
            <CheckboxRow
              id="open-other-caste"
              label={t('wizard.fields.openToOtherCaste')}
              hint={t('wizard.hints.openToOtherCaste')}
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
            label={t('wizard.fields.education')}
            value={form.education}
            onChange={(e) => onChange({ education: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'education', educationOptions)}
          </Select>
          <SearchableSelect
            label={t('wizard.fields.educationDetail')}
            options={COURSE_OPTIONS}
            value={form.educationDetail}
            onChange={(educationDetail) => onChange({ educationDetail })}
            placeholder={t('common.search')}
          />
          <Input
            label={t('wizard.fields.profession')}
            value={form.profession}
            onChange={(e) => onChange({ profession: e.target.value })}
          />
          <Select
            label={t('wizard.fields.employedIn')}
            value={form.employedIn}
            onChange={(e) => onChange({ employedIn: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'employedIn', employedInOptions)}
          </Select>
          <Input
            label={t('wizard.fields.annualIncome')}
            type="number"
            inputMode="numeric"
            min={0}
            value={form.annualIncome}
            onChange={(e) => onChange({ annualIncome: e.target.value })}
          />
          <Input
            label={t('wizard.fields.companyName')}
            value={form.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            autoComplete="organization"
          />
          <Input
            label={t('wizard.fields.workLocation')}
            value={form.workLocation}
            onChange={(e) => onChange({ workLocation: e.target.value })}
          />
        </FieldGrid>
      )

    case 'location':
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.currentLocation')}</GroupLabel>
            <FieldGrid>
              <SearchableSelect
                label={t('wizard.fields.currentCountry')}
                value={form.currentCountry}
                onChange={(currentCountry) =>
                  onChange({
                    currentCountry,
                    // India convenience pre-select: fill Tamil Nadu ONLY when the
                    // state is still empty — never overwrites a chosen state, stays
                    // fully editable.
                    ...(currentCountry === 'India' && !form.currentState
                      ? { currentState: 'Tamil Nadu' }
                      : {}),
                  })
                }
                options={localizedOptions(t, 'country', COUNTRIES)}
                placeholder={t('common.search')}
              />
              {form.currentCountry === 'India' ? (
                <SearchableSelect
                  label={t('wizard.fields.currentState')}
                  value={form.currentState}
                  onChange={(currentState) =>
                    onChange({
                      currentState,
                      // Clear a now-invalid district when the state changes.
                      ...(form.currentDistrict &&
                      !districtsForState(currentState).some((d) => d.value === form.currentDistrict)
                        ? { currentDistrict: '' }
                        : {}),
                    })
                  }
                  options={INDIAN_STATES}
                  placeholder={t('common.search')}
                />
              ) : (
                <Input
                  label={t('wizard.fields.currentState')}
                  value={form.currentState}
                  onChange={(e) =>
                    onChange({
                      currentState: e.target.value,
                      ...(form.currentDistrict &&
                      !districtsForState(e.target.value).some((d) => d.value === form.currentDistrict)
                        ? { currentDistrict: '' }
                        : {}),
                    })
                  }
                />
              )}
              {hasDistrictsForState(form.currentState) ? (
                <SearchableSelect
                  label={t('wizard.fields.currentDistrict')}
                  value={form.currentDistrict}
                  onChange={(currentDistrict) => onChange({ currentDistrict })}
                  options={localizedDistrictOptions(i18n.language, districtsForState(form.currentState))}
                  placeholder={t('common.search')}
                />
              ) : (
                <Input
                  label={t('wizard.fields.currentDistrict')}
                  value={form.currentDistrict}
                  onChange={(e) => onChange({ currentDistrict: e.target.value })}
                />
              )}
              <Input
                label={t('wizard.fields.currentCity')}
                value={form.currentCity}
                error={errors.currentCity}
                onChange={(e) => onChange({ currentCity: e.target.value })}
                autoComplete="address-level2"
              />
            </FieldGrid>
          </div>

          <CheckboxRow
            id="native-same-as-current"
            label={t('wizard.fields.nativeSameAsCurrent')}
            hint={t('wizard.hints.nativeSameAsCurrent')}
            checked={form.currentSameAsNative}
            onChange={(checked) =>
              onChange(
                checked
                  ? {
                      currentSameAsNative: true,
                      nativeCountry: form.currentCountry,
                      nativeState: form.currentState,
                      nativeDistrict: form.currentDistrict,
                      nativeCity: form.currentCity,
                    }
                  : { currentSameAsNative: false },
              )
            }
          />

          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.nativeLocation')}</GroupLabel>
            <FieldGrid>
              {form.currentSameAsNative ? (
                <Input label={t('wizard.fields.nativeCountry')} value={form.nativeCountry} disabled />
              ) : (
                <SearchableSelect
                  label={t('wizard.fields.nativeCountry')}
                  value={form.nativeCountry}
                  onChange={(nativeCountry) =>
                    onChange({
                      nativeCountry,
                      ...(nativeCountry === 'India' && !form.nativeState
                        ? { nativeState: 'Tamil Nadu' }
                        : {}),
                    })
                  }
                  options={localizedOptions(t, 'country', COUNTRIES)}
                  placeholder={t('common.search')}
                />
              )}
              {form.currentSameAsNative ? (
                <Input label={t('wizard.fields.nativeState')} value={form.nativeState} disabled />
              ) : form.nativeCountry === 'India' ? (
                <SearchableSelect
                  label={t('wizard.fields.nativeState')}
                  value={form.nativeState}
                  onChange={(nativeState) =>
                    onChange({
                      nativeState,
                      ...(form.nativeDistrict &&
                      !districtsForState(nativeState).some((d) => d.value === form.nativeDistrict)
                        ? { nativeDistrict: '' }
                        : {}),
                    })
                  }
                  options={INDIAN_STATES}
                  placeholder={t('common.search')}
                />
              ) : (
                <Input
                  label={t('wizard.fields.nativeState')}
                  value={form.nativeState}
                  onChange={(e) =>
                    onChange({
                      nativeState: e.target.value,
                      ...(form.nativeDistrict &&
                      !districtsForState(e.target.value).some((d) => d.value === form.nativeDistrict)
                        ? { nativeDistrict: '' }
                        : {}),
                    })
                  }
                />
              )}
              {form.currentSameAsNative ? (
                <Input label={t('wizard.fields.nativeDistrict')} value={form.nativeDistrict} disabled />
              ) : hasDistrictsForState(form.nativeState) ? (
                <SearchableSelect
                  label={t('wizard.fields.nativeDistrict')}
                  value={form.nativeDistrict}
                  onChange={(nativeDistrict) => onChange({ nativeDistrict })}
                  options={localizedDistrictOptions(i18n.language, districtsForState(form.nativeState))}
                  placeholder={t('common.search')}
                />
              ) : (
                <Input
                  label={t('wizard.fields.nativeDistrict')}
                  value={form.nativeDistrict}
                  onChange={(e) => onChange({ nativeDistrict: e.target.value })}
                />
              )}
              <Input
                label={t('wizard.fields.nativeCity')}
                value={form.nativeCity}
                disabled={form.currentSameAsNative}
                onChange={(e) => onChange({ nativeCity: e.target.value })}
              />
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.citizenship')}</GroupLabel>
            <FieldGrid>
              <SearchableSelect
                label={t('wizard.fields.citizenshipCountry')}
                value={form.citizenshipCountry}
                onChange={(citizenshipCountry) => onChange({ citizenshipCountry })}
                options={localizedOptions(t, 'country', COUNTRIES)}
                placeholder={t('common.search')}
              />
              <Select
                label={t('wizard.fields.residencyStatus')}
                value={form.residencyStatus}
                onChange={(e) =>
                  onChange({ residencyStatus: e.target.value })
                }
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'residency', residencyStatusOptions)}
              </Select>
            </FieldGrid>
          </div>
        </div>
      )

    case 'physical':
      return (
        <FieldGrid>
          <Select
            label={t('wizard.fields.height')}
            value={form.heightCm}
            onChange={(e) => onChange({ heightCm: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {heightOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label={t('wizard.fields.weight')}
            value={form.weightKg}
            onChange={(e) => onChange({ weightKg: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {weightOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label={t('wizard.fields.bloodGroup')}
            value={form.bloodGroup}
            onChange={(e) => onChange({ bloodGroup: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'bloodGroup', bloodGroupOptions)}
          </Select>
          <Select
            label={t('wizard.fields.complexion')}
            value={form.complexion}
            onChange={(e) => onChange({ complexion: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'complexion', complexionOptions)}
          </Select>
          <Select
            label={t('wizard.fields.physicalStatus')}
            value={form.physicalStatus}
            onChange={(e) => onChange({ physicalStatus: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'physicalStatus', physicalStatusOptions)}
          </Select>
          <Select
            label={t('wizard.fields.bodyType')}
            value={form.bodyType}
            onChange={(e) => onChange({ bodyType: e.target.value })}
          >
            <option value="">{t('common.select')}</option>
            {optionList(t, 'bodyType', bodyTypeOptions)}
          </Select>
        </FieldGrid>
      )

    case 'family':
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.family')}</GroupLabel>
            <FieldGrid>
              <Select
                label={t('wizard.fields.familyType')}
                value={form.familyType}
                onChange={(e) => onChange({ familyType: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'familyType', familyTypeOptions)}
              </Select>
              <Select
                label={t('wizard.fields.familyValues')}
                value={form.familyValues}
                onChange={(e) => onChange({ familyValues: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'familyValues', familyValuesOptions)}
              </Select>
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.parents')}</GroupLabel>
            <FieldGrid>
              <Select
                label={t('wizard.fields.fatherStatus')}
                value={form.fatherStatus}
                onChange={(e) => {
                  const fatherStatus = e.target.value
                  // Clear any stale profession when it no longer applies.
                  onChange(
                    fatherStatus === 'HOMEMAKER' || fatherStatus === 'PASSED_AWAY'
                      ? { fatherStatus, fatherProfession: '' }
                      : { fatherStatus },
                  )
                }}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'parentStatus', parentStatusOptions)}
              </Select>
              {/* Profession is meaningless for a homemaker — hide it when the
                  status is HOMEMAKER (also PASSED_AWAY has no current job). */}
              {form.fatherStatus !== 'HOMEMAKER' && form.fatherStatus !== 'PASSED_AWAY' && (
                <Input
                  label={t('wizard.fields.fatherProfession')}
                  value={form.fatherProfession}
                  onChange={(e) =>
                    onChange({ fatherProfession: e.target.value })
                  }
                />
              )}
              <Select
                label={t('wizard.fields.motherStatus')}
                value={form.motherStatus}
                onChange={(e) => {
                  const motherStatus = e.target.value
                  onChange(
                    motherStatus === 'HOMEMAKER' || motherStatus === 'PASSED_AWAY'
                      ? { motherStatus, motherProfession: '' }
                      : { motherStatus },
                  )
                }}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'parentStatus', parentStatusOptions)}
              </Select>
              {form.motherStatus !== 'HOMEMAKER' && form.motherStatus !== 'PASSED_AWAY' && (
                <Input
                  label={t('wizard.fields.motherProfession')}
                  value={form.motherProfession}
                  onChange={(e) =>
                    onChange({ motherProfession: e.target.value })
                  }
                />
              )}
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <GroupLabel>{t('wizard.groups.siblings')}</GroupLabel>
            <FieldGrid>
              <Select
                label={t('wizard.fields.brothers')}
                value={form.brothers}
                onChange={(e) => onChange({ brothers: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'siblingCount', siblingCountOptions)}
              </Select>
              <Select
                label={t('wizard.fields.brothersMarried')}
                value={form.brothersMarried}
                onChange={(e) =>
                  onChange({ brothersMarried: e.target.value })
                }
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'siblingCount', siblingCountOptions)}
              </Select>
              <Select
                label={t('wizard.fields.sisters')}
                value={form.sisters}
                onChange={(e) => onChange({ sisters: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'siblingCount', siblingCountOptions)}
              </Select>
              <Select
                label={t('wizard.fields.sistersMarried')}
                value={form.sistersMarried}
                onChange={(e) =>
                  onChange({ sistersMarried: e.target.value })
                }
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'siblingCount', siblingCountOptions)}
              </Select>
              <Select
                label={t('wizard.fields.birthOrder')}
                value={form.birthOrder}
                onChange={(e) => onChange({ birthOrder: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {optionList(t, 'birthOrder', birthOrderOptions)}
              </Select>
            </FieldGrid>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="asset-details"
                className="text-sm font-medium text-foreground"
              >
                {t('wizard.fields.assetDetails')}
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
            <CheckboxRow
              id="own-house"
              label="Own house"
              hint="The family owns their house (சொந்த வீடு)."
              checked={form.ownHouse}
              onChange={(ownHouse) => onChange({ ownHouse })}
            />
          </div>
        </div>
      )

    case 'horoscope':
      return (
        <div className="flex flex-col gap-5">
          <TamilCalendarPrefill form={form} onChange={onChange} />
          <FieldGrid>
            <Input
              label={t('wizard.fields.birthTime')}
              type="time"
              value={form.birthTime}
              onChange={(e) => onChange({ birthTime: e.target.value })}
            />
            <Input
              label={t('wizard.fields.birthCity')}
              value={form.birthCity}
              onChange={(e) => onChange({ birthCity: e.target.value })}
            />
            <Select
              label={t('wizard.fields.nakshatra')}
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
              <option value="">{t('common.select')}</option>
              {optionList(t, 'nakshatra', nakshatraOptions)}
            </Select>
            <Select
              label={t('wizard.fields.padam')}
              value={form.padam}
              onChange={(e) => {
                const padam = e.target.value
                const derived = form.nakshatra
                  ? getRaasiForNakshatraPadham(form.nakshatra, Number(padam))
                  : null
                onChange(derived ? { padam, raasi: derived } : { padam })
              }}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'padham', padamOptions)}
            </Select>
            <Select
              label={t('wizard.fields.raasi')}
              value={form.raasi}
              onChange={(e) => onChange({ raasi: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'raasi', raasiOptions)}
            </Select>
            <Select
              label={t('wizard.fields.dhosam')}
              value={form.dhosam}
              onChange={(e) => onChange({ dhosam: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'dhosam', dhosamOptions)}
            </Select>
            <Input
              label={t('wizard.fields.lagnam')}
              value={form.lagnam}
              onChange={(e) => onChange({ lagnam: e.target.value })}
            />
            <Select
              label={t('wizard.fields.tamilYear')}
              value={form.tamilYear}
              onChange={(e) => onChange({ tamilYear: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'tamilYear', tamilYearOptions)}
            </Select>
            <Select
              label={t('wizard.fields.tamilMonth')}
              value={form.tamilMonth}
              onChange={(e) => onChange({ tamilMonth: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'tamilMonth', tamilMonthOptions)}
            </Select>
            <Select
              label={t('wizard.fields.tamilDate')}
              value={form.tamilDate}
              onChange={(e) => onChange({ tamilDate: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'tamilDate', tamilDateOptions)}
            </Select>
            <Select
              label={t('wizard.fields.kilamai')}
              value={form.kilamai}
              onChange={(e) => onChange({ kilamai: e.target.value })}
            >
              <option value="">{t('common.select')}</option>
              {optionList(t, 'kilamai', kilamaiOptions)}
            </Select>
          </FieldGrid>

          <div className="flex flex-col gap-2.5">
            <CheckboxRow
              id="horoscope-available"
              label={t('wizard.fields.horoscopeAvailable')}
              hint={t('wizard.hints.horoscopeAvailable')}
              checked={form.horoscopeAvailable}
              onChange={(horoscopeAvailable) =>
                onChange({ horoscopeAvailable })
              }
            />
            <CheckboxRow
              id="willing-share-horoscope"
              label={t('wizard.fields.willingToShareHoroscope')}
              hint={t('wizard.hints.willingToShareHoroscope')}
              checked={form.willingToShareHoroscope}
              onChange={(willingToShareHoroscope) =>
                onChange({ willingToShareHoroscope })
              }
            />
          </div>

          {form.horoscopeAvailable && !hideHoroscopeUpload && <HoroscopePhotoManager />}

          {/* Digital chart generation — user-scoped (hidden in admin-assisted,
              same rationale as the photo uploader). */}
          {!hideHoroscopeUpload && <HoroscopeChartPanel form={form} onChange={onChange} />}

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


