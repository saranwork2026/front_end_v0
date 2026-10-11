import { describe, it, expect, vi } from 'vitest'

// The data layer imports profileApi from '@/src/lib/api', which pulls in the
// whole shared-core API client (reads import.meta.env). Mock it so this unit
// test exercises only toApi/fromApi/validatePreference, not the HTTP layer.
vi.mock('@/src/lib/api', () => ({
  profileApi: {
    getPartnerPreference: vi.fn(),
    savePartnerPreference: vi.fn(),
    getProfile: vi.fn(),
  },
}))

import {
  getPartnerPreference,
  savePartnerPreference,
  validatePreference,
  emptyPreference,
  type PartnerPreference,
} from '@/lib/preferences-data'
import { profileApi } from '@/src/lib/api'

describe('preferences-data weight range', () => {
  it('toApi forwards minWeightKg/maxWeightKg to the DTO', async () => {
    const saveMock = profileApi.savePartnerPreference as unknown as ReturnType<typeof vi.fn>
    saveMock.mockResolvedValue({ data: {} })

    const form: PartnerPreference = { ...emptyPreference, minWeightKg: 50, maxWeightKg: 80 }
    await savePartnerPreference(form)

    expect(saveMock).toHaveBeenCalledTimes(1)
    const dto = saveMock.mock.calls[0][0]
    expect(dto.minWeightKg).toBe(50)
    expect(dto.maxWeightKg).toBe(80)
  })

  it('fromApi maps minWeightKg/maxWeightKg back into the view model', async () => {
    const getMock = profileApi.getPartnerPreference as unknown as ReturnType<typeof vi.fn>
    getMock.mockResolvedValue({ data: { minWeightKg: 55, maxWeightKg: 75 } })

    const form = await getPartnerPreference()

    expect(form.minWeightKg).toBe(55)
    expect(form.maxWeightKg).toBe(75)
  })

  it('round-trips weight through fromApi → toApi (save after load)', async () => {
    const getMock = profileApi.getPartnerPreference as unknown as ReturnType<typeof vi.fn>
    getMock.mockResolvedValue({ data: { minWeightKg: 60, maxWeightKg: 90 } })
    const saveMock = profileApi.savePartnerPreference as unknown as ReturnType<typeof vi.fn>
    saveMock.mockResolvedValue({ data: {} })

    const loaded = await getPartnerPreference()
    await savePartnerPreference(loaded)

    const dto = saveMock.mock.calls.at(-1)![0]
    expect(dto.minWeightKg).toBe(60)
    expect(dto.maxWeightKg).toBe(90)
  })

  it('validatePreference flags maxWeightKg < minWeightKg', () => {
    const errors = validatePreference({ ...emptyPreference, minWeightKg: 90, maxWeightKg: 60 })
    expect(errors.maxWeightKg).toBeTruthy()
  })

  it('validatePreference accepts a valid weight range', () => {
    const errors = validatePreference({ ...emptyPreference, minWeightKg: 50, maxWeightKg: 80 })
    expect(errors.maxWeightKg).toBeUndefined()
  })

  it('validatePreference accepts one-sided / blank weight bounds', () => {
    expect(validatePreference({ ...emptyPreference, minWeightKg: 50 }).maxWeightKg).toBeUndefined()
    expect(validatePreference({ ...emptyPreference, maxWeightKg: 80 }).maxWeightKg).toBeUndefined()
    expect(validatePreference(emptyPreference).maxWeightKg).toBeUndefined()
  })
})
