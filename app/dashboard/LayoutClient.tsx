'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { CommandPalette, type PaletteStudent } from '@/components/ui/command-palette'
import { Toaster } from 'sonner'

// ── Types passed from the server layout ──────────────────────────────────────

export interface SidebarCreator {
  senderName: string
  name: string
  coursePlatform: string
  profileImageUrl: string | null
}

interface LayoutClientProps {
  creator: SidebarCreator
  totalStudents: number
  activeCourses: number
  students: PaletteStudent[]
  children: React.ReactNode
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const navItems = [
  { href: '/dashboard/profile',  label: 'Profile',   icon: UserCircle,     exact: true  },
  { href: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/students', label: 'Students',   icon: Users,          exact: false },
  { href: '/dashboard/settings', label: 'Settings',   icon: Settings,       exact: false },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function LayoutClient({ creator, totalStudents, activeCourses, students, children }: LayoutClientProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [collapsed, setCollapsed] = useState(false)

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

  // Derived display values
  const firstName = creator.senderName?.split(' ')[0] || creator.name?.split(' ')[0] || 'Creator'
  const initials  = (creator.senderName || creator.name || 'C')
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const platformLabel = creator.coursePlatform
    ? creator.coursePlatform.charAt(0).toUpperCase() + creator.coursePlatform.slice(1)
    : 'Course Creator'

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col bg-white border-r border-[#E5E7EB] flex-shrink-0 overflow-hidden relative"
      >
        {/* Logo + collapse toggle */}
        <div className={cn(
          'flex items-center h-16 px-5 border-b border-[#E5E7EB] flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
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

        {/* ── Mini profile card ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="card-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mx-2 mt-3 mb-1 p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
              onClick={() => router.push('/dashboard/profile')}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                  {creator.profileImageUrl
                    ? <img src={creator.profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{firstName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{platformLabel}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              </div>
              {/* Status indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-[#6B7280]">
                  {totalStudents} student{totalStudents !== 1 ? 's' : ''} · {activeCourses} course{activeCourses !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="card-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => router.push('/dashboard/profile')}
              title="Your profile"
              className="mx-auto mt-3 mb-1 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold overflow-hidden hover:ring-2 hover:ring-indigo-300 transition-all"
            >
              {creator.profileImageUrl
                ? <img src={creator.profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
                : initials
              }
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Search trigger ──────────────────────────────────────────────── */}
        <div className={cn('px-2 mt-2 mb-1', collapsed && 'flex justify-center')}>
          <button
            onClick={() => window.dispatchEvent(new Event('persist:open-command'))}
            title="Search (⌘K)"
            className={cn(
              'flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] text-[#9CA3AF]',
              'hover:bg-white hover:border-indigo-200 hover:text-[#6B7280] transition-all text-sm',
              collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2',
            )}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-xs">Search...</span>
                <kbd className="bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9CA3AF]">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-indigo-600')} />
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

      <Toaster
        position="bottom-right"
        offset={24}
        gap={12}
        expand
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'flex items-start gap-3 w-full max-w-sm bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl shadow-black/10 p-4 relative',
            title:       'text-sm font-semibold text-[#111827]',
            description: 'text-xs text-[#6B7280] mt-0.5 leading-relaxed',
            actionButton:
              'text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg mt-2 transition-colors',
            cancelButton:
              'text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors',
            closeButton:
              'absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#6B7280] transition-colors',
            success: 'border-l-4 border-l-emerald-500',
            error:   'border-l-4 border-l-red-500',
            warning: 'border-l-4 border-l-amber-500',
            info:    'border-l-4 border-l-indigo-500',
            icon:    'mt-0.5 flex-shrink-0',
          },
          duration: 4000,
        }}
      />

      {/* ── Command Palette — renders as a portal overlay ──────────────────── */}
      <CommandPalette students={students} />
    </div>
  )
}
