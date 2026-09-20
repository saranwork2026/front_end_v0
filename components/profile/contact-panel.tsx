'use client'

import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface ContactPanelProps {
  state: 'locked' | 'requested' | 'unlocking' | 'unlocked'
  contact: { phone: string; email: string }
  quotaRemaining: number
  onUnlock: () => void
  onRequestAccess: () => void
}

/**
 * Contact panel. Numbers/email stay hidden behind a privacy gate until the
 * viewer unlocks the contact (quota- or payment-based) or the member grants a
 * contact-access request.
 */
export function ContactPanel({
  state,
  contact,
  quotaRemaining,
  onUnlock,
  onRequestAccess,
}: ContactPanelProps) {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
        <span className="text-primary">
          <Icon name="phone" size={18} />
        </span>
        {t('page.profile.contactDetails')}
      </h2>

      {state === 'unlocked' ? (
        <dl className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon name="phone" size={16} />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t('page.profile.mobile')}</dt>
              <dd className="truncate font-medium text-foreground">
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="hover:underline">
                  {contact.phone}
                </a>
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon name="mail" size={16} />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t('page.profile.email')}</dt>
              <dd className="truncate font-medium text-foreground">
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </dd>
            </div>
          </div>
        </dl>
      ) : (
        <>
          <div className="mt-4 space-y-2" aria-hidden="true">
            <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-2.5">
              <Icon name="lock" size={16} className="text-muted-foreground" />
              <span className="h-4 w-32 rounded bg-muted blur-[2px]" />
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-2.5">
              <Icon name="lock" size={16} className="text-muted-foreground" />
              <span className="h-4 w-44 rounded bg-muted blur-[2px]" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              variant="gold"
              size="md"
              className="w-full"
              onClick={onUnlock}
              loading={state === 'unlocking'}
            >
              <Icon name="lock" size={16} />
              {t('page.profile.unlockContact')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={onRequestAccess}
              disabled={state === 'requested'}
            >
              <Icon name={state === 'requested' ? 'check' : 'handshake'} size={16} />
              {state === 'requested' ? t('page.profile.accessRequestSent') : t('page.profile.requestContactAccess')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {quotaRemaining > 0
                ? t('page.profile.freeUnlocks', { count: quotaRemaining })
                : t('page.profile.paidUnlock')}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
