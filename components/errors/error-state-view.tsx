"use client"

import Link from "next/link"
import { Icon, type IconName } from "@/components/ui/icon"
import { buttonVariants } from "@/components/ui/button"

interface ErrorAction {
  label: string
  href: string
  variant?: "primary" | "secondary"
}

interface ErrorStateViewProps {
  icon: IconName
  code?: string
  title: string
  message: string
  actions: ErrorAction[]
}

export function ErrorStateView({ icon, code, title, message, actions }: ErrorStateViewProps) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon name={icon} size={30} />
        </span>
        {code && (
          <p className="mt-6 font-mono text-sm uppercase tracking-[0.25em] text-muted-foreground">{code}</p>
        )}
        <h1 className="mt-2 text-balance font-serif text-3xl text-foreground sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-prose text-pretty leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={buttonVariants({ variant: a.variant ?? "primary", size: "lg" })}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
