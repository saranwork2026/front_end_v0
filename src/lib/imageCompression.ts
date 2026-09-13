/**
 * Client-side image compression for profile/horoscope photo uploads.
 *
 * Modern phone cameras routinely produce 4–12 MB photos, over the upload
 * limit. Rather than making the member find a separate tool to shrink the
 * file, we compress/resize it in the browser (canvas re-encode) before it's
 * ever sent — reducing JPEG quality first (least visible loss), and only
 * shrinking pixel dimensions if quality reduction alone isn't enough.
 *
 * PNG/WEBP inputs are re-encoded as JPEG when compression is needed. Files
 * already under the limit are returned unchanged (no quality loss). Any
 * failure falls back to returning the original file so the normal upload
 * validation surfaces a clear error instead of this silently swallowing it.
 */

const JPEG_QUALITY_STEPS = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35]
const MIN_DIMENSION = 480 // never scale below this on the longer side
const SCALE_STEP = 0.85

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

/**
 * Compresses `file` to at or under `maxSizeBytes` if it isn't already. Returns
 * the original file untouched when no compression is needed, or a new JPEG
 * File (same base name, `.jpg`) otherwise.
 */
export async function compressImageIfNeeded(file: File, maxSizeBytes: number): Promise<File> {
  if (file.size <= maxSizeBytes) return file
  if (!file.type.startsWith('image/')) return file

  try {
    const img = await loadImage(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    let width = img.naturalWidth
    let height = img.naturalHeight

    for (let attempt = 0; attempt < 20; attempt++) {
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      for (const quality of JPEG_QUALITY_STEPS) {
        const blob = await canvasToBlob(canvas, quality)
        if (blob && blob.size <= maxSizeBytes) {
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          return new File([blob], newName, { type: 'image/jpeg' })
        }
      }

      const longerSide = Math.max(width, height)
      if (longerSide <= MIN_DIMENSION) {
        // Can't shrink further — return the smallest version we produced even
        // if slightly over; the backend rejects it with a clear error if so.
        const blob = await canvasToBlob(canvas, JPEG_QUALITY_STEPS[JPEG_QUALITY_STEPS.length - 1])
        if (blob) {
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          return new File([blob], newName, { type: 'image/jpeg' })
        }
        break
      }
      width = Math.round(width * SCALE_STEP)
      height = Math.round(height * SCALE_STEP)
    }

    return file
  } catch {
    return file
  }
}
