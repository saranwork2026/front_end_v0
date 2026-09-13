'use client'

import { useTranslation } from 'react-i18next'
import type { SearchFilters } from '@matrimony/shared-core'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RELIGIONS, MOTHER_TONGUES, getCasteOptions } from '@/src/data/religionCasteData'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import { COUNTRIES } from '@/src/data/countryData'
import { INDIAN_STATES } from '@/src/data/indianStatesData'
import { NAKSHATRA_OPTIONS, RAASI_OPTIONS } from '@/src/data/horoscopeData'

interface FilterFieldsProps {
  value: SearchFilters
  onChange: (patch: Partial<SearchFilters>) => void
}

// Backend enum option lists (values match the backend enums exactly).
// Gender is intentionally NOT a filter: the backend already enforces
// opposite-gender matching server-side, so exposing it here is redundant.
const MARITAL_STATUSES = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
] as const
const MANGLIK = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'DONT_KNOW', label: "Don't Know" },
] as const
const DHOSAMS = [
  { value: 'NONE', label: 'None' },
  { value: 'SEVVAI', label: 'Sevvai (Chevvai)' },
  { value: 'RAHU', label: 'Rahu' },
  { value: 'KETHU', label: 'Kethu' },
  { value: 'SHANI', label: 'Shani' },
  { value: 'KALATHRA', label: 'Kalathra' },
] as const

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

const toNum = (v: string) => (v === '' ? undefined : Number(v))

/**
 * The single source of filter inputs, rendered identically in the desktop rail
 * and the mobile bottom sheet (spec §9 — do not fork). Option lists come from
 * the shared src/data/* files so filter values always match the values stored
 * on profiles (same lists the wizard/edit/partner-preferences use). Filters
 * are the real shared-core SearchFilters shape.
 */
export function FilterFields({ value, onChange }: FilterFieldsProps) {
  const { t } = useTranslation()
  const casteList = value.religion ? getCasteOptions(value.religion) : []

  return (
    <div className="space-y-6">
      <Group title={t('page.search.groupBasics')}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('page.search.minAge')}
            type="number"
            inputMode="numeric"
            min={18}
            placeholder="18"
            value={value.minAge ?? ''}
            onChange={(e) => onChange({ minAge: toNum(e.target.value) })}
          />
          <Input
            label={t('page.search.maxAge')}
            type="number"
            inputMode="numeric"
            min={18}
            placeholder="60"
            value={value.maxAge ?? ''}
            onChange={(e) => onChange({ maxAge: toNum(e.target.value) })}
          />
        </div>
        <Select
          label={t('page.search.maritalStatus')}
          value={value.maritalStatus ?? ''}
          onChange={(e) =>
            onChange({ maritalStatus: (e.target.value || undefined) as SearchFilters['maritalStatus'] })
          }
        >
          <option value="">{t('page.search.any')}</option>
          {MARITAL_STATUSES.map((m) => (
            <option key={m.value} value={m.value}>
              {t(`options.marital.${m.value}` as never, { defaultValue: m.label })}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.motherTongue')}
          value={value.motherTongue ?? ''}
          onChange={(e) => onChange({ motherTongue: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {MOTHER_TONGUES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Group>

      <Group title={t('page.search.groupCommunity')}>
        <Select
          label={t('page.search.religion')}
          value={value.religion ?? ''}
          onChange={(e) => onChange({ religion: e.target.value || undefined, caste: undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {RELIGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.caste')}
          value={value.caste ?? ''}
          disabled={!value.religion}
          onChange={(e) => onChange({ caste: e.target.value || undefined })}
        >
          <option value="">{value.religion ? t('page.search.any') : t('page.search.selectReligionFirst')}</option>
          {casteList.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.manglik')}
          value={value.manglik ?? ''}
          onChange={(e) => onChange({ manglik: (e.target.value || undefined) as SearchFilters['manglik'] })}
        >
          <option value="">{t('page.search.any')}</option>
          {MANGLIK.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Group>

      <Group title={t('page.search.groupLocation')}>
        <Select
          label={t('page.search.country')}
          value={value.country ?? ''}
          onChange={(e) => onChange({ country: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.state')}
          value={value.state ?? ''}
          onChange={(e) => onChange({ state: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {INDIAN_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Input
          label={t('page.search.city')}
          placeholder={t('page.search.cityPlaceholder')}
          value={value.city ?? ''}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
        />
      </Group>

      <Group title={t('page.search.groupEducation')}>
        <Select
          label={t('page.search.education')}
          value={value.education ?? ''}
          onChange={(e) => onChange({ education: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {HIGHEST_EDUCATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          label={t('page.search.profession')}
          placeholder={t('page.search.professionPlaceholder')}
          value={value.profession ?? ''}
          onChange={(e) => onChange({ profession: e.target.value || undefined })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('page.search.minIncome')}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={value.minAnnualIncome ?? ''}
            onChange={(e) => onChange({ minAnnualIncome: toNum(e.target.value) })}
          />
          <Input
            label={t('page.search.maxIncome')}
            type="number"
            inputMode="numeric"
            placeholder="5000000"
            value={value.maxAnnualIncome ?? ''}
            onChange={(e) => onChange({ maxAnnualIncome: toNum(e.target.value) })}
          />
        </div>
      </Group>

      <Group title={t('page.search.groupHeight')}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('page.search.minHeight')}
            type="number"
            inputMode="numeric"
            min={120}
            placeholder="150"
            value={value.minHeightCm ?? ''}
            onChange={(e) => onChange({ minHeightCm: toNum(e.target.value) })}
          />
          <Input
            label={t('page.search.maxHeight')}
            type="number"
            inputMode="numeric"
            max={220}
            placeholder="190"
            value={value.maxHeightCm ?? ''}
            onChange={(e) => onChange({ maxHeightCm: toNum(e.target.value) })}
          />
        </div>
      </Group>

      <Group title={t('page.search.groupHoroscope')}>
        <Select
          label={t('page.search.nakshatra')}
          value={value.nakshatra ?? ''}
          onChange={(e) => onChange({ nakshatra: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {NAKSHATRA_OPTIONS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.raasi')}
          value={value.raasi ?? ''}
          onChange={(e) => onChange({ raasi: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {RAASI_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          label={t('page.search.dhosam')}
          value={value.dhosam ?? ''}
          onChange={(e) => onChange({ dhosam: e.target.value || undefined })}
        >
          <option value="">{t('page.search.any')}</option>
          {DHOSAMS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </Group>
    </div>
  )
}
