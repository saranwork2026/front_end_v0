'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon, iconNames } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton, ProfileCardSkeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProfileCard } from '@/components/shared/profile-card'
import { SiteHeader } from '@/components/shared/site-header'
import { FilterBar, FilterChip } from '@/components/shared/filter-bar'
import { SectionShell, SubLabel } from '@/components/showcase/section-shell'
import {
  brandColors,
  demoProfiles,
  statusColors,
  surfaceColors,
  typeScale,
  type ColorToken,
} from '@/components/showcase/tokens'

function Swatch({ token }: { token: ColorToken }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className={`flex h-20 items-end p-3 ${token.className}`}>
        <span className={`text-xs font-medium ${token.textClassName}`}>
          Aa
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground">{token.name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {token.varName}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {token.note}
        </p>
      </div>
    </div>
  )
}

export function Showcase() {
  const [page, setPage] = useState(0)
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({
    'MGZ-100244': true,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const allFilters = ['Verified', 'With photo', 'Age 25–32', 'Chennai', 'Never married']
  const [filters, setFilters] = useState<string[]>(['Verified', 'With photo'])
  const toggleFilter = (label: string) =>
    setFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label],
    )

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Foundations — Color */}
      <SectionShell
        id="color"
        eyebrow="Foundations"
        title="Color system"
        description="A warm, trust-forward palette anchored by deep maroon, with champagne gold and crimson reserved for premium and affinity moments. Status colors stay legible on ivory surfaces."
        className="border-t-0"
      >
        <SubLabel>Brand</SubLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {brandColors.map((t) => (
            <Swatch key={t.varName} token={t} />
          ))}
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <SubLabel>Surfaces &amp; neutrals</SubLabel>
            <div className="grid grid-cols-2 gap-4">
              {surfaceColors.map((t) => (
                <Swatch key={t.varName} token={t} />
              ))}
            </div>
          </div>
          <div>
            <SubLabel>Status</SubLabel>
            <div className="grid grid-cols-3 gap-4">
              {statusColors.map((t) => (
                <Swatch key={t.varName} token={t} />
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Foundations — Typography */}
      <SectionShell
        id="typography"
        eyebrow="Foundations"
        title="Typography"
        description="Playfair Display carries editorial, emotional headings. Inter handles all UI and body copy for clarity. Geist Mono is reserved for profile IDs and codes."
      >
        <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border bg-card">
          {typeScale.map((t) => (
            <div
              key={t.label}
              className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <p className={`${t.className} text-foreground text-pretty`}>
                  {t.sample}
                </p>
              </div>
              <div className="shrink-0 text-left sm:w-56 sm:text-right">
                <p className="text-sm font-semibold text-foreground">
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground">{t.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Foundations — Icons */}
      <SectionShell
        id="icons"
        eyebrow="Foundations"
        title="Icon set"
        description="A single stroke-based set on a 24px grid using currentColor. Every glyph lives in one file — no emoji, no one-off inline SVGs."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {iconNames.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-foreground"
            >
              <Icon name={name} size={22} />
              <span className="truncate text-[11px] text-muted-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Components — Navigation */}
      <SectionShell
        id="navigation"
        eyebrow="Components"
        title="Global header & navigation"
        description="One header drives the whole app: brand mark, desktop navigation with an active state, and account actions. On mobile it collapses to a menu button that opens navigation in a bottom sheet."
      >
        <SubLabel>Desktop &amp; mobile header (resize to preview the mobile menu)</SubLabel>
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <SiteHeader className="static" />
          <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
            Application content sits below the header.
          </div>
        </div>
      </SectionShell>

      {/* Components — Buttons */}
      <SectionShell
        id="buttons"
        eyebrow="Components"
        title="Buttons"
        description="Consistent 44px minimum touch target across variants, with a loading state and icon support baked in."
      >
        <div className="space-y-6">
          <div>
            <SubLabel>Variants</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Send interest</Button>
              <Button variant="gold">
                <Icon name="sparkles" size={16} />
                Upgrade to Premium
              </Button>
              <Button variant="heart">
                <Icon name="heart" size={16} />
                Like profile
              </Button>
              <Button variant="secondary">View profile</Button>
              <Button variant="ghost">Skip</Button>
              <Button variant="danger">Block</Button>
              <Button variant="link">Learn more</Button>
            </div>
          </div>
          <div>
            <SubLabel>Sizes &amp; states</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Message">
                <Icon name="chat" size={18} />
              </Button>
              <Button loading>Sending</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Components — Forms */}
      <SectionShell
        id="forms"
        eyebrow="Components"
        title="Form controls"
        description="Labelled inputs and selects with hint, error, and disabled states. Errors are announced to assistive tech via role=alert."
      >
        <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
          <Input label="Full name" placeholder="Priya Ramesh" />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            hint="We never share your email publicly."
          />
          <Input
            label="Phone"
            defaultValue="98765"
            error="Enter a valid 10-digit number."
          />
          <Select label="Looking for" defaultValue="">
            <option value="" disabled>
              Select preference
            </option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </Select>
          <Input label="Disabled" placeholder="Read only" disabled />
          <Select label="Disabled" disabled>
            <option>Unavailable</option>
          </Select>
        </div>
      </SectionShell>

      {/* Components — Badges */}
      <SectionShell
        id="badges"
        eyebrow="Components"
        title="Badges &amp; status"
        description="Badges label plans and affinities; StatusBadge maps domain statuses to a consistent color language automatically."
      >
        <div className="space-y-6">
          <div>
            <SubLabel>Badge variants</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary">Premium</Badge>
              <Badge variant="gold">
                <Icon name="star-filled" size={12} />
                Featured
              </Badge>
              <Badge variant="heart">
                <Icon name="heart-filled" size={12} />
                Interested
              </Badge>
              <Badge variant="success">Verified</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="danger">Blocked</Badge>
              <Badge variant="neutral">Draft</Badge>
            </div>
          </div>
          <div>
            <SubLabel>Status badges (domain-mapped)</SubLabel>
            <div className="flex flex-wrap items-center gap-3">
              {['APPROVED', 'UNDER_REVIEW', 'PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED', 'DRAFT', 'DEACTIVATED'].map(
                (s) => (
                  <StatusBadge key={s} status={s} />
                ),
              )}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Components — Cards */}
      <SectionShell
        id="cards"
        eyebrow="Components"
        title="Cards"
        description="The base surface for grouped content, from settings panels to informational callouts."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Partner preferences</CardTitle>
              <CardDescription>
                Set the criteria we use to recommend matches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">Age 25–32</Badge>
                <Badge variant="neutral">Chennai</Badge>
                <Badge variant="neutral">Post-graduate</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-gold">
                  <Icon name="sparkles" size={20} />
                </span>
                Upgrade to Premium
              </CardTitle>
              <CardDescription>
                See who viewed you, send unlimited interests, and unlock contact
                details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="gold">View plans</Button>
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      {/* Composites — Profile cards */}
      <SectionShell
        id="profile-cards"
        eyebrow="Composites"
        title="Profile card"
        description="The core discovery unit. Composes photo, verification, featured and match badges, a shortlist toggle, and only the fields defined in the data model."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoProfiles.map((p) => (
            <ProfileCard
              key={p.profileId}
              profile={p}
              showShortlistButton
              isShortlisted={!!shortlisted[p.profileId]}
              onShortlistToggle={(id) =>
                setShortlisted((prev) => ({ ...prev, [id]: !prev[id] }))
              }
            />
          ))}
        </div>
      </SectionShell>

      {/* Components — Filters */}
      <SectionShell
        id="filters"
        eyebrow="Components"
        title="Filters"
        description="A filter bar summarizes what's applied with removable chips and a count on the trigger. The full option set opens in a bottom sheet on mobile — the standard pattern for narrowing a match list."
      >
        <div className="space-y-6">
          <div>
            <SubLabel>Filter bar with applied chips</SubLabel>
            <FilterBar
              activeFilters={filters}
              onOpen={() => setSheetOpen(true)}
              onRemove={toggleFilter}
              onClear={() => setFilters([])}
            />
          </div>
          <div>
            <SubLabel>Toggle chips</SubLabel>
            <div className="flex flex-wrap gap-2.5">
              {allFilters.map((label) => (
                <FilterChip
                  key={label}
                  label={label}
                  active={filters.includes(label)}
                  onClick={() => toggleFilter(label)}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Components — Overlays */}
      <SectionShell
        id="overlays"
        eyebrow="Components"
        title="Dialogs & bottom sheets"
        description="Modal surfaces for focused decisions. Dialogs center on desktop for confirmations; bottom sheets slide up on mobile for filters and menus. Both lock scroll, trap focus, and close on Escape or backdrop."
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open bottom sheet
          </Button>
        </div>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Send interest to Priya?"
          description="She'll be notified that you'd like to connect. You can withdraw this anytime from your Interests."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialogOpen(false)}>
                <Icon name="heart" size={16} />
                Send interest
              </Button>
            </>
          }
        >
          <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
            <Icon name="shield" size={20} className="text-success" />
            <p className="text-sm text-muted-foreground">
              Your contact details stay private until you both connect.
            </p>
          </div>
        </Dialog>

        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filter matches"
          footer={
            <>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setFilters([])
                  setSheetOpen(false)
                }}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Show results
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {allFilters.map((label) => (
              <FilterChip
                key={label}
                label={label}
                active={filters.includes(label)}
                onClick={() => toggleFilter(label)}
              />
            ))}
          </div>
        </BottomSheet>
      </SectionShell>

      {/* Components — Loading */}
      <SectionShell
        id="loading"
        eyebrow="Components"
        title="Loading states"
        description="Skeletons preserve layout while match data loads, preventing shift; spinners cover inline and button-level waits. Both keep the wait calm and on-brand."
      >
        <div className="space-y-6">
          <div>
            <SubLabel>Spinners &amp; inline loading</SubLabel>
            <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card p-6">
              <span className="text-primary">
                <Spinner size={28} />
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size={18} />
                Finding your matches…
              </span>
              <Button loading>Sending</Button>
            </div>
          </div>
          <div>
            <SubLabel>Profile card skeletons</SubLabel>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProfileCardSkeleton />
              <ProfileCardSkeleton />
              <ProfileCardSkeleton />
            </div>
          </div>
          <div>
            <SubLabel>Text block skeleton</SubLabel>
            <div className="max-w-md space-y-3 rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Components — Empty states & pagination */}
      <SectionShell
        id="states"
        eyebrow="Components"
        title="Empty states &amp; pagination"
        description="Graceful zero-data messaging with a clear next action, plus a windowed, accessible pager for match lists."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyState
            icon="users"
            title="No matches yet"
            description="Broaden your partner preferences to see more compatible profiles."
            action={<Button variant="primary">Adjust preferences</Button>}
          />
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-6">
            <Pagination page={page} totalPages={8} onPageChange={setPage} />
          </div>
        </div>
      </SectionShell>
    </div>
  )
}
