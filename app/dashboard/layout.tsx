import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  // Redirect to onboarding if setup incomplete, but not if already there
  if (!creator?.senderEmail && !pathname.includes('/dashboard/onboarding')) {
    redirect('/dashboard/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* ── Top nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: logo + nav links */}
          <div className="flex items-center">
            <span className="text-base font-semibold text-indigo-600 tracking-tight">
              Persist
            </span>
            <DashboardNav />
          </div>

          {/* Right: user avatar + sign out */}
          <UserMenu />
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

      <Toaster richColors position="top-right" />
    </div>
  )
}
