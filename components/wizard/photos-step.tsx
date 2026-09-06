'use client'

import { PhotoManager } from '@/components/photos/photo-manager'

/**
 * Wizard Photos step. Unlike the other wizard steps, photos are NOT part of the
 * wizard form state: they upload directly to `/user/photos` (multipart) the
 * moment a file is picked, via the shared {@link PhotoManager} that also backs
 * the standalone /photos page. This keeps the two surfaces in sync and means
 * no mock/demo images are ever added.
 */
export function PhotosStep() {
  return <PhotoManager />
}
