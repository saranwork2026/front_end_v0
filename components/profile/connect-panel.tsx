'use client'

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
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-foreground">Connect</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Express interest to start a conversation once it&apos;s accepted.
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
          {interestState === 'sent' ? 'Interest sent' : 'Send interest'}
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
            {shortlisted ? 'Shortlisted' : 'Shortlist'}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onShare}
            aria-label="Share profile"
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
              ? 'Photo request sent'
              : 'Request photo access'}
          </Button>
        )}
      </div>
    </section>
  )
}
