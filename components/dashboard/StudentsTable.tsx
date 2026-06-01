'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, List, LayoutGrid, Copy, Check as CheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { StudentProfileCard } from '@/components/ui/student-profile-card'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StudentRowData = {
  id:           string
  name:         string
  email:        string
  progressPct:  number
  lastActiveAt: string | null   // ISO string (serialised server-side)
  enrolledAt:   string | null   // ISO string
  courseId:     string
  courseName:   string
  status:       'at-risk' | 'on-track' | 'completed' | 'new'
  daysInactive: number
  streakDays:   number
  nudgesCount:  number
}

export type CourseOption = { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function formatLastActive(isoString: string | null): { text: string; cls: string } {
  if (!isoString) return { text: 'Never', cls: 'text-[#6B7280]' }
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000)
  const text = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
  // green = today/yesterday, amber = 2-6 days, red = 7+
  const cls  = days >= 7 ? 'text-red-600' : days >= 2 ? 'text-amber-600' : 'text-green-600'
  return { text, cls }
}

const STATUS_CONFIG = {
  'at-risk':   { label: 'At Risk',   cls: 'bg-red-50 text-red-600'         },
  'on-track':  { label: 'On Track',  cls: 'bg-[#F0F7EE] text-[#5A8F47]' },
  'completed': { label: 'Completed', cls: 'bg-[#E8F4F0] text-[#003533]'   },
  'new':       { label: 'New',       cls: 'bg-gray-100 text-gray-600'      },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  rows:       StudentRowData[]
  courses:    CourseOption[]
  webhookUrl?: string
}

// ── Students empty state ──────────────────────────────────────────────────────

function StudentsEmptyState({ webhookUrl }: { webhookUrl?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = webhookUrl ?? window.location.origin + '/api/webhook/progress'
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm py-20 flex flex-col items-center text-center px-8">
      {/* Graduation-cap person SVG */}
      <svg width="80" height="88" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
        {/* Mortarboard */}
        <polygon points="40,4 68,18 40,32 12,18" fill="#004643" opacity="0.9" />
        {/* Cap top square */}
        <rect x="34" y="2" width="12" height="4" rx="1" fill="#004643" />
        {/* Tassel */}
        <line x1="68" y1="18" x2="68" y2="28" stroke="#E4572E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="68" cy="30" r="3" fill="#E4572E" />
        {/* Head */}
        <circle cx="40" cy="46" r="12" fill="#E8F4F0" stroke="#004643" strokeWidth="2" />
        {/* Body */}
        <path d="M28 72 C28 64 40 60 40 60 C40 60 52 64 52 72" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Arms */}
        <line x1="28" y1="68" x2="18" y2="76" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="52" y1="68" x2="62" y2="76" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" />
        {/* Legs */}
        <line x1="34" y1="72" x2="28" y2="86" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="72" x2="52" y2="86" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <h3 className="text-lg font-bold text-[#111827]">No students connected yet</h3>
      <p className="text-sm text-[#6B7C7B] mt-2 max-w-xs leading-relaxed">
        Connect your course platform to start tracking student progress and sending automated nudges.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
        <button
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            copied
              ? 'bg-[#7FB069] text-white'
              : 'bg-[#004643] hover:bg-[#003533] text-white shadow-sm',
          )}
        >
          {copied
            ? <><CheckIcon className="w-4 h-4" /> Copied!</>
            : <><Copy className="w-4 h-4" /> Copy webhook URL</>
          }
        </button>
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-[#004643] hover:text-[#003533] transition-colors"
        >
          View setup guide →
        </Link>
      </div>
    </div>
  )
}

// ── Main table component ──────────────────────────────────────────────────────

export function StudentsTable({ rows, courses, webhookUrl }: Props) {
  const router = useRouter()

  const [search,       setSearch      ] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'table' | 'grid'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(r => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      const matchCourse = !courseFilter || r.courseId === courseFilter
      const matchStatus = !statusFilter || r.status === statusFilter
      return matchSearch && matchCourse && matchStatus
    })
  }, [rows, search, courseFilter, statusFilter])

  const inputCls =
    'h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] ' +
    'placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#004643] focus:border-transparent'

  return (
    <div className="space-y-4">

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(inputCls, 'pl-9 w-full')}
          />
        </div>

        <select
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className={cn(inputCls, 'pr-8 cursor-pointer')}
        >
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={cn(inputCls, 'pr-8 cursor-pointer')}
        >
          <option value="">All Statuses</option>
          <option value="at-risk">At Risk</option>
          <option value="on-track">On Track</option>
          <option value="completed">Completed</option>
          <option value="new">New</option>
        </select>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 border border-[#E5E7EB] rounded-lg p-1 bg-white">
          <button
            onClick={() => setView('table')}
            title="Table view"
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'table' ? 'bg-[#004643] text-white' : 'text-[#6B7280] hover:text-[#111827]',
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            title="Grid view"
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'grid' ? 'bg-[#004643] text-white' : 'text-[#6B7280] hover:text-[#111827]',
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Empty state (shared) ──────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <StudentsEmptyState webhookUrl={webhookUrl} />
      ) : view === 'grid' ? (

        /* ── Grid view ──────────────────────────────────────────────────── */
        <>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6B7280]">
              No students match your filters.
            </p>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
            >
              {filtered.map(student => (
                <StudentProfileCard
                  key={student.id}
                  id={student.id}
                  name={student.name}
                  email={student.email}
                  courseName={student.courseName}
                  progressPct={student.progressPct ?? 0}
                  status={student.status}
                  lastActiveLabel={formatLastActive(student.lastActiveAt).text}
                  nudgesCount={student.nudgesCount}
                  streakDays={student.streakDays}
                />
              ))}
            </motion.div>
          )}
        </>

      ) : (

        /* ── Table view ─────────────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* Header */}
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                  {['Student', 'Course', 'Progress', 'Last Active', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[#6B7280]">
                      No students match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map(student => {
                    const { text: lastActiveText, cls: lastActiveCls } = formatLastActive(student.lastActiveAt)
                    const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[student.status]

                    return (
                      <tr
                        key={student.id}
                        onClick={() => router.push(`/dashboard/students/${student.id}`)}
                        className="cursor-pointer hover:bg-[#F7F8FA] transition-colors"
                      >
                        {/* Student — avatar + name + email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#E8F4F0] text-[#004643] text-sm font-medium flex items-center justify-center shrink-0 select-none">
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-[#111827] truncate">{student.name}</p>
                                {student.streakDays >= 3 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 shrink-0">
                                    🔥 {student.streakDays}d
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280] truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="px-6 py-4">
                          <p className="text-[#374151] truncate max-w-[180px]">{student.courseName}</p>
                        </td>

                        {/* Progress */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <AnimatedProgressBar value={student.progressPct ?? 0} className="w-28" />
                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                              {student.progressPct ?? 0}%
                            </span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn('text-sm font-medium', lastActiveCls)}>
                            {lastActiveText}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                            statusCls,
                          )}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <SendNudgeButton studentId={student.id} studentName={student.name} />
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="inline-flex items-center px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-md text-[#111827] hover:bg-[#F7F8FA] transition-colors whitespace-nowrap"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
