'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Search,
  Zap,
  Sparkles,
  Menu,
  X,
  Settings,
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
  userType: string
  totalStudents: number
  activeCourses: number
  students: PaletteStudent[]
  children: React.ReactNode
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const creatorNavItems = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/profile',  label: 'Profile',   icon: UserCircle,      exact: true  },
  { href: '/dashboard/students', label: 'Students',  icon: Users,           exact: false },
  { href: '/dashboard/sprints',  label: 'Sprints',   icon: Zap,             exact: false },
]

const learnerNavItems = [
  { href: '/dashboard/learn',    label: 'Learn',     icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/sprints',  label: 'Sprints',   icon: Zap,             exact: false },
  { href: '/dashboard/profile',  label: 'Profile',   icon: UserCircle,      exact: true  },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings,        exact: true  },
]

const comingSoonItems = [
  { label: 'Analytics Dashboard', emoji: '📊' },
  { label: 'Email Templates',     emoji: '✉️'  },
  { label: 'Team Collaboration',  emoji: '👥' },
  { label: 'AI Writing Coach',    emoji: '🤖' },
  { label: 'Payment Tracking',    emoji: '💳' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function LayoutClient({ creator, userType, totalStudents, activeCourses, students, children }: LayoutClientProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const navItems = userType === 'learner' ? learnerNavItems : creatorNavItems
  const [collapsed,   setCollapsed  ] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

      {/* ── Mobile slide-over drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col border-r border-[#E5E7EB] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-[#E5E7EB] flex-shrink-0">
                <span className="font-bold text-[#004643] text-lg">Persist</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mini profile card */}
              <div
                className="mx-2 mt-3 mb-1 p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] cursor-pointer hover:bg-[#E8F4F0] hover:border-[#B8D9CE] transition-colors"
                onClick={() => { setMobileOpen(false); router.push('/dashboard/profile') }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004643] to-[#003533] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                    {creator.profileImageUrl
                      ? <img src={creator.profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{firstName}</p>
                    <p className="text-xs text-[#6B7280] truncate">{platformLabel}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7FB069]" />
                  <span className="text-xs text-[#6B7280]">
                    {totalStudents} student{totalStudents !== 1 ? 's' : ''} · {activeCourses} course{activeCourses !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 py-4 px-2 space-y-1">
                {navItems.map(({ href, label, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#E8F4F0] text-[#004643]'
                          : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#004643]' : ''}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-[#004643]' : ''}`}>{label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Coming Soon */}
              <div className="mx-2 mb-2">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#004643]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Coming Soon</span>
                  </div>
                  <div className="space-y-1.5">
                    {comingSoonItems.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-sm">{item.emoji}</span>
                        <span className="text-[11px] text-[#9CA3AF] truncate">{item.label}</span>
                        <span className="ml-auto shrink-0 text-[9px] font-semibold bg-[#E8F4F0] text-[#004643] border border-[#D1EBE5] rounded-full px-1.5 py-0.5">
                          Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile dropdown */}
              <div className="p-2 border-t border-[#E5E7EB]">
                <ProfileDropdown collapsed={false} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white border-r border-[#E5E7EB] flex-shrink-0 overflow-hidden relative"
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
                className="font-bold text-[#004643] text-lg"
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
              className="mx-2 mt-3 mb-1 p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] cursor-pointer hover:bg-[#E8F4F0] hover:border-[#B8D9CE] transition-colors group"
              onClick={() => router.push('/dashboard/profile')}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004643] to-[#003533] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                  {creator.profileImageUrl
                    ? <img src={creator.profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{firstName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{platformLabel}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#004643] transition-colors flex-shrink-0" />
              </div>
              {/* Status indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7FB069] flex-shrink-0" />
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
              className="mx-auto mt-3 mb-1 w-10 h-10 rounded-full bg-gradient-to-br from-[#004643] to-[#003533] flex items-center justify-center text-white text-sm font-semibold overflow-hidden hover:ring-2 hover:ring-indigo-300 transition-all"
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
              'hover:bg-white hover:border-[#B8D9CE] hover:text-[#6B7280] transition-all text-sm',
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
                    ? 'bg-[#E8F4F0] text-[#004643]'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA]',
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[#004643]')} />
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
                        isActive ? 'text-[#004643]' : '',
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

        {/* Coming Soon section — only when expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              key="coming-soon"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-2 mb-2 overflow-hidden"
            >
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#004643]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Coming Soon</span>
                </div>
                <div className="space-y-1.5">
                  {comingSoonItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-sm leading-none">{item.emoji}</span>
                      <span className="text-[11px] text-[#9CA3AF] truncate">{item.label}</span>
                      <span className="ml-auto shrink-0 text-[9px] font-semibold bg-[#E8F4F0] text-[#004643] border border-[#D1EBE5] rounded-full px-1.5 py-0.5">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile dropdown at bottom */}
        <div className="p-2 border-t border-[#E5E7EB]">
          <ProfileDropdown collapsed={collapsed} />
        </div>
      </motion.aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile top bar — hamburger + logo */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-white flex-shrink-0">
          <span className="font-bold text-[#004643] text-lg">Persist</span>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F7F8FA] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
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
              'text-xs font-medium text-[#004643] hover:text-[#003533] bg-[#E8F4F0] px-3 py-1.5 rounded-lg mt-2 transition-colors',
            cancelButton:
              'text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors',
            closeButton:
              'absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#6B7280] transition-colors',
            success: 'border-l-4 border-l-[#7FB069]',
            error:   'border-l-4 border-l-red-500',
            warning: 'border-l-4 border-l-amber-500',
            info:    'border-l-4 border-l-[#004643]',
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
