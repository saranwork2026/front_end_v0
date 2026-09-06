import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground text-balance">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
