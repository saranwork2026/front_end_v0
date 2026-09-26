import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import AuthGuard from './AuthGuard'
import { authStore } from '../stores/auth'

/**
 * Renders the app-relevant slice of the route tree behind AuthGuard so we can
 * assert the observable landing behavior:
 *  - unauthenticated            -> /login
 *  - USER on a USER-only route  -> renders the guarded outlet
 *  - ADMIN on a USER-only route -> /admin (NOT /access-denied)
 *  - USER on an admin route     -> /access-denied
 *
 * Mirrors the real App.tsx structure: a USER-only subtree
 * (allowedRoles="USER") and an admin subtree
 * (allowedRoles={['ADMIN_REQUESTER','ADMIN_APPROVER']}).
 */
function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/access-denied" element={<div>access denied page</div>} />

        {/* USER-only area (the root `/` lives here in App.tsx). */}
        <Route element={<AuthGuard allowedRoles="USER" />}>
          <Route path="/" element={<div>user dashboard</div>} />
        </Route>

        {/* Admin area. */}
        <Route element={<AuthGuard allowedRoles={['ADMIN_REQUESTER', 'ADMIN_APPROVER']} />}>
          <Route path="/admin" element={<div>admin dashboard</div>} />
          <Route path="/admin/users" element={<div>admin users</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    // Reset to a clean, logged-out session between tests (no shared state).
    authStore.getState().clearAuth()
  })

  it('should redirect to /login when the user is not authenticated', () => {
    renderAt('/')
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('should render the guarded outlet when an authenticated USER hits a USER route', () => {
    authStore.getState().setSession({
      profileId: 'SM1',
      userId: 'user-ulid-1',
      role: 'USER',
      userStatus: 'ACTIVE',
      profileStatus: 'APPROVED',
    })
    renderAt('/')
    expect(screen.getByText('user dashboard')).toBeTruthy()
  })

  it('should redirect an authenticated ADMIN on a USER route to /admin (not /access-denied)', () => {
    authStore.getState().setSession({
      profileId: 'SM2',
      userId: 'admin-ulid-1',
      role: 'ADMIN_APPROVER',
      userStatus: 'ACTIVE',
      profileStatus: null,
    })
    renderAt('/')
    expect(screen.getByText('admin dashboard')).toBeTruthy()
    expect(screen.queryByText('access denied page')).toBeNull()
  })

  it('should also redirect an ADMIN_REQUESTER landing on the root to /admin', () => {
    authStore.getState().setSession({
      profileId: 'SM3',
      userId: 'admin-ulid-2',
      role: 'ADMIN_REQUESTER',
      userStatus: 'ACTIVE',
      profileStatus: null,
    })
    renderAt('/')
    expect(screen.getByText('admin dashboard')).toBeTruthy()
  })

  it('should redirect an authenticated USER hitting an admin route to /access-denied', () => {
    authStore.getState().setSession({
      profileId: 'SM4',
      userId: 'user-ulid-2',
      role: 'USER',
      userStatus: 'ACTIVE',
      profileStatus: 'APPROVED',
    })
    renderAt('/admin/users')
    expect(screen.getByText('access denied page')).toBeTruthy()
    expect(screen.queryByText('admin users')).toBeNull()
  })

  it('should let an authenticated ADMIN render the admin area (no redirect loop)', () => {
    authStore.getState().setSession({
      profileId: 'SM5',
      userId: 'admin-ulid-3',
      role: 'ADMIN_APPROVER',
      userStatus: 'ACTIVE',
      profileStatus: null,
    })
    renderAt('/admin')
    expect(screen.getByText('admin dashboard')).toBeTruthy()
  })
})
