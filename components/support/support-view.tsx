"use client"

import { Icon, type IconName } from "@/components/ui/icon"
import { supportContact, legalIsDraft } from "@/lib/legal-content"

interface Channel {
  icon: IconName
  label: string
  value: string
  href: string
  hint: string
}

const channels: Channel[] = [
  {
    icon: "mail",
    label: "Email",
    value: supportContact.email,
    href: `mailto:${supportContact.email}`,
    hint: supportContact.responseTime,
  },
  {
    icon: "phone",
    label: "Phone",
    value: supportContact.phone,
    href: `tel:${supportContact.phone.replace(/\s+/g, "")}`,
    hint: "Account and payment help.",
  },
  {
    icon: "chat",
    label: "WhatsApp",
    value: supportContact.whatsapp,
    href: `https://wa.me/${supportContact.whatsapp.replace(/[^0-9]/g, "")}`,
    hint: "Quick questions and status updates.",
  },
]

export function SupportView() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="font-serif text-sm uppercase tracking-[0.2em] text-gold">Support</p>
        <h1 className="mt-1 text-pretty font-serif text-3xl text-foreground sm:text-4xl">
          We&apos;re here to help
        </h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
          Reach the Magizh Matrimony care team through any channel below. Please keep your Profile ID handy so we can
          assist you faster.
        </p>
      </header>

      {legalIsDraft && (
        <div
          role="note"
          className="mb-8 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3"
        >
          <Icon name="alert-circle" className="mt-0.5 shrink-0 text-warning" size={18} />
          <p className="text-sm leading-relaxed text-foreground">
            These support details are placeholders while we finalise our help centre. Contact information may change
            before launch.
          </p>
        </div>
      )}

      <section aria-labelledby="channels-heading" className="mb-10">
        <h2 id="channels-heading" className="sr-only">
          Contact channels
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.icon === "chat" ? "_blank" : undefined}
              rel={c.icon === "chat" ? "noopener noreferrer" : undefined}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="mt-4 text-sm text-muted-foreground">{c.label}</span>
              <span className="mt-0.5 break-words font-medium text-foreground group-hover:text-primary">
                {c.value}
              </span>
              <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.hint}</span>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="hours-heading">
        <h2 id="hours-heading" className="mb-3 font-serif text-xl text-foreground">
          Support hours
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <dl className="divide-y divide-border">
            {supportContact.hours.map((row) => (
              <div key={row.days} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-muted-foreground">{row.days}</dt>
                <dd className="text-right text-sm font-medium text-foreground">{row.time}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="clock" size={16} className="shrink-0" />
          {supportContact.responseTime}
        </p>
      </section>
    </main>
  )
}
