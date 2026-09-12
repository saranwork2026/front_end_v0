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
