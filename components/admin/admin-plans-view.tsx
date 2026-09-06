'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlanCreateRequest, PlanUpdateRequest, SubscriptionPlan } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { INR, validityLabel } from '@/lib/plans-data'
import { adminApi, plansApi } from '@/src/lib/api'

/** Tier order for display — matches the public catalogue progression. */
const TIER_ORDER = ['BASE', 'SILVER', 'GOLD', 'PLATINUM']

function tierRank(name: string): number {
  const idx = TIER_ORDER.indexOf(name.toUpperCase())
  return idx === -1 ? TIER_ORDER.length : idx
}

function sortPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return [...plans].sort((a, b) => tierRank(a.name) - tierRank(b.name) || a.price - b.price)
}

const limitLabel = (n: number) => (n === -1 ? 'Unlimited' : String(n))

/** Editable form shape (strings as they come from inputs). */
interface PlanFormValues {
  name: string
  description: string
  price: string
  validityDays: string
  contactViewLimit: string
  messageLimit: string
  interestLimit: string
  photoViewLimit: string
  chatEnabled: boolean
  profileBoostEnabled: boolean
  isActive: boolean
}

type PlanFormErrors = Partial<Record<keyof PlanFormValues, string>>

const EMPTY_FORM: PlanFormValues = {
  name: '',
  description: '',
  price: '',
  validityDays: '',
  contactViewLimit: '',
  messageLimit: '',
  interestLimit: '',
  photoViewLimit: '',
  chatEnabled: true,
  profileBoostEnabled: false,
  isActive: true,
}

function planToForm(plan: SubscriptionPlan): PlanFormValues {
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    validityDays: String(plan.validityDays),
    contactViewLimit: String(plan.contactViewLimit),
    messageLimit: String(plan.messageLimit),
    interestLimit: String(plan.interestLimit),
    photoViewLimit: String(plan.photoViewLimit),
    chatEnabled: plan.chatEnabled,
    profileBoostEnabled: plan.profileBoostEnabled,
    isActive: plan.isActive,
  }
}

function validateForm(v: PlanFormValues): PlanFormErrors {
  const e: PlanFormErrors = {}
  if (!v.name.trim()) e.name = 'Plan name is required.'
  if (!v.description.trim()) e.description = 'Description is required.'

  const price = Number(v.price)
  if (v.price.trim() === '') e.price = 'Price is required.'
  else if (!Number.isFinite(price) || price < 0) e.price = 'Price must be zero or more.'

  const days = Number(v.validityDays)
  if (v.validityDays.trim() === '') e.validityDays = 'Validity is required.'
  else if (!Number.isInteger(days) || days < 1) e.validityDays = 'Validity must be at least 1 day.'

  const limits: [keyof PlanFormValues, string][] = [
    ['contactViewLimit', 'Contact views'],
    ['messageLimit', 'Messages'],
    ['interestLimit', 'Interests'],
    ['photoViewLimit', 'Photo views'],
  ]
  for (const [key, label] of limits) {
    const raw = String(v[key])
    const n = Number(raw)
    if (raw.trim() === '') e[key] = `${label} limit is required.`
    else if (!Number.isInteger(n) || n < -1) e[key] = `${label} must be -1 (unlimited) or a whole number.`
  }
  return e
}

function formToCreate(v: PlanFormValues): PlanCreateRequest {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    price: Number(v.price),
    validityDays: Number(v.validityDays),
    contactViewLimit: Number(v.contactViewLimit),
    messageLimit: Number(v.messageLimit),
    interestLimit: Number(v.interestLimit),
    photoViewLimit: Number(v.photoViewLimit),
    chatEnabled: v.chatEnabled,
    profileBoostEnabled: v.profileBoostEnabled,
  }
}

function formToUpdate(v: PlanFormValues): PlanUpdateRequest {
  return { ...formToCreate(v), isActive: v.isActive }
}

interface AdminPlansViewProps {
  initialState?: 'ready' | 'loading' | 'error'
}

