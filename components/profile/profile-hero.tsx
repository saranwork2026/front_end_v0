'use client'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { quickFacts, type ProfileDetail } from '@/lib/profile-detail-data'

interface ProfileHeroProps {
  profile: ProfileDetail
  photoVisible: boolean
}

/**
 * Maroon hero banner: avatar, name/age, verified badge, profile-id chip,
 * match-score chip and a wrap of quick-fact chips. Stacks on mobile.
 */
export function ProfileHero({ profile, photoVisible }: ProfileHeroProps) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const facts = quickFacts(profile)
  const avatar = photoVisible ? profile.photos[0] : undefined

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
        <div className="relative shrink-0 self-start sm:self-center">
          <div className="size-24 overflow-hidden rounded-2xl border-2 border-gold/70 bg-primary-foreground/10 sm:size-28">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar || '/placeholder.svg'}
                alt={`Photo of ${name}`}
                className="h-full w-full object-cover"
                style={{ objectPosition: profile.avatarPosition ?? '50% 20%' }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary-foreground/50">
                <Icon name={photoVisible ? 'user' : 'lock'} size={40} />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-serif text-2xl font-bold text-balance sm:text-3xl">
              {name}
              {profile.age ? `, ${profile.age}` : ''}
            </h1>
            {profile.verified && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium"
                title="Verified profile"
              >
                <Icon name="shield" size={14} />
                Verified
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 font-mono text-xs text-primary-foreground/90">
              {profile.profileId}
            </span>
            {typeof profile.matchScore === 'number' && profile.matchScore > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
                <Icon name="sparkles" size={13} />
                {profile.matchScore}% match
              </span>
            )}
          </div>

          {facts.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {facts.map((f, i) => (
                <li
                  key={i}
                  className={cn(
                    'rounded-lg bg-primary-foreground/10 px-3 py-1.5 text-sm text-primary-foreground/95',
                  )}
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
