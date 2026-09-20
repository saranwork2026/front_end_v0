'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { successStoryApi } from '@/src/lib/api'

const STORY_MAX = 4000
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Member-facing form to submit a marriage success story. Submitted stories go
 * to the admin moderation queue; approved ones appear on the public page.
 * Mirrors the existing app's SubmitSuccessStoryPage.
 */
export function SubmitSuccessStoryView() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [brideName, setBrideName] = useState('')
  const [groomName, setGroomName] = useState('')
  const [marriageDate, setMarriageDate] = useState('')
  const [partnerProfileId, setPartnerProfileId] = useState('')
  const [story, setStory] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pushToast = (message: string, variant: ToastItem['variant']) =>
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])

  function handleFile(file: File | undefined) {
    setFileError(null)
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError(t('page.successStories.fileTypeError'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(t('page.successStories.fileSizeError'))
      return
    }
    setPhoto(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!brideName.trim() || !groomName.trim() || !story.trim()) {
      setError(t('page.successStories.requiredError'))
      return
    }
    if (fileError) return
    setSubmitting(true)
    try {
      await successStoryApi.submit({
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        story: story.trim(),
        marriageDate: marriageDate || undefined,
        partnerProfileId: partnerProfileId.trim() || undefined,
        photo: photo ?? undefined,
      })
      pushToast(t('page.successStories.submittedToast'), 'success')
      setTimeout(() => navigate('/'), 700)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('page.successStories.submitError')
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{t('page.successStories.submitTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('page.successStories.submitSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('page.successStories.brideName')} value={brideName} onChange={(e) => setBrideName(e.target.value)} />
          <Input label={t('page.successStories.groomName')} value={groomName} onChange={(e) => setGroomName(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('page.successStories.marriageDate')} type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} />
          <Input
            label={t('page.successStories.partnerProfileId')}
            value={partnerProfileId}
            onChange={(e) => setPartnerProfileId(e.target.value)}
            placeholder={t('page.successStories.partnerIdPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="story" className="text-sm font-medium text-foreground">
            {t('page.successStories.yourStory')}
          </label>
          <textarea
            id="story"
            value={story}
            onChange={(e) => setStory(e.target.value.slice(0, STORY_MAX))}
            rows={6}
            required
            placeholder={t('page.successStories.storyPlaceholder')}
            className="w-full resize-y rounded-lg border border-input bg-card px-3.5 py-2.5 text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p className="self-end text-xs text-muted-foreground">
            {story.length}/{STORY_MAX}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t('page.successStories.couplePhoto')} <span className="font-normal text-muted-foreground">{t('page.successStories.optional')}</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {photo ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="photo" size={18} className="shrink-0 text-primary" />
                <span className="truncate text-sm text-foreground">{photo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
              >
                {t('page.successStories.remove')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-card px-4 py-6 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-primary"
            >
              <Icon name="upload" size={20} />
              <span className="text-sm font-medium">{t('page.successStories.uploadPhoto')}</span>
              <span className="text-xs">{t('page.successStories.uploadHint')}</span>
            </button>
          )}
          {fileError && (
            <p role="alert" className="text-sm text-destructive">
              {fileError}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
            {t('page.successStories.cancel')}
          </Button>
          <Button type="submit" loading={submitting}>
            {t('page.successStories.submitStory')}
          </Button>
        </div>
      </form>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </main>
  )
}
