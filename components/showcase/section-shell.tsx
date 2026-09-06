import { cn } from '@/lib/utils'

interface SectionShellProps {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-24 border-t border-border/70 py-14 sm:py-20', className)}
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-foreground">
          {eyebrow}
        </p>
        <h2
          id={`${id}-title`}
          className="mt-2 font-serif text-3xl font-bold text-foreground text-balance sm:text-4xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-medium text-muted-foreground">{children}</p>
  )
}
