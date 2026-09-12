'use client'

import { PhotoManager } from '@/components/photos/photo-manager'
import { ProfileDpManager } from '@/components/photos/profile-dp-manager'

/**
 * Standalone /photos page. Two sections:
 *   1. Profile picture (DP) — {@link ProfileDpManager}: pick the DP + drag to
 *      position the face (saved as a focal point, used by every avatar render).
 *   2. Additional photos — the shared {@link PhotoManager} (upload/manage the
 *      gallery), kept identical to the wizard's Photos step.
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

      <div className="space-y-6">
        <ProfileDpManager />

        <section aria-labelledby="additional-photos-heading">
          <h2
            id="additional-photos-heading"
            className="mb-3 font-serif text-lg font-bold text-foreground"
          >
            Additional photos
          </h2>
          <PhotoManager />
        </section>
      </div>
    </main>
  )
}