export function AdminPlansView(_props: AdminPlansViewProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const [editing, setEditing] = useState<{ planId: number | null } | null>(null)
  const [form, setForm] = useState<PlanFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<PlanFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  function pushToast(message: string, variant: ToastItem['variant']) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await plansApi.getActivePlans()
      setPlans(sortPlans(res.data ?? []))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = useMemo(() => plans.filter((p) => p.isActive).length, [plans])

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditing({ planId: null })
  }

  function openEdit(plan: SubscriptionPlan) {
    setForm(planToForm(plan))
    setErrors({})
    setEditing({ planId: plan.planId })
  }

  function closeForm() {
    setEditing(null)
    setErrors({})
  }

  function set<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    const isCreate = editing?.planId == null
    setSaving(true)
    try {
      if (isCreate) {
        const res = await adminApi.createPlan(formToCreate(form))
        setPlans((prev) => sortPlans([...prev, res.data]))
        pushToast(`${res.data.name} created successfully.`, 'success')
      } else {
        const res = await adminApi.updatePlan(editing!.planId!, formToUpdate(form))
        setPlans((prev) => sortPlans(prev.map((p) => (p.planId === res.data.planId ? res.data : p))))
        pushToast(`${res.data.name} updated successfully.`, 'success')
      }
      closeForm()
    } catch {
      pushToast('Could not save the plan. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(plan: SubscriptionPlan) {
    setDeactivatingId(plan.planId)
    try {
      await adminApi.deactivatePlan(plan.planId)
      setPlans((prev) =>
        sortPlans(prev.map((p) => (p.planId === plan.planId ? { ...p, isActive: false } : p))),
      )
      pushToast(`${plan.name} deactivated.`, 'success')
    } catch {
      pushToast('Could not deactivate the plan.', 'error')
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Subscription plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {plans.length} plans · {activeCount} active. Create and edit tiers shown in the public catalogue.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 sm:w-auto">
          <Icon name="plus" size={18} />
          New plan
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load plans. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              onEdit={() => openEdit(plan)}
              onDeactivate={() => deactivate(plan)}
              deactivating={deactivatingId === plan.planId}
            />
          ))}
        </div>
      )}

      {editing && (
        <PlanFormDrawer
          isCreate={editing.planId == null}
          form={form}
          errors={errors}
          saving={saving}
          onChange={set}
          onClose={closeForm}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}

function PlanCard({
  plan,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  plan: SubscriptionPlan
  onEdit: () => void
  onDeactivate: () => void
  deactivating: boolean
}) {
  const rows: [string, string][] = [
    ['Contact views', limitLabel(plan.contactViewLimit)],
    ['Messages', limitLabel(plan.messageLimit)],
    ['Interests', limitLabel(plan.interestLimit)],
    ['Photo views', limitLabel(plan.photoViewLimit)],
  ]
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors',
        plan.isActive ? 'border-border' : 'border-dashed border-border/70 opacity-90',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold text-foreground">{plan.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{plan.description}</p>
        </div>
        <Badge variant={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-foreground">
          {plan.price === 0 ? 'Free' : INR.format(plan.price)}
        </span>
        {plan.price > 0 && (
          <span className="text-sm text-muted-foreground">/ {validityLabel(plan.validityDays)}</span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <FeaturePill on={plan.chatEnabled} label="Chat" />
        <FeaturePill on={plan.profileBoostEnabled} label="Boost" />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1 gap-2">
          <Icon name="edit" size={16} />
          Edit
        </Button>
        {plan.isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeactivate}
            loading={deactivating}
            className="shrink-0"
          >
            Deactivate
          </Button>
        )}
      </div>
    </div>
  )
}

function FeaturePill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
        on ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground line-through',
      )}
    >
      <Icon name={on ? 'check' : 'x'} size={12} />
      {label}
    </span>
  )
}

function PlanFormDrawer({
  isCreate,
  form,
  errors,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  isCreate: boolean
  form: PlanFormValues
  errors: PlanFormErrors
  saving: boolean
  onChange: <K extends keyof PlanFormValues>(k: K, v: PlanFormValues[K]) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close form" onClick={onClose} className="absolute inset-0 bg-foreground/40 animate-in fade-in" />
      <form
        onSubmit={onSubmit}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-background shadow-xl animate-in slide-in-from-right"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
          <h2 className="font-serif text-lg font-semibold text-foreground">{isCreate ? 'New plan' : 'Edit plan'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <Input
            label="Plan name"
            placeholder="Gold"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            error={errors.name}
          />

          <div>
            <label htmlFor="plan-desc" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="plan-desc"
              rows={2}
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              className={cn(
                'w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30',
                errors.description ? 'border-destructive' : 'border-input',
              )}
              placeholder="Short marketing summary shown on the plan card."
            />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (INR)"
              inputMode="numeric"
              placeholder="3499"
              value={form.price}
              onChange={(e) => onChange('price', e.target.value)}
              error={errors.price}
            />
            <Input
              label="Validity (days)"
              inputMode="numeric"
              placeholder="180"
              value={form.validityDays}
              onChange={(e) => onChange('validityDays', e.target.value)}
              error={errors.validityDays}
            />
          </div>

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">Quota limits (-1 = unlimited)</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact views"
                inputMode="numeric"
                value={form.contactViewLimit}
                onChange={(e) => onChange('contactViewLimit', e.target.value)}
                error={errors.contactViewLimit}
              />
              <Input
                label="Messages"
                inputMode="numeric"
                value={form.messageLimit}
                onChange={(e) => onChange('messageLimit', e.target.value)}
                error={errors.messageLimit}
              />
              <Input
                label="Interests"
                inputMode="numeric"
                value={form.interestLimit}
                onChange={(e) => onChange('interestLimit', e.target.value)}
                error={errors.interestLimit}
              />
              <Input
                label="Photo views"
                inputMode="numeric"
                value={form.photoViewLimit}
                onChange={(e) => onChange('photoViewLimit', e.target.value)}
                error={errors.photoViewLimit}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <ToggleRow
              label="Chat enabled"
              hint="Members on this plan can message matches."
              checked={form.chatEnabled}
              onChange={(v) => onChange('chatEnabled', v)}
            />
            <ToggleRow
              label="Boost enabled"
              hint="Profile spotlight and priority visibility."
              checked={form.profileBoostEnabled}
              onChange={(v) => onChange('profileBoostEnabled', v)}
            />
            {!isCreate && (
              <ToggleRow
                label="Active"
                hint="Show this plan in the public catalogue."
                checked={form.isActive}
                onChange={(v) => onChange('isActive', v)}
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            {isCreate ? 'Create plan' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}
