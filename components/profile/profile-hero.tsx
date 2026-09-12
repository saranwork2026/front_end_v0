'use client'

import { Icon } from '@/components/ui/icon'
import { type ProfileDetail } from '@/lib/profile-detail-data'

interface ProfileHeroProps {
  profile: ProfileDetail
  photoVisible: boolean
}

/**
 * Maroon hero banner. Per product decision it shows only the essentials —
 * name, age, profile ID and location — with no avatar photo or extra chips
 * (the full photo gallery and detail sections live below).
 */
export function ProfileHero({ profile }: ProfileHeroProps) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const location = [profile.currentCity, profile.state, profile.country].filter(Boolean).join(', ')

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground shadow-sm">
      <div className="p-5 sm:p-7">
        <h1 className="font-serif text-2xl font-bold text-balance sm:text-3xl">
          {name}
          {profile.age ? `, ${profile.age}` : ''}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 font-mono text-xs text-primary-foreground/90">
            {profile.profileId}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs text-primary-foreground/90">
              <Icon name="globe" size={13} />
              {location}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
