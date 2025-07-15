"use client";

import React, { useState } from "react";
import { Squares } from "@/components/ui/squares-background";
import { AuthWrapper } from "@/components/auth-wrapper";
import { TournamentProvider } from "@/lib/tournament-context";
import { BackgroundPaths } from "@/components/ui/background-paths";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const [showGlobalBackground, setShowGlobalBackground] = useState(true);
  return (
    <div className="relative h-full w-full">
      {showGlobalBackground && (
        <div className="fixed inset-0 -z-10">
          <Squares
            direction="diagonal"
            speed={0.5}
            squareSize={50}
            hoverFillColor="hsl(var(--accent))"
            className="opacity-30"
          />
        </div>
      )}
      {/* DEBUG: Show red overlay and animation when sign-in prompt is active */}
      {!showGlobalBackground && (
        <div className="fixed inset-0 -z-10">
          <div className="fixed inset-0 bg-red-500 opacity-50 z-50 pointer-events-none"></div>
          <BackgroundPaths />
        </div>
      )}
      <AuthWrapper setShowGlobalBackground={setShowGlobalBackground}>
        <TournamentProvider>{children}</TournamentProvider>
      </AuthWrapper>
    </div>
  );
} 