import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type Variant = VariantProps<typeof badgeVariants>['variant']

const statusMap: Record<string, { label: string; variant: Variant }> = {
  APPROVED: { label: 'Approved', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  ACTIVE: { label: 'Active', variant: 'success' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
  PENDING: { label: 'Pending', variant: 'warning' },
  DRAFT: { label: 'Draft', variant: 'neutral' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
  DEACTIVATED: { label: 'Deactivated', variant: 'neutral' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const entry = statusMap[status] ?? {
    label: status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase()),
    variant: 'neutral' as Variant,
  }

  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  )
}
