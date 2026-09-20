'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

interface ReportBlockActionsProps {
  name: string
  blocked: boolean
  onReport: (reason: string, description?: string) => void
  onBlock: () => void
  onUnblock: () => void
}

// value = backend ReportReasonType enum, labelKey = i18n key.
const reportReasons = [
  { value: 'FAKE_PROFILE', labelKey: 'page.profile.reasonFake' },
  { value: 'INAPPROPRIATE_PHOTO', labelKey: 'page.profile.reasonInappropriate' },
  { value: 'HARASSMENT', labelKey: 'page.profile.reasonHarassment' },
  { value: 'SPAM', labelKey: 'page.profile.reasonSpam' },
  { value: 'ALREADY_MARRIED', labelKey: 'page.profile.reasonMarried' },
  { value: 'WRONG_INFORMATION', labelKey: 'page.profile.reasonWrongInfo' },
  { value: 'OTHER', labelKey: 'page.profile.reasonOther' },
]

/**
 * Report / Block safety actions, each confirmed through a dialog. Kept subtle
 * at the foot of the profile so it never competes with the connect actions.
 */
export function ReportBlockActions({
  name,
  blocked,
  onReport,
  onBlock,
  onUnblock,
}: ReportBlockActionsProps) {
  const { t } = useTranslation()
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reason, setReason] = useState(reportReasons[0].value)
  const [description, setDescription] = useState('')

  const firstName = name.split(' ')[0]

  return (
    <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {blocked ? t('page.profile.blockedYou', { name: firstName }) : t('page.profile.somethingWrong')}
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="flag" size={16} />
          {t('page.profile.report')}
        </button>
        {blocked ? (
          <button
            type="button"
            onClick={onUnblock}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Icon name="check" size={16} />
            {t('page.profile.unblock')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setBlockOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
          >
            <Icon name="x" size={16} />
            {t('page.profile.block')}
          </button>
        )}
      </div>

      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('page.profile.reportTitle', { name: firstName })}
        description={t('page.profile.reportDialogDesc')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              {t('page.profile.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onReport(reason, description.trim() || undefined)
                setReportOpen(false)
                setDescription('')
              }}
            >
              {t('page.profile.submitReport')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label={t('page.profile.reasonForReporting')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {reportReasons.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey as never)}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-description" className="text-sm font-medium text-foreground">
              {t('page.profile.detailsLabel')} <span className="font-normal text-muted-foreground">{t('page.profile.optional')}</span>
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder={t('page.profile.reportPlaceholder')}
              className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {description.length}/500
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={t('page.profile.blockTitle', { name: firstName })}
        description={t('page.profile.blockDialogDesc', { name: firstName })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              {t('page.profile.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onBlock()
                setBlockOpen(false)
              }}
            >
              {t('page.profile.block')}
            </Button>
          </>
        }
      />
    </section>
  )
}
