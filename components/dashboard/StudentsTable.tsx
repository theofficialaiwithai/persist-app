'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
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
  'on-track':  { label: 'On Track',  cls: 'bg-emerald-50 text-emerald-700' },
  'completed': { label: 'Completed', cls: 'bg-indigo-50 text-indigo-700'   },
  'new':       { label: 'New',       cls: 'bg-gray-100 text-gray-600'      },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  rows:    StudentRowData[]
  courses: CourseOption[]
}

export function StudentsTable({ rows, courses }: Props) {
  const router = useRouter()

  const [search,       setSearch      ] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
    'placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

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
      </div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-[#111827]">No students yet</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Share your webhook URL to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* ── Header ────────────────────────────────────────────────── */}
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

              {/* ── Body ──────────────────────────────────────────────────── */}
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
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium flex items-center justify-center shrink-0 select-none">
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

                        {/* Progress — animated bar + percentage */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <AnimatedProgressBar
                              value={student.progressPct ?? 0}
                              className="w-28"
                            />
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
                            statusCls
                          )}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions — stopPropagation prevents row navigation */}
                        <td
                          className="px-6 py-4"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <SendNudgeButton
                              studentId={student.id}
                              studentName={student.name}
                            />
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
        )}
      </div>
    </div>
  )
}
