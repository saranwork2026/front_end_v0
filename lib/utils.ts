import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * CSS object-position for a member's DP crop, from the stored focal point
 * (percentages 0–100). Falls back to "top" when there's no focal point OR when
 * it's the untouched default (50/50 center) — for a full-body photo, center
 * shows the torso, so "top" (where the face usually is) is the safer default
 * until the member positions their face on the /photos DP editor.
 */
export function focalPosition(x?: number | null, y?: number | null): string {
  if (x == null || y == null) return 'top'
  if (x === 50 && y === 50) return 'top'
  return `${x}% ${y}%`
}

/**
 * Scroll the app's content area back to the top. The authenticated shell
 * (UserLayout) is `h-dvh overflow-hidden` and scrolls inside its `<main>`, so
 * `window.scrollTo` is a no-op there. This targets that `<main>` element and
 * falls back to the window for any surface that scrolls the document itself.
 *
 * Use after actions that replace the visible list in place (e.g. paginating),
 * where a route change (handled by UserLayout's scroll reset) doesn't fire.
 */
export function scrollMainToTop(behavior: ScrollBehavior = 'smooth') {
  if (typeof document === 'undefined') return
  const main = document.querySelector('main')
  if (main && main.scrollHeight > main.clientHeight) {
    main.scrollTo({ top: 0, left: 0, behavior })
  } else {
    window.scrollTo({ top: 0, left: 0, behavior })
  }
}
