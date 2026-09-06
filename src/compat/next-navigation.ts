import { useMemo } from 'react'
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom'

/** Mirrors the subset of the `next/navigation` App Router API the app uses. */
export function useRouter() {
  const navigate = useNavigate()
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate],
  )
}

export function usePathname(): string {
  return useLocation().pathname
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams()
  return params
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  return useRouterParams() as T
}

export function redirect(href: string): never {
  window.location.assign(href)
  throw new Error('NEXT_REDIRECT')
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND')
}
