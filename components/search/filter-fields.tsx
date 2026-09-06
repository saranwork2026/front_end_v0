'use client'

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
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const
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
  const casteList = value.religion ? getCasteOptions(value.religion) : []

  return (
    <div className="space-y-6">
      <Group title="Basics">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min age"
            type="number"
            inputMode="numeric"
            min={18}
            placeholder="18"
            value={value.minAge ?? ''}
            onChange={(e) => onChange({ minAge: toNum(e.target.value) })}
          />
          <Input
            label="Max age"
            type="number"
            inputMode="numeric"
            min={18}
            placeholder="60"
            value={value.maxAge ?? ''}
            onChange={(e) => onChange({ maxAge: toNum(e.target.value) })}
          />
        </div>
        <Select
          label="Gender"
          value={value.gender ?? ''}
          onChange={(e) => onChange({ gender: (e.target.value || undefined) as SearchFilters['gender'] })}
        >
          <option value="">Any</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Select
          label="Marital status"
          value={value.maritalStatus ?? ''}
          onChange={(e) =>
            onChange({ maritalStatus: (e.target.value || undefined) as SearchFilters['maritalStatus'] })
          }
        >
          <option value="">Any</option>
          {MARITAL_STATUSES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Select
          label="Mother tongue"
          value={value.motherTongue ?? ''}
          onChange={(e) => onChange({ motherTongue: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {MOTHER_TONGUES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Group>

      <Group title="Community">
        <Select
          label="Religion"
          value={value.religion ?? ''}
          onChange={(e) => onChange({ religion: e.target.value || undefined, caste: undefined })}
        >
          <option value="">Any</option>
          {RELIGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          label="Caste / Community"
          value={value.caste ?? ''}
          disabled={!value.religion}
          onChange={(e) => onChange({ caste: e.target.value || undefined })}
        >
          <option value="">{value.religion ? 'Any' : 'Select religion first'}</option>
          {casteList.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          label="Manglik / Dhosam"
          value={value.manglik ?? ''}
          onChange={(e) => onChange({ manglik: (e.target.value || undefined) as SearchFilters['manglik'] })}
        >
          <option value="">Any</option>
          {MANGLIK.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Group>

      <Group title="Location">
        <Select
          label="Country"
          value={value.country ?? ''}
          onChange={(e) => onChange({ country: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          label="State"
          value={value.state ?? ''}
          onChange={(e) => onChange({ state: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {INDIAN_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Input
          label="City"
          placeholder="e.g. Chennai"
          value={value.city ?? ''}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
        />
      </Group>

      <Group title="Education & career">
        <Select
          label="Education"
          value={value.education ?? ''}
          onChange={(e) => onChange({ education: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {HIGHEST_EDUCATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          label="Profession"
          placeholder="e.g. Engineer"
          value={value.profession ?? ''}
          onChange={(e) => onChange({ profession: e.target.value || undefined })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min income (₹)"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={value.minAnnualIncome ?? ''}
            onChange={(e) => onChange({ minAnnualIncome: toNum(e.target.value) })}
          />
          <Input
            label="Max income (₹)"
            type="number"
            inputMode="numeric"
            placeholder="5000000"
            value={value.maxAnnualIncome ?? ''}
            onChange={(e) => onChange({ maxAnnualIncome: toNum(e.target.value) })}
          />
        </div>
      </Group>

      <Group title="Height">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min height (cm)"
            type="number"
            inputMode="numeric"
            min={120}
            placeholder="150"
            value={value.minHeightCm ?? ''}
            onChange={(e) => onChange({ minHeightCm: toNum(e.target.value) })}
          />
          <Input
            label="Max height (cm)"
            type="number"
            inputMode="numeric"
            max={220}
            placeholder="190"
            value={value.maxHeightCm ?? ''}
            onChange={(e) => onChange({ maxHeightCm: toNum(e.target.value) })}
          />
        </div>
      </Group>

      <Group title="Horoscope">
        <Select
          label="Nakshatra"
          value={value.nakshatra ?? ''}
          onChange={(e) => onChange({ nakshatra: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {NAKSHATRA_OPTIONS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </Select>
        <Select
          label="Raasi"
          value={value.raasi ?? ''}
          onChange={(e) => onChange({ raasi: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {RAASI_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          label="Dhosam"
          value={value.dhosam ?? ''}
          onChange={(e) => onChange({ dhosam: e.target.value || undefined })}
        >
          <option value="">Any</option>
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
