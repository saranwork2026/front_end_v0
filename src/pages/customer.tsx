import { useParams, useSearchParams } from 'react-router-dom'

import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { DashboardView, type DashboardPreview } from '@/components/dashboard/dashboard-view'
import { SearchView } from '@/components/search/search-view'
import { MatchesView, type MatchesPreview } from '@/components/matches/matches-view'
import { InterestsView } from '@/components/interests/interests-view'
import { ShortlistView, type ShortlistPreview } from '@/components/shortlist/shortlist-view'
import { AccessRequestsView } from '@/components/access-requests/access-requests-view'
import { ProfileDetailView } from '@/components/profile/profile-detail-view'
import { ProfileStatusView } from '@/components/status/profile-status-view'
import { WizardView } from '@/components/wizard/wizard-view'
import { PreferencesView } from '@/components/preferences/preferences-view'
import { ChatListView } from '@/components/chat/chat-list-view'
import { ChatConversationView } from '@/components/chat/chat-conversation-view'
import { NotificationsView } from '@/components/notifications/notifications-view'
import { NotificationDetailView } from '@/components/notifications/notification-detail-view'
import { ProfileViewsView } from '@/components/profile-views/profile-views-view'
import { ContactsView } from '@/components/contacts/contacts-view'
import { SupportView } from '@/components/support/support-view'
import { MyProfileView } from '@/components/profile/my-profile-view'
import { ProfileEditView, normalizeSection } from '@/components/profile/profile-edit-view'
import { PhotosView } from '@/components/photos/photos-view'
import { AccountView } from '@/components/account/account-view'
import { SuccessStoriesView } from '@/components/success-stories/success-stories-view'
import { SubmitSuccessStoryView } from '@/components/success-stories/submit-success-story-view'
import { resolveStatus } from '@/lib/status-data'
import { NotFoundPage } from './errors'

export function SuccessStoriesPage() {
  useDocumentTitle('Success stories | Matrimony')
  return <SuccessStoriesView />
}

export function SubmitSuccessStoryPage() {
  useDocumentTitle('Share your story | Matrimony')
  return <SubmitSuccessStoryView />
}

export function DashboardPage() {
  useDocumentTitle('Dashboard | Matrimony')
  const [params] = useSearchParams()
  const preview = (params.get('preview') as DashboardPreview | null) ?? undefined
  return <DashboardView preview={preview} />
}

export function SearchPage() {
  useDocumentTitle('Search | Matrimony')
  return <SearchView />
}

export function MatchesPage() {
  useDocumentTitle('Matches | Matrimony')
  const [params] = useSearchParams()
  const preview = (params.get('preview') as MatchesPreview | null) ?? undefined
  return <MatchesView preview={preview} />
}

export function InterestsPage() {
  useDocumentTitle('Interests | Matrimony')
  return <InterestsView />
}

export function ShortlistPage() {
  useDocumentTitle('Shortlist | Matrimony')
  const [params] = useSearchParams()
  const preview = (params.get('preview') as ShortlistPreview | null) ?? undefined
  return <ShortlistView preview={preview} />
}

export function AccessRequestsPage() {
  useDocumentTitle('Access requests | Matrimony')
  return <AccessRequestsView />
}

export function ProfileDetailPage() {
  useDocumentTitle('Profile | Matrimony')
  const { profileId = '' } = useParams()
  const [params] = useSearchParams()
  const previewState = params.get('state') ?? undefined
  return <ProfileDetailView profileId={profileId} previewState={previewState as never} />
}

export function ProfileStatusPage() {
  useDocumentTitle('Profile status | Matrimony')
  const [params] = useSearchParams()
  // Real page by default (status fetched from the profile). ?preview=1&state=
  // forces a specific design-preview state and shows the state switcher.
  const isPreview = params.get('preview') === '1'
  const previewStatus = isPreview ? resolveStatus(params.get('state') ?? undefined) : undefined
  return <ProfileStatusView previewStatus={previewStatus} />
}

export function WizardPage() {
  useDocumentTitle('Create profile | Matrimony')
  const [params] = useSearchParams()
  const state = params.get('state')
  const initialState = state === 'loading' ? 'loading' : 'ready'
  const empty = state === 'empty'
  return (
    <main className="px-0 md:px-6">
      <WizardView initialState={initialState} empty={empty} />
    </main>
  )
}

export function PartnerPreferencesPage() {
  useDocumentTitle('Partner preferences | Matrimony')
  const [params] = useSearchParams()
  const initial = params.get('state') === 'empty' ? 'empty' : 'saved'
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step 2 of 2</p>
        <h1 className="mt-1 font-serif text-2xl text-foreground text-balance sm:text-3xl">
          Your partner preferences
        </h1>
        <p className="mt-2 max-w-prose text-pretty text-muted-foreground">
          Tell us what you&apos;re looking for. Every field is optional — the more you share, the
          sharper your matches.
        </p>
      </header>
      <PreferencesView initial={initial} />
    </main>
  )
}

export function ChatListPage() {
  useDocumentTitle('Messages | Matrimony')
  const [params] = useSearchParams()
  const view = (params.get('state') as never) ?? undefined
  return <ChatListView state={view} />
}

export function ChatConversationPage() {
  useDocumentTitle('Chat | Matrimony')
  const { profileId = '' } = useParams()
  const [params] = useSearchParams()
  if (!profileId) return <NotFoundPage />
  const state = (params.get('state') as never) ?? undefined
  return <ChatConversationView profileId={profileId} state={state} />
}

export function NotificationsPage() {
  useDocumentTitle('Notifications | Matrimony')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  const initialPage = Number(params.get('page') ?? '1') || 1
  return <NotificationsView state={state} initialPage={initialPage} />
}

export function NotificationDetailPage() {
  useDocumentTitle('Notification | Matrimony')
  const { id = '' } = useParams()
  return <NotificationDetailView id={id} />
}

export function ProfileViewsPage() {
  useDocumentTitle('Profile views | Matrimony')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return <ProfileViewsView state={state} />
}

export function ContactsPage() {
  useDocumentTitle('Contacts | Matrimony')
  const [params] = useSearchParams()
  const viewState = (params.get('state') as never) ?? undefined
  return <ContactsView state={viewState} />
}

export function SupportPage() {
  useDocumentTitle('Support | Matrimony')
  return <SupportView />
}

export function MyProfilePage() {
  useDocumentTitle('My profile | Matrimony')
  return <MyProfileView />
}

export function ProfileEditPage() {
  useDocumentTitle('Edit profile | Matrimony')
  const [params] = useSearchParams()
  const section = normalizeSection(params.get('section') ?? undefined)
  return <ProfileEditView section={section} />
}

export function PhotosPage() {
  useDocumentTitle('Photos | Matrimony')
  return <PhotosView />
}

export function AccountPage() {
  useDocumentTitle('Account settings | Matrimony')
  return <AccountView />
}
