'use client'

import { PhotoManager } from '@/components/photos/photo-manager'

/**
 * Standalone /photos page. The actual photo management UI lives in the shared
 * {@link PhotoManager} so it stays identical to the wizard's Photos step.
 */
export function PhotosView() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add up to 3 profile photos. New photos are visible to others after admin approval.
        </p>
      </div>
      <PhotoManager />
    </main>
  )
}
