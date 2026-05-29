import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@clerk/nextjs'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { SetupBanner } from '@/components/dashboard/SetupBanner'
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

  // Redirect to onboarding if setup incomplete.
  // Allow /settings so users can complete setup there too.
  if (
    !creator?.senderEmail &&
    !pathname.includes('/dashboard/onboarding') &&
    !pathname.includes('/dashboard/settings')
  ) {
    redirect('/dashboard/onboarding')
  }

  return (
    <div className="flex h-screen bg-[#F7F8FA]">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#E5E7EB]">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">
            Persist
          </span>
        </div>

        {/* Nav links */}
        <SidebarNav />

        {/* Sign out */}
        <div className="p-3 border-t border-[#E5E7EB]">
          <SignOutButton>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111827] transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex flex-col">
        {!creator?.senderEmail && <SetupBanner />}
        <main className="flex-1">{children}</main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}
