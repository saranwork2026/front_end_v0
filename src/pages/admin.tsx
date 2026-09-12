import { useParams, useSearchParams } from 'react-router-dom'

import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { AdminShell } from '@/components/admin/admin-shell'
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view'
import { AdminUsersView } from '@/components/admin/admin-users-view'
import { AdminUserDetailView } from '@/components/admin/admin-user-detail-view'
import { AdminAssistedProfileView } from '@/components/admin/admin-assisted-profile-view'
import { AdminModerationView } from '@/components/admin/admin-moderation-view'
import { AdminReportsView } from '@/components/admin/admin-reports-view'
import { AdminFlaggedUsersView } from '@/components/admin/admin-flagged-users-view'
import { AdminFlaggedMessagesView } from '@/components/admin/admin-flagged-messages-view'
import { AdminPlansView } from '@/components/admin/admin-plans-view'
import { AdminVerificationsView } from '@/components/admin/admin-verifications-view'
import { AdminBroadcastView } from '@/components/admin/admin-broadcast-view'
import { AdminAuditView } from '@/components/admin/admin-audit-view'
import { AdminActivityView } from '@/components/admin/admin-activity-view'
import { AdminSessionsView } from '@/components/admin/admin-sessions-view'
import { AdminSuccessStoriesView } from '@/components/admin/admin-success-stories-view'
import { AdminAdBannersView } from '@/components/admin/admin-ad-banners-view'
import { AdminNotificationPolicyView } from '@/components/admin/admin-notification-policy-view'

type AdminRole = 'ADMIN' | 'ADMIN_APPROVER'

/**
 * Optional `?role=` override for the moderation/broadcast role tab. When
 * absent, the views derive the correct default from the signed-in admin's
 * real session role.
 */
function role(params: URLSearchParams): AdminRole | undefined {
  const r = params.get('role')
  if (r === 'reviewer') return 'ADMIN'
  if (r === 'approver') return 'ADMIN_APPROVER'
  return undefined
}

export function AdminDashboardPage() {
  useDocumentTitle('Admin · Dashboard')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin">
      <AdminDashboardView initialState={state} />
    </AdminShell>
  )
}

export function AdminUsersPage() {
  useDocumentTitle('Admin · Users')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/users">
      <AdminUsersView state={state} />
    </AdminShell>
  )
}

export function AdminUserDetailPage() {
  useDocumentTitle('Admin · User detail')
  const { profileId = '' } = useParams()
  return (
    <AdminShell activeHref="/admin/users">
      <AdminUserDetailView profileId={profileId} />
    </AdminShell>
  )
}

export function AdminAssistedProfilePage() {
  useDocumentTitle('Admin · Assisted profile')
  const { profileId = '' } = useParams()
  return (
    <AdminShell activeHref="/admin/users">
      <AdminAssistedProfileView profileId={profileId} />
    </AdminShell>
  )
}

export function AdminModerationPage() {
  useDocumentTitle('Admin · Moderation')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/moderation">
      <AdminModerationView initialRole={role(params)} initialState={state} />
    </AdminShell>
  )
}

export function AdminReportsPage() {
  useDocumentTitle('Admin · Reports')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/reports">
      <AdminReportsView initialState={state} />
    </AdminShell>
  )
}

export function AdminFlaggedUsersPage() {
  useDocumentTitle('Admin · Flagged users')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/flagged">
      <AdminFlaggedUsersView state={state} />
    </AdminShell>
  )
}

export function AdminFlaggedMessagesPage() {
  useDocumentTitle('Admin · Flagged messages')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/flagged-messages">
      <AdminFlaggedMessagesView state={state} />
    </AdminShell>
  )
}

export function AdminPlansPage() {
  useDocumentTitle('Admin · Plans')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/plans">
      <AdminPlansView initialState={state} />
    </AdminShell>
  )
}

export function AdminVerificationsPage() {
  useDocumentTitle('Admin · Verifications')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/verifications">
      <AdminVerificationsView initialState={state} />
    </AdminShell>
  )
}

export function AdminBroadcastPage() {
  useDocumentTitle('Admin · Broadcast')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return (
    <AdminShell activeHref="/admin/broadcast">
      <AdminBroadcastView initialRole={role(params)} initialState={state} />
    </AdminShell>
  )
}

export function AdminAuditPage() {
  useDocumentTitle('Admin · Audit')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? 'ready'
  return (
    <AdminShell activeHref="/admin/audit">
      <AdminAuditView initialState={state} />
    </AdminShell>
  )
}

export function AdminActivityPage() {
  useDocumentTitle('Admin · Activity')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? 'ready'
  return (
    <AdminShell activeHref="/admin/activity">
      <AdminActivityView initialState={state} />
    </AdminShell>
  )
}

export function AdminSessionsPage() {
  useDocumentTitle('Admin · Sessions')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? 'ready'
  return (
    <AdminShell activeHref="/admin/sessions">
      <AdminSessionsView initialState={state} role={role(params)} />
    </AdminShell>
  )
}

export function AdminSuccessStoriesPage() {
  useDocumentTitle('Admin · Success stories')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  const isApprover = params.get('role') === 'approver'
  return (
    <AdminShell activeHref="/admin/success-stories">
      <AdminSuccessStoriesView initialState={state} isApprover={isApprover} />
    </AdminShell>
  )
}

export function AdminAdBannersPage() {
  useDocumentTitle('Admin · Vendor ads')
  const [params] = useSearchParams()
  const isApprover = params.get('role') === 'approver'
  return (
    <AdminShell activeHref="/admin/ad-banners">
      <AdminAdBannersView isApprover={isApprover} />
    </AdminShell>
  )
}

export function AdminNotificationPolicyPage() {
  useDocumentTitle('Admin · Notification settings')
  return (
    <AdminShell activeHref="/admin/notification-policy">
      <AdminNotificationPolicyView />
    </AdminShell>
  )
}
