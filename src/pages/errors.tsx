import { useTranslation } from 'react-i18next'

import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { ErrorStateView } from '@/components/errors/error-state-view'

export function AccessDeniedPage() {
  const { t } = useTranslation()
  useDocumentTitle('Access denied | Matrimony')
  return (
    <ErrorStateView
      icon="lock"
      code="403"
      title={t('page.errorsPage.accessDeniedTitle')}
      message={t('page.errorsPage.accessDeniedMsg')}
      actions={[
        { label: t('page.errorsPage.backToDashboard'), href: '/', variant: 'primary' },
        { label: t('page.errorsPage.contactSupport'), href: '/support', variant: 'secondary' },
      ]}
    />
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  useDocumentTitle('Page not found | Matrimony')
  return (
    <ErrorStateView
      icon="search"
      code="404"
      title={t('page.errorsPage.notFoundTitle')}
      message={t('page.errorsPage.notFoundMsg')}
      actions={[
        { label: t('page.errorsPage.backToDashboard'), href: '/', variant: 'primary' },
        { label: t('page.errorsPage.browseMatches'), href: '/matches', variant: 'secondary' },
      ]}
    />
  )
}
