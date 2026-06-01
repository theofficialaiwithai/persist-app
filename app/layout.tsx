import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ServiceWorkerRegistration } from '@/components/ui/service-worker'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Persist',
  description: "Re-engage students who've gone quiet",
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider signUpForceRedirectUrl="/dashboard/onboarding" signInFallbackRedirectUrl="/dashboard">
      <html lang="en" className={inter.variable}>
        <head>
          <meta name="theme-color" content="#004643" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Persist" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        </head>
        <body className="antialiased">
          <ServiceWorkerRegistration />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
