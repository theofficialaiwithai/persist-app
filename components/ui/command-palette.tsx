'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
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
  const router  = useRouter()
  const { signOut } = useClerk()

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
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
    <CommandDialog
      open={open}
      onOpenChange={(o) => setOpen(o)}
      className="sm:max-w-lg! p-0! gap-0! overflow-hidden! top-[30%]! translate-y-0!"
    >
      {/* cmdk context wrapper */}
      <Command className="rounded-none! bg-white!">

        {/* Search input */}
        <div className="border-b border-[#E5E7EB] px-1">
          <CommandInput
            placeholder="Search students, navigate, or take action..."
            className="text-[#111827]! h-12!"
          />
        </div>

        {/* Results list */}
        <CommandList className="max-h-[380px]! py-1">

          <CommandEmpty>
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No results found</p>
            </div>
          </CommandEmpty>

          {/* ── Navigate ───────────────────────────────────────────────────── */}
          <CommandGroup heading="Navigate">
            <CommandItem
              onSelect={() => navigate('/dashboard')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1">Dashboard</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => navigate('/dashboard/students')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
            >
              <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1">Students</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => navigate('/dashboard/profile')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
            >
              <UserCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1">My Profile</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigate('/dashboard/settings')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
            >
              <Settings className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1">Settings</span>
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1!" />

          {/* ── Quick Actions ──────────────────────────────────────────────── */}
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => navigate('/dashboard/students')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-emerald-50! data-selected:text-emerald-700!"
            >
              <Send className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="flex-1">Send a nudge...</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigate('/dashboard/settings#webhook')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-amber-50! data-selected:text-amber-700!"
            >
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="flex-1">Copy webhook URL</span>
            </CommandItem>
            <CommandItem
              onSelect={() => navigate('/dashboard/settings')}
              className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
            >
              <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1">View webhook setup guide</span>
            </CommandItem>
          </CommandGroup>

          {/* ── Students ───────────────────────────────────────────────────── */}
          {students.length > 0 && (
            <>
              <CommandSeparator className="my-1!" />
              <CommandGroup heading="Students">
                {students.slice(0, 8).map(student => {
                  const initials = student.name
                    .split(' ')
                    .map(n => n[0] ?? '')
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  return (
                    <CommandItem
                      key={student.id}
                      onSelect={() => navigate(`/dashboard/students/${student.id}`)}
                      value={`${student.name} ${student.email} ${student.courseName}`}
                      className="rounded-lg! mx-1! px-3! py-2.5! data-selected:bg-indigo-50! data-selected:text-indigo-700!"
                    >
                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        <span className="font-medium text-[#111827] truncate">{student.name}</span>
                        <span className="text-xs text-[#9CA3AF] truncate">{student.courseName}</span>
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

          <CommandSeparator className="my-1!" />

          {/* ── Account ────────────────────────────────────────────────────── */}
          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() => signOut({ redirectUrl: '/' })}
              className="rounded-lg! mx-1! px-3! py-2.5! text-red-600! data-selected:bg-red-50! data-selected:text-red-700!"
            >
              <LogOut className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="flex-1">Sign out</span>
            </CommandItem>
          </CommandGroup>

        </CommandList>
      </Command>

      {/* ── Footer hint bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#E5E7EB] px-4 py-2.5 flex items-center gap-4 text-xs text-[#9CA3AF] bg-[#FAFAFA]">
        <span>
          <kbd className="bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] font-mono">↑↓</kbd>{' '}
          navigate
        </span>
        <span>
          <kbd className="bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd>{' '}
          select
        </span>
        <span>
          <kbd className="bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] font-mono">esc</kbd>{' '}
          close
        </span>
        <span className="ml-auto">
          <kbd className="bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>{' '}
          open
        </span>
      </div>
    </CommandDialog>
  )
}
