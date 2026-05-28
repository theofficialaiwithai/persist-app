import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { LayoutDashboard, Users, Settings } from 'lucide-react'

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

  // Redirect to onboarding if setup is incomplete, but not if already there
  if (!creator?.senderEmail && !pathname.includes('/dashboard/onboarding')) {
    redirect('/dashboard/onboarding')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/students', label: 'Students', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#F7F8FA]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#E5E7EB]">
          <span className="text-xl font-bold text-[#4F46E5] tracking-tight">
            Persist
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[rgba(79,70,229,0.1)] text-[#4F46E5] font-medium'
                    : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-[#E5E7EB]">
          <SignOutButton>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111827] transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
