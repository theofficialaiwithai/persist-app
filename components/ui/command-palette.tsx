'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Settings,
  UserCircle,
  Send,
  Search,
  Zap,
  BookOpen,
  LogOut,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaletteStudent {
  id: string
  name: string
  email: string
  courseName: string
  progressPct: number
}

interface CommandPaletteProps {
  students?: PaletteStudent[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette({ students = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router      = useRouter()
  const { signOut } = useClerk()

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K: toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        return
      }
      // Escape: close
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Custom event: sidebar search button dispatches this ─────────────────────
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('persist:open-command', handleOpen)
    return () => window.removeEventListener('persist:open-command', handleOpen)
  }, [])

  const navigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        // ── Outer container — occupies the full viewport ─────────────────────
        <motion.div
          key="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop — click here to close ─────────────────────────────────── */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Centering wrapper — also closes on outside-click ──────────────── */}
          <div
            className="absolute inset-0 flex items-start justify-center pt-[18vh] px-4"
            onClick={() => setOpen(false)}
          >
            {/* Panel — stopPropagation so clicks inside don't close ───────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1,    y: 0    }}
              exit={{    opacity: 0, scale: 0.96, y: -12  }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* cmdk context ───────────────────────────────────────────────── */}
              <Command className="rounded-none! bg-white! p-0!" shouldFilter>

                {/* Search input */}
                <div className="border-b border-[#E5E7EB]">
                  <CommandInput
                    placeholder="Search students, navigate, or take action..."
                    className="h-14! text-base!"
                  />
                </div>

                {/* Results list */}
                <CommandList className="max-h-80! overflow-y-auto! py-2! px-2!">

                  <CommandEmpty>
                    <div className="text-center py-8">
                      <Search className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                      <p className="text-sm text-[#6B7280]">No results found</p>
                    </div>
                  </CommandEmpty>

                  {/* ── Navigate ─────────────────────────────────────────────── */}
                  <CommandGroup heading="Navigate">
                    <CommandItem
                      onSelect={() => navigate('/dashboard')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#004643] flex-shrink-0" />
                      <span className="flex-1">Dashboard</span>
                      <CommandShortcut>⌘D</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => navigate('/dashboard/students')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                    >
                      <Users className="w-4 h-4 text-[#004643] flex-shrink-0" />
                      <span className="flex-1">Students</span>
                      <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => navigate('/dashboard/profile')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                    >
                      <UserCircle className="w-4 h-4 text-[#004643] flex-shrink-0" />
                      <span className="flex-1">My Profile</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => navigate('/dashboard/settings')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                    >
                      <Settings className="w-4 h-4 text-[#004643] flex-shrink-0" />
                      <span className="flex-1">Settings</span>
                      <CommandShortcut>⌘,</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>

                  <CommandSeparator />

                  {/* ── Quick Actions ─────────────────────────────────────────── */}
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      onSelect={() => navigate('/dashboard/students')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#F0F7EE]! data-selected:text-[#5A8F47]!"
                    >
                      <Send className="w-4 h-4 text-[#7FB069] flex-shrink-0" />
                      <span className="flex-1">Send a nudge...</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => navigate('/dashboard/settings#webhook')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-amber-50! data-selected:text-amber-700!"
                    >
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="flex-1">Copy webhook URL</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => navigate('/dashboard/settings')}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                    >
                      <BookOpen className="w-4 h-4 text-[#004643] flex-shrink-0" />
                      <span className="flex-1">View webhook setup guide</span>
                    </CommandItem>
                  </CommandGroup>

                  {/* ── Students ─────────────────────────────────────────────── */}
                  {students.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Students">
                        {students.slice(0, 8).map(student => {
                          const sts = student.name
                            .split(' ')
                            .map(n => n[0] ?? '')
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                          return (
                            <CommandItem
                              key={student.id}
                              onSelect={() => navigate(`/dashboard/students/${student.id}`)}
                              value={`${student.name} ${student.courseName}`}
                              className="rounded-lg! px-3! py-2.5! data-selected:bg-[#E8F4F0]! data-selected:text-[#003533]!"
                            >
                              <div className="w-6 h-6 rounded-full bg-[#E8F4F0] text-[#004643] text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                                {sts}
                              </div>
                              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                <span className="font-medium text-[#111827] truncate">
                                  {student.name}
                                </span>
                                <span className="text-xs text-[#9CA3AF] truncate">
                                  {student.courseName}
                                </span>
                              </div>
                              <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                                {student.progressPct}%
                              </span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </>
                  )}

                  <CommandSeparator />

                  {/* ── Account ──────────────────────────────────────────────── */}
                  <CommandGroup heading="Account">
                    <CommandItem
                      onSelect={() => signOut({ redirectUrl: '/' })}
                      className="rounded-lg! px-3! py-2.5! data-selected:bg-[#664147]/10! data-selected:text-[#664147]!"
                    >
                      <LogOut className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="flex-1 text-red-600">Sign out</span>
                    </CommandItem>
                  </CommandGroup>

                </CommandList>
              </Command>

              {/* Footer hint bar ─────────────────────────────────────────────── */}
              <div className="border-t border-[#E5E7EB] px-4 py-2.5 flex items-center gap-4 text-xs text-[#9CA3AF] bg-[#FAFAFA]">
                <span>
                  <kbd className="bg-[#F0F7EE] text-[#004643] border border-[#004643]/20 px-1.5 py-0.5 rounded text-[10px] font-mono">↑↓</kbd>{' '}
                  navigate
                </span>
                <span>
                  <kbd className="bg-[#F0F7EE] text-[#004643] border border-[#004643]/20 px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd>{' '}
                  select
                </span>
                <span>
                  <kbd className="bg-[#F0F7EE] text-[#004643] border border-[#004643]/20 px-1.5 py-0.5 rounded text-[10px] font-mono">esc</kbd>{' '}
                  close
                </span>
                <span className="ml-auto">
                  <kbd className="bg-[#F0F7EE] text-[#004643] border border-[#004643]/20 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>{' '}
                  open
                </span>
              </div>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
