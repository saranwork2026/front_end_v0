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

  it('renders the field labels in the specified single-card order', async () => {
    render(<PreferencesView />)
    await waitFor(() => expect(getPartnerPreferenceMock).toHaveBeenCalled())

    // The field labels in document order; weight sits between height and
    // physical status.
    const container = document.querySelector('form')!
    const text = within(container)
    const marital = text.getByText('Marital status')
    const weight = text.getByText('Weight')
    const dhosam = text.getByText('Dhosam')
    // DOCUMENT_POSITION_FOLLOWING (4) means the arg comes after.
    expect(marital.compareDocumentPosition(weight) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(weight.compareDocumentPosition(dhosam) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
