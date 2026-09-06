import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

type NextLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname?: string; query?: Record<string, string> }
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  children?: ReactNode
}

function hrefToString(href: NextLinkProps['href']): string {
  if (typeof href === 'string') return href
  const path = href?.pathname ?? '/'
  const query = href?.query
  if (!query) return path
  const search = new URLSearchParams(query).toString()
  return search ? `${path}?${search}` : path
}

/**
 * Drop-in replacement for `next/link` backed by react-router. External links,
 * anchors, mailto/tel and hash targets fall back to a plain <a>.
 */
const NextLink = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(
  { href, prefetch: _prefetch, replace, scroll: _scroll, shallow: _shallow, children, ...rest },
  ref,
) {
  const to = hrefToString(href)
  const isExternal = /^([a-z]+:|\/\/|#)/i.test(to)
  if (isExternal) {
    return (
      <a ref={ref} href={to} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <RouterLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </RouterLink>
  )
})

export default NextLink
