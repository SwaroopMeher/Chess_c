'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser, SignOutButton, UserButton } from '@clerk/nextjs'
import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from 'lucide-react'
import { isAdminUser } from '@/lib/supabase'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingResults] = useState(0) // TODO: Implement real-time updates in Phase 3

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setIsAdmin(isAdminUser(user.primaryEmailAddress.emailAddress))
    }
  }, [user])

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // If not signed in, return null - let the app handle authentication at the layout level
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="flex h-full w-full relative">
      <AppSidebar isAdmin={isAdmin} pendingResults={pendingResults} />
      <SidebarInset className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold truncate">Chess Chutiye</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              
              {/* Mobile: Theme toggle + profile dropdown */}
              <div className="sm:hidden">
                <ThemeToggle />
              </div>
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 bg-background hover:bg-accent">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background text-popover-foreground border border-border shadow-lg">
                    <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                      <div className="flex flex-col items-start p-2">
                        <span className="text-sm font-medium truncate w-full text-foreground">
                          {user?.firstName || user?.username}
                        </span>
                        {isAdmin && <span className="text-xs text-amber-500">Admin</span>}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                      <Link href="/user-profile" className="w-full text-foreground hover:text-accent-foreground">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                      <SignOutButton>
                        <span className="w-full text-left text-foreground hover:text-accent-foreground">Sign Out</span>
                      </SignOutButton>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Full layout */}
              <div className="hidden sm:flex items-center gap-2">
                {user && (
                  <span className="text-sm text-muted-foreground hidden md:block">
                    Welcome, {user.firstName || user.username}
                    {isAdmin && <span className="ml-1 text-amber-500">(Admin)</span>}
                  </span>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 bg-background hover:bg-accent">
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-6 h-6"
                          }
                        }}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background text-popover-foreground border border-border shadow-lg">
                    <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                      <Link href="/user-profile" className="w-full text-foreground hover:text-accent-foreground">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                      <SignOutButton>
                        <span className="w-full text-left text-foreground hover:text-accent-foreground">Sign Out</span>
                      </SignOutButton>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </div>
  )
} 