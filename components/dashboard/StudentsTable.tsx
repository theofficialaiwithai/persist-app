'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StudentRowData = {
  id:           string
  name:         string
  email:        string
  progressPct:  number
  lastActiveAt: string | null   // ISO string (dates serialised server-side)
  enrolledAt:   string          // ISO string
  courseId:     string
  courseName:   string
  status:       'at-risk' | 'on-track' | 'completed' | 'new'
  daysInactive: number
}

export type CourseOption = { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function formatLastActive(isoString: string | null): { text: string; cls: string } {
  if (!isoString) return { text: 'Never', cls: 'text-gray-400' }
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000)
  const text = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
  const cls  = days >= 7 ? 'text-red-600' : days >= 3 ? 'text-amber-600' : 'text-green-600'
  return { text, cls }
}

const STATUS_CONFIG = {
  'at-risk':   { label: 'At Risk',   cls: 'bg-red-50 text-red-700'       },
  'on-track':  { label: 'On Track',  cls: 'bg-emerald-50 text-emerald-700' },
  'completed': { label: 'Completed', cls: 'bg-indigo-50 text-indigo-700'  },
  'new':       { label: 'New',       cls: 'bg-gray-100 text-gray-600'     },
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

  const inputCls = 'h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div className="space-y-4">

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(inputCls, 'pl-9 w-full')}
          />
        </div>

        {/* Course filter */}
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

        {/* Status filter */}
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

      {/* ── Table card ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          /* Original empty — no students at all */
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-gray-700">No students yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Share your webhook URL to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/60">
                  {['Student', 'Course', 'Progress', 'Last Active', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
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
                        className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-medium shrink-0 select-none">
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="px-4 py-3">
                          <p className="text-gray-700 truncate max-w-[160px]">{student.courseName}</p>
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 w-28">
                            <span className="text-xs text-muted-foreground">{student.progressPct}%</span>
                            <Progress value={student.progressPct} />
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn('text-sm', lastActiveCls)}>{lastActiveText}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                            statusCls
                          )}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions — stopPropagation so row click doesn't fire */}
                        <td
                          className="px-4 py-3"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <SendNudgeButton
                              studentId={student.id}
                              studentName={student.name}
                            />
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
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
