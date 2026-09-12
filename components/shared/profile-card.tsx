'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { cn, focalPosition } from '@/lib/utils'

export interface ProfileCardProfile {
  profileId: string
  firstName: string
  lastName?: string
  age?: number
  currentCity?: string
  heightCm?: number
  highestEducation?: string
  profession?: string
  religion?: string
  caste?: string
  primaryPhotoUrl?: string
  /** DP crop focal point (object-position %, 0–100); undefined → face-top default. */
  photoFocalX?: number
  photoFocalY?: number
  verified?: boolean
  featured?: boolean
  matchScore?: number
  activityStatus?: 'ONLINE' | 'RECENT' | 'UNKNOWN'
}

function cmToFeet(cm?: number): string | null {
  if (!cm) return null
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}

interface ProfileCardProps {
  profile: ProfileCardProfile
  /** When set, the whole card becomes a link to this route. */
  href?: string
  showShortlistButton?: boolean
  isShortlisted?: boolean
  onShortlistToggle?: (profileId: string) => void
  onClick?: (profileId: string) => void
}

export function ProfileCard({
  profile,
  href,
  showShortlistButton = false,
  isShortlisted = false,
  onShortlistToggle,
  onClick,
}: ProfileCardProps) {
  const height = cmToFeet(profile.heightCm)
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')

  const cardClassName =
    'group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/60'

  const Wrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link
          href={href}
          aria-label={`View ${name}'s profile`}
          className={cardClassName}
        >
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <article
          role="article"
          tabIndex={0}
          onClick={() => onClick?.(profile.profileId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick?.(profile.profileId)
            }
          }}
          className={cardClassName}
        >
          {children}
        </article>
      )

  return (
    <Wrapper>
      <div className="relative">
        <div className="relative h-52 w-full overflow-hidden bg-secondary sm:h-56">
          {profile.primaryPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.primaryPhotoUrl || '/placeholder.svg'}
              alt={`Photo of ${name}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ objectPosition: focalPosition(profile.photoFocalX, profile.photoFocalY) }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary/40">
              <Icon name="user" size={56} />
            </div>
          )}
        </div>

        {/* Top badges share one justify-between row so they can never overlap,
            even on the narrowest 2-up mobile cards. */}
        {(profile.featured ||
          (typeof profile.matchScore === 'number' && profile.matchScore > 0)) && (
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {profile.featured ? (
              <span
                className="flex items-center gap-1 rounded-full bg-gold px-2 py-1 text-xs font-semibold text-gold-foreground shadow-sm sm:pl-2 sm:pr-2.5"
                aria-label="Featured profile"
              >
                <Icon name="star-filled" size={12} className="shrink-0" />
                <span className="hidden sm:inline">Featured</span>
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            {typeof profile.matchScore === 'number' && profile.matchScore > 0 && (
              <Badge
                variant="primary"
                className="shrink-0 bg-primary text-primary-foreground shadow-sm"
              >
                {profile.matchScore}% match
              </Badge>
            )}
          </div>
        )}

        {showShortlistButton && (
          <button
            type="button"
            aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            aria-pressed={isShortlisted}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onShortlistToggle?.(profile.profileId)
            }}
            className={cn(
              'absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:bg-card',
              isShortlisted ? 'text-gold' : 'text-muted-foreground',
            )}
          >
            <Icon name={isShortlisted ? 'star-filled' : 'star'} size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold text-foreground">
            {name}
            {profile.age ? `, ${profile.age}` : ''}
          </h3>
          {profile.verified && (
            <span
              className="text-[oklch(0.6_0.13_240)]"
              title="Verified profile"
              aria-label="Verified profile"
            >
              <Icon name="shield" size={16} />
            </span>
          )}
        </div>

        {(profile.currentCity || height) && (
          <p className="truncate text-sm text-muted-foreground">
            {[profile.currentCity, height].filter(Boolean).join(' • ')}
          </p>
        )}

        {(profile.highestEducation || profile.profession) && (
          <p className="truncate text-sm text-muted-foreground">
            {[profile.highestEducation, profile.profession]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}

        {(profile.religion || profile.caste) && (
          <p className="truncate text-sm text-muted-foreground">
            {[profile.religion, profile.caste].filter(Boolean).join(', ')}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground/80">
            {profile.profileId}
          </span>
          {profile.activityStatus && profile.activityStatus !== 'UNKNOWN' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  'size-2 rounded-full',
                  profile.activityStatus === 'ONLINE'
                    ? 'bg-success'
                    : 'bg-warning',
                )}
              />
              {profile.activityStatus === 'ONLINE' ? 'Online now' : 'Active recently'}
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
