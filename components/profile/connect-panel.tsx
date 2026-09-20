'use client'

import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface ConnectPanelProps {
  interestState: 'idle' | 'sending' | 'sent'
  shortlisted: boolean
  photosLocked: boolean
  photoAccessState: 'none' | 'requested' | 'granted'
  onSendInterest: () => void
  onShortlistToggle: () => void
  onShare: () => void
  onRequestPhotoAccess: () => void
}

/**
 * Primary connect actions (Send Interest, Shortlist, Share, and — when photos
 * are locked — Request Photo Access). Rendered in the sticky desktop sidebar.
 */
export function ConnectPanel({
  interestState,
  shortlisted,
  photosLocked,
  photoAccessState,
  onSendInterest,
  onShortlistToggle,
  onShare,
  onRequestPhotoAccess,
}: ConnectPanelProps) {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-foreground">{t('page.profile.connect')}</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        {t('page.profile.connectDesc')}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <Button
          variant="heart"
          size="lg"
          className="w-full"
          onClick={onSendInterest}
          loading={interestState === 'sending'}
          disabled={interestState === 'sent'}
        >
          <Icon
            name={interestState === 'sent' ? 'check' : 'heart-filled'}
            size={18}
          />
          {interestState === 'sent' ? t('page.profile.interestSent') : t('page.profile.sendInterest')}
        </Button>

        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onShortlistToggle}
            aria-pressed={shortlisted}
          >
            <Icon name={shortlisted ? 'star-filled' : 'star'} size={18} />
            {shortlisted ? t('page.profile.shortlisted') : t('page.profile.shortlist')}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onShare}
            aria-label={t('page.profile.shareProfile')}
          >
            <Icon name="share" size={18} />
          </Button>
        </div>

        {photosLocked && (
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={onRequestPhotoAccess}
            disabled={photoAccessState === 'requested'}
          >
            <Icon
              name={photoAccessState === 'requested' ? 'check' : 'eye'}
              size={18}
            />
            {photoAccessState === 'requested'
              ? t('page.profile.photoRequestSent')
              : t('page.profile.requestPhotoAccess')}
          </Button>
        )}
      </div>
    </section>
  )
}
