import { useEffect } from 'react'

/**
 * SPA replacement for Next's per-route `metadata`. Sets document.title while a
 * route is mounted and restores the previous title on unmount.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
