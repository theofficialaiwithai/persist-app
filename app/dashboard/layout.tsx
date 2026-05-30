'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { Toaster } from 'sonner'

const navItems = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/students', label: 'Students',  icon: Users,           exact: false },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings,        exact: false },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Rehydrate collapse state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col bg-white border-r border-[#E5E7EB] flex-shrink-0 overflow-hidden relative"
      >

        {/* Logo + collapse toggle */}
        <div
          className={cn(
            'flex items-center h-16 px-5 border-b border-[#E5E7EB] flex-shrink-0',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="font-bold text-indigo-600 text-lg"
              >
                Persist
              </motion.span>
            )}
          </AnimatePresence>

          <button
            onClick={toggleCollapsed}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA] transition-colors flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft  className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-6 px-2 space-y-2 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center rounded-lg transition-colors group',
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA]',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive && 'text-indigo-600',
                  )}
                />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'text-sm font-medium whitespace-nowrap overflow-hidden',
                        isActive ? 'text-indigo-600' : '',
                      )}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Profile dropdown at bottom */}
        <div className="p-2 border-t border-[#E5E7EB]">
          <ProfileDropdown collapsed={collapsed} />
        </div>
      </motion.aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}
