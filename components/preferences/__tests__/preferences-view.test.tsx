import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Real English strings so label/heading queries match on actual text.
import '@/src/i18n/config'

// Router push is asserted on save → /plans?onboarding=1.
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
}))

// Mock the API layer the data module + view call. savePartnerPreference and
// getPartnerPreference in lib/preferences-data delegate to these.
const getPartnerPreferenceMock = vi.fn()
const savePartnerPreferenceMock = vi.fn()
const getProfileMock = vi.fn()
vi.mock('@/src/lib/api', () => ({
  profileApi: {
    getPartnerPreference: () => getPartnerPreferenceMock(),
    savePartnerPreference: (data: unknown) => savePartnerPreferenceMock(data),
    getProfile: () => getProfileMock(),
  },
}))

import { PreferencesView } from '@/components/preferences/preferences-view'
import { WEIGHT_KG_OPTIONS } from '@/src/data/numericOptions'

describe('PreferencesView — single card + weight', () => {
  beforeEach(() => {
    pushMock.mockReset()
    savePartnerPreferenceMock.mockReset().mockResolvedValue({ data: {} })
    getProfileMock.mockReset().mockResolvedValue({ data: { basic: { gender: 'MALE' } } })
    // Seed with an empty-ish saved preference so load resolves deterministically.
    getPartnerPreferenceMock.mockReset().mockResolvedValue({ data: {} })
  })

  it('renders a SINGLE card — no section-title headings from the old layout', async () => {
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    // The removed section titles must be gone (they were "&"-joined).
    expect(screen.queryByText('Age & height')).toBeNull()
    expect(screen.queryByText('Income & horoscope')).toBeNull()
    expect(screen.queryByText('Marital status & mother tongue')).toBeNull()
    // No <section> section cards remain.
    expect(document.querySelectorAll('section')).toHaveLength(0)
  })

  it('renders the weight min/max selects from WEIGHT_KG_OPTIONS', async () => {
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    const min = screen.getByLabelText('Min weight (kg)') as HTMLSelectElement
    const max = screen.getByLabelText('Max weight (kg)') as HTMLSelectElement
    const values = Array.from(min.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value)
    expect(values).toContain('')
    expect(values).toContain(WEIGHT_KG_OPTIONS[0].value)
    expect(max).toBeInTheDocument()
  })

  it('submits with the chosen weight range and routes to /plans?onboarding=1', async () => {
    const user = userEvent.setup()
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    await user.selectOptions(screen.getByLabelText('Min weight (kg)'), '50')
    await user.selectOptions(screen.getByLabelText('Max weight (kg)'), '80')
    await user.click(screen.getByRole('button', { name: /save preferences/i }))

    await waitFor(() => expect(savePartnerPreferenceMock).toHaveBeenCalled())
    const dto = savePartnerPreferenceMock.mock.calls.at(-1)![0] as { minWeightKg?: number; maxWeightKg?: number }
    expect(dto.minWeightKg).toBe(50)
    expect(dto.maxWeightKg).toBe(80)
    expect(pushMock).toHaveBeenCalledWith('/plans?onboarding=1')
  })

  it('renders ALL 18 field labels in the exact specified single-card order', async () => {
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    // The full fixed field order (marital status → … → dhosam), weight at #5.
    const order = [
      'Marital status',
      'Mother tongue',
      'Age',
      'Height',
      'Weight',
      'Physical status',
      'Education',
      'Profession',
      'Income',
      'Preferred countries',
      'Preferred states',
      'Preferred cities',
      'Religion',
      'Caste / Community',
      'Nakshatra',
      'Raasi',
      'Manglik',
      'Dhosam',
    ]
    const container = document.querySelector('form')!
    const text = within(container)
    // Resolve each field's visible label SPAN (the Field header) and assert
    // each follows the previous one in document order — locking the whole
    // sequence. Some label strings can also appear elsewhere (e.g. inside a
    // native <Select> option), so match the <span> header specifically.
    const els = order.map((label) => {
      const matches = text.getAllByText(label).filter((el) => el.tagName === 'SPAN')
      expect(matches.length).toBeGreaterThan(0)
      return matches[0]
    })
    for (let i = 1; i < els.length; i += 1) {
      expect(
        els[i - 1].compareDocumentPosition(els[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    // Manglik is a standalone label — not the combined "Manglik / Dhosam".
    expect(text.queryByText('Manglik / Dhosam')).toBeNull()
  })

  it('Country renders as a searchable multi-select dropdown: open, filter, pick multiple, close, restore', async () => {
    const user = userEvent.setup()
    // Seed a saved preference so the restore path is exercised.
    getPartnerPreferenceMock.mockResolvedValue({ data: { preferredCountries: ['India'] } })
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    // Saved value restored as a chip (not an inline pill wall of every option).
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /remove india/i })).toBeInTheDocument(),
    )

    // The control is a combobox trigger (dropdown), not an always-open list.
    const trigger = screen.getByRole('combobox', { name: 'Preferred countries' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // Listbox is closed initially.
    expect(screen.queryByRole('listbox')).toBeNull()

    // Open → listbox appears with a search box.
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')

    // Filter + select a second country (panel stays open for multi-select).
    const search = screen.getByRole('searchbox')
    await user.type(search, 'united')
    const options = within(listbox).getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    await user.click(options[0])
    expect(screen.getByRole('listbox')).toBeInTheDocument() // still open

    // Close by clicking outside.
    await user.click(document.body)
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })
})
