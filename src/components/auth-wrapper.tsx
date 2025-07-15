'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Squares } from '@/components/ui/squares-background'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { MainLayout } from '@/components/layout/main-layout'
import { SidebarProvider } from '@/components/ui/sidebar'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { useEffect } from "react";

interface AuthWrapperProps {
  children: React.ReactNode
  setShowGlobalBackground?: (show: boolean) => void
}

export function AuthWrapper({ children, setShowGlobalBackground }: AuthWrapperProps) {
  const { isLoaded, isSignedIn } = useUser()
  const pathname = usePathname()

  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

  // Only update background visibility in an effect
  useEffect(() => {
    if (!isLoaded) {
      setShowGlobalBackground?.(true);
    } else if (isAuthPage) {
      setShowGlobalBackground?.(true);
    } else if (!isSignedIn) {
      setShowGlobalBackground?.(false);
    } else {
      setShowGlobalBackground?.(true);
    }
  }, [isLoaded, isSignedIn, isAuthPage, setShowGlobalBackground]);

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="absolute inset-0 -z-10">
          <div className="hidden dark:block">
            <Squares
              direction="diagonal"
              speed={0.5}
              squareSize={50}
              hoverFillColor="hsl(var(--accent))"
              className="opacity-30"
            />
          </div>
        </div>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // If on auth pages, render them full screen regardless of sign-in status
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        {children}
      </div>
    )
  }

  // If not signed in and not on auth pages, show sign-in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background relative">
        <div className="fixed inset-0 -z-10">
          {/* TEMPORARY DEBUG: Red overlay to test stacking */}
          <div className="fixed inset-0 bg-red-500 opacity-50 z-50 pointer-events-none"></div>
          <BackgroundPaths />
        </div>
        <div className="text-center max-w-md mx-auto mx-4 sm:mx-auto p-8 px-4 sm:px-8 bg-background rounded-xl border border-border shadow-lg relative z-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Chess Chutiye</h1>
            <p className="text-muted-foreground">Please sign in to access your account</p>
          </div>
          <div className="space-y-4">
            <Link 
              href="/sign-in" 
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // User is signed in, wrap with MainLayout
  return (
    <SidebarProvider>
      <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  )
}