import { useTranslation } from 'react-i18next'

import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type Variant = VariantProps<typeof badgeVariants>['variant']

// Variant styling per status. The visible label is resolved via i18n
// (status.<code>), falling back to a humanized version of the raw code.
const variantMap: Record<string, Variant> = {
  APPROVED: 'success',
  COMPLETED: 'success',
  ACCEPTED: 'success',
  ACTIVE: 'success',
  UNDER_REVIEW: 'warning',
  PENDING: 'warning',
  DRAFT: 'neutral',
  REJECTED: 'danger',
  BLOCKED: 'danger',
  DEACTIVATED: 'neutral',
  CANCELLED: 'neutral',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  const variant = variantMap[status] ?? 'neutral'
  const humanized = status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
  const label = t(`status.${status}` as never, { defaultValue: humanized })

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
