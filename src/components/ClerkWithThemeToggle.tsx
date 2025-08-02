'use client'

import React from 'react'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BackgroundPaths } from "@/components/ui/background-paths"

interface ClerkWithThemeToggleProps {
  children: React.ReactNode
}

export function ClerkWithThemeToggle({ children }: ClerkWithThemeToggleProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <BackgroundPaths />
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Clerk Content */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        {children}
      </div>
    </div>
  )
} 