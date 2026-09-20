'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Top-level React error boundary. Catches render/lifecycle errors thrown
 * anywhere below it so a single component crash degrades to a recoverable
 * fallback instead of a blank white screen (React unmounts the whole tree on
 * an uncaught render error).
 *
 * This app uses declarative <Routes> (react-router BrowserRouter), not the
 * data-router `errorElement` API, so a class boundary wrapping <App/> is the
 * right mechanism. Mounted in main.tsx around the app.
 *
 * Note: error boundaries only catch errors during render, in lifecycle
 * methods, and in constructors of the tree below them. They do NOT catch
 * errors in event handlers, async code, or SSR — those are already handled
 * per-call by the app's try/catch + toast pattern.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for diagnostics. A real error-reporting hook (Sentry, etc.) can be
    // wired in here later; for now the console keeps it visible in dev/support.
    console.error('Unhandled render error caught by ErrorBoundary:', error, info.componentStack)
  }

  private handleReload = () => {
    // Full reload is the safest recovery: it rebuilds the whole React tree and
    // re-runs data fetches from a clean state.
    window.location.reload()
  }

  private handleHome = () => {
    // Hard navigation (not router push) so we leave the crashed tree entirely.
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Icon name="alert-circle" size={30} />
          </span>
          <h1 className="mt-6 text-balance font-serif text-3xl text-foreground sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-pretty leading-relaxed text-muted-foreground">
            An unexpected error interrupted this page. Reloading usually fixes it. If it keeps
            happening, please contact support.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={this.handleReload}>
              Try again
            </Button>
            <Button variant="secondary" size="lg" onClick={this.handleHome}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </main>
    )
  }
}
