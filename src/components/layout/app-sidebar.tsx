'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  Users, 
  Trophy, 
  Calendar, 
  BarChart3,
  Play,
  UserPlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'

interface NavigationItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Players',
    url: '/players',
    icon: Users,
  },
  {
    title: 'Registration',
    url: '/registration',
    icon: UserPlus,
  },
  {
    title: 'Tournament',
    url: '/tournament',
    icon: Trophy,
    adminOnly: true,
  },
  {
    title: 'Schedule',
    url: '/schedule',
    icon: Calendar,
  },
  {
    title: 'Matches',
    url: '/matches',
    icon: Play,
  },
  {
    title: 'Leaderboard',
    url: '/leaderboard',
    icon: BarChart3,
  },
]

interface AppSidebarProps {
  isAdmin?: boolean
  pendingResults?: number
}

export function AppSidebar({ isAdmin = false, pendingResults = 0 }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border h-16 bg-background">
        <div className="flex items-center gap-2 px-4 h-full">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Tournament Tracker</h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className={cn(
                      'w-full justify-start hover:bg-accent hover:text-accent-foreground py-2 px-3 text-sm',
                      'transition-colors duration-200 text-card-foreground',
                      pathname === item.url && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Link href={item.url} className="flex items-center gap-3 min-h-[2.5rem]" onClick={handleNavClick}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {item.title === 'Matches' && pendingResults > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">
                          {pendingResults}
                        </Badge>
                      )}
                      {item.adminOnly && (
                        <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5">
                          Admin
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground hidden sm:block">
            May you win
          </div>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
} 