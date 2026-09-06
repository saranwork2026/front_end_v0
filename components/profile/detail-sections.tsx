'use client'

import { Icon } from '@/components/ui/icon'
import {
  buildDetailSections,
  type ProfileDetail,
} from '@/lib/profile-detail-data'

interface DetailSectionsProps {
  profile: ProfileDetail
  /** Horoscope charts are privacy-gated like photos. */
  horoscopeVisible: boolean
  onRequestHoroscope: () => void
  horoscopeRequested: boolean
}

/**
 * The filtered profile detail sections (basic, physical, religious, career,
 * location, family, horoscope). Each section is a card; empty rows/sections are
 * dropped upstream. Horoscope charts render as locked tiles until access.
 */
export function DetailSections({
  profile,
  horoscopeVisible,
  onRequestHoroscope,
  horoscopeRequested,
}: DetailSectionsProps) {
  const sections = buildDetailSections(profile)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((section) => (
        <section
          key={section.key}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
            <span className="text-primary">
              <Icon name={section.icon} size={18} />
            </span>
            {section.title}
          </h2>
          <dl className="mt-4 grid gap-x-4 gap-y-3">
            {section.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <dt className="shrink-0 text-sm text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="min-w-0 text-right text-sm font-medium text-foreground text-pretty">
                  {row.value}
                </dd>
              </div>
            ))}

            {section.key === 'horoscope' && profile.horoscopePhotoCount > 0 && (
              <div className="pt-1">
                <p className="mb-2 text-sm text-muted-foreground">
                  Horoscope charts
                </p>
                {horoscopeVisible ? (
                  <div className="flex gap-2">
                    {Array.from({ length: profile.horoscopePhotoCount }).map((_, i) => (
                      <div
                        key={i}
                        className="flex size-20 items-center justify-center rounded-lg border border-border bg-secondary text-primary"
                      >
                        <Icon name="photo" size={22} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/50 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                      <Icon name="lock" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {profile.horoscopePhotoCount} charts locked
                      </p>
                      <button
                        type="button"
                        onClick={onRequestHoroscope}
                        disabled={horoscopeRequested}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
                      >
                        {horoscopeRequested ? 'Request sent' : 'Request access'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </dl>
        </section>
      ))}
    </div>
  )
}
