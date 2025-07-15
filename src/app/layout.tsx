import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/lib/theme"
import { Toaster } from 'sonner'
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
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
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
