'use client'

import { useState } from 'react'

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

// value = backend ReportReasonType enum, label = human text.
const reportReasons = [
  { value: 'FAKE_PROFILE', label: 'Fake or misleading profile' },
  { value: 'INAPPROPRIATE_PHOTO', label: 'Inappropriate photos or content' },
  { value: 'HARASSMENT', label: 'Harassment or abusive behaviour' },
  { value: 'SPAM', label: 'Asking for money / suspected scam' },
  { value: 'ALREADY_MARRIED', label: 'Already married' },
  { value: 'WRONG_INFORMATION', label: 'Wrong information' },
  { value: 'OTHER', label: 'Other' },
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
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reason, setReason] = useState(reportReasons[0].value)
  const [description, setDescription] = useState('')

  const firstName = name.split(' ')[0]

  return (
    <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {blocked ? `You have blocked ${firstName}.` : 'Something wrong with this profile?'}
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="flag" size={16} />
          Report
        </button>
        {blocked ? (
          <button
            type="button"
            onClick={onUnblock}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Icon name="check" size={16} />
            Unblock
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setBlockOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
          >
            <Icon name="x" size={16} />
            Block
          </button>
        )}
      </div>

      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report ${firstName}`}
        description="Your report is confidential and helps us keep the community safe."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onReport(reason, description.trim() || undefined)
                setReportOpen(false)
                setDescription('')
              }}
            >
              Submit report
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Reason for reporting"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {reportReasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-description" className="text-sm font-medium text-foreground">
              Details <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder="Add any details that will help us review this report."
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
        title={`Block ${firstName}?`}
        description={`${firstName} will no longer be able to view your profile or contact you, and won't appear in your searches.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onBlock()
                setBlockOpen(false)
              }}
            >
              Block
            </Button>
          </>
        }
      />
    </section>
  )
}
