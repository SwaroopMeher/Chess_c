import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/lib/theme"
import { TournamentProvider } from "@/lib/tournament-context"
import { AuthWrapper } from "@/components/auth-wrapper"
import { Squares } from "@/components/ui/squares-background"
import { Toaster } from 'sonner'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Tournament Tracker",
  description: "Manage and track chess tournaments with real-time updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background text-foreground`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <div className="relative h-full w-full">
              <div className="fixed inset-0 -z-10">
                <Squares
                  direction="diagonal"
                  speed={0.5}
                  squareSize={50}
                  hoverFillColor="hsl(var(--accent))"
                  className="opacity-30"
                />
              </div>
              <AuthWrapper>
                <TournamentProvider>
                  {children}
                </TournamentProvider>
              </AuthWrapper>
              <Toaster />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
