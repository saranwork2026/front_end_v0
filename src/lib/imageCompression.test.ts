import { describe, it, expect, vi, afterEach } from 'vitest'
import { compressImageIfNeeded } from './imageCompression'

/**
 * Unit tests for the shared client-side image compressor used by every image
 * upload surface (profile photos, horoscope photos, success-story couple
 * photo, ad banners, ID verification images).
 *
 * The canvas re-encode path (toBlob / 2d context) is not implemented by jsdom,
 * so these tests focus on the deterministic early-return guarantees that hold
 * regardless of the environment:
 *   1. a file already at/under the limit is returned untouched (no quality loss)
 *   2. a non-image file (e.g. a PDF) is returned untouched (ID-verification case)
 *   3. a failure in the compression path falls back to the original file
 */

function makeFile(name: string, type: string, sizeBytes: number): File {
  // A File whose .size reflects sizeBytes without allocating that many bytes.
  const file = new File([new Uint8Array(0)], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

const UNDER = 4.5 * 1024 * 1024

afterEach(() => {
  vi.restoreAllMocks()
})

describe('compressImageIfNeeded', () => {
  it('returns the original file unchanged when already at/under the limit', async () => {
    const file = makeFile('small.jpg', 'image/jpeg', 1_000_000)
    const result = await compressImageIfNeeded(file, UNDER)
    expect(result).toBe(file)
  })

  it('returns the original file unchanged at exactly the limit boundary', async () => {
    const file = makeFile('exact.jpg', 'image/jpeg', UNDER)
    const result = await compressImageIfNeeded(file, UNDER)
    expect(result).toBe(file)
  })

  it('returns a non-image file (PDF) untouched even when over the limit', async () => {
    const pdf = makeFile('aadhaar.pdf', 'application/pdf', 8 * 1024 * 1024)
    const result = await compressImageIfNeeded(pdf, UNDER)
    expect(result).toBe(pdf)
  })

  it('falls back to the original file when canvas compression is unavailable', async () => {
    // Make image loading resolve deterministically (jsdom does not decode
    // images on its own), then force getContext to null so the compressor
    // treats it as "can't compress" and returns the original file.
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        naturalWidth = 1200
        naturalHeight = 900
        set src(_v: string) {
          queueMicrotask(() => this.onload?.())
        }
      },
    )
    const origCreate = (URL as { createObjectURL?: unknown }).createObjectURL
    const origRevoke = (URL as { revokeObjectURL?: unknown }).revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    try {
      const big = makeFile('huge.jpg', 'image/jpeg', 10 * 1024 * 1024)
      const result = await compressImageIfNeeded(big, UNDER)
      expect(result).toBe(big)
    } finally {
      URL.createObjectURL = origCreate as typeof URL.createObjectURL
      URL.revokeObjectURL = origRevoke as typeof URL.revokeObjectURL
    }
  })
})
