import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { ErrorStateView } from '@/components/errors/error-state-view'

export function AccessDeniedPage() {
  useDocumentTitle('Access denied | Matrimony')
  return (
    <ErrorStateView
      icon="lock"
      code="403"
      title="Access denied"
      message="You don't have permission to view this page. If you believe this is a mistake, contact support."
      actions={[
        { label: 'Back to dashboard', href: '/', variant: 'primary' },
        { label: 'Contact support', href: '/support', variant: 'secondary' },
      ]}
    />
  )
}

export function NotFoundPage() {
  useDocumentTitle('Page not found | Matrimony')
  return (
    <ErrorStateView
      icon="search"
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have moved."
      actions={[
        { label: 'Back to dashboard', href: '/', variant: 'primary' },
        { label: 'Browse matches', href: '/matches', variant: 'secondary' },
      ]}
    />
  )
}
