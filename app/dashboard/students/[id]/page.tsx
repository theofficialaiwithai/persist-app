import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { NudgeAccordion } from '@/components/dashboard/NudgeAccordion'
import type { NudgeItem } from '@/components/dashboard/NudgeAccordion'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatus(progressPct: number, daysInactive: number) {
  if (progressPct >= 98) return 'completed'
  if (progressPct < 5)   return 'new'
  if (progressPct >= 20 && progressPct <= 95 && daysInactive > 5) return 'at-risk'
  return 'on-track'
}

const STATUS_CONFIG = {
  'at-risk':   { label: 'At Risk',   cls: 'bg-red-50 text-red-600'         },
  'on-track':  { label: 'On Track',  cls: 'bg-emerald-50 text-emerald-700' },
  'completed': { label: 'Completed', cls: 'bg-indigo-50 text-indigo-700'   },
  'new':       { label: 'New',       cls: 'bg-gray-100 text-gray-600'      },
} as const

function relativeTime(date: Date | null): string {
  if (!date) return 'Never'
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // ── Auth: verify creator ──────────────────────────────────────────────────
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  // ── Fetch student ─────────────────────────────────────────────────────────
  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
  })
  if (!student) redirect('/dashboard/students')

  // ── Verify ownership (student → course → creator) ─────────────────────────
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, student.courseId),
  })
  if (!course || course.creatorId !== creator.id) redirect('/dashboard/students')

  // ── Nudge history ─────────────────────────────────────────────────────────
  const nudgeRows = await db
    .select()
    .from(nudges)
    .where(eq(nudges.studentId, student.id))
    .orderBy(desc(nudges.createdAt))

  const nudgeItems: NudgeItem[] = nudgeRows.map(n => ({
    id:        n.id,
    subject:   n.subject,
    body:      n.body,
    status:    n.status,
    sentAt:    n.sentAt    ? n.sentAt.toISOString()    : null,
    createdAt: n.createdAt ? n.createdAt.toISOString() : null,
  }))

  // ── Derived values ────────────────────────────────────────────────────────
  const daysInactive = student.lastActiveAt
    ? Math.floor((Date.now() - student.lastActiveAt.getTime()) / 86400000)
    : 999

  const status = getStatus(student.progressPct, daysInactive)
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[status]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard/students"
        className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6 block"
      >
        ← Students
      </Link>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">{student.name}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{student.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusCls
          )}>
            {statusLabel}
          </span>
          <SendNudgeButton
            studentId={student.id}
            studentName={student.name}
            className="px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6 mt-8">

        {/* ── LEFT COLUMN (2/3) ─────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">

          {/* ── Card 1: Course Progress ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Course Progress</h2>

            <p className="text-base font-medium text-[#111827] mb-3">{course.name}</p>

            {/* Progress bar with right-aligned percentage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#6B7280]">Completion</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {student.progressPct}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#F7F8FA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, student.progressPct))}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">
                  Lessons Completed
                </p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {student.lessonsCompleted}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">
                  Avg Days / Session
                </p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {student.avgDaysBetweenSessions ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">
                  Last Lesson
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827] truncate" title={student.lastLessonCompleted ?? undefined}>
                  {student.lastLessonCompleted
                    ? student.lastLessonCompleted.slice(0, 30) + (student.lastLessonCompleted.length > 30 ? '…' : '')
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Card 2: Nudge History ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Nudge History</h2>
            <NudgeAccordion nudges={nudgeItems} />
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Card 1: Quick Actions ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Quick Actions</h2>

            <SendNudgeButton
              studentId={student.id}
              studentName={student.name}
              className="w-full justify-center text-sm py-2"
            />

            {/* Metadata rows */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] divide-y divide-[#E5E7EB]">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#6B7280]">Student since</span>
                <span className="text-sm font-medium text-[#111827]">
                  {formatDate(student.enrolledAt)}
                </span>
              </div>
              {student.platformStudentId && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-[#6B7280]">Platform ID</span>
                  <span className="text-sm font-mono text-[#111827]">
                    {student.platformStudentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Card 2: Activity ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Activity</h2>

            <div className="divide-y divide-[#E5E7EB]">
              {/* Last Active */}
              <div className="flex justify-between items-start py-3">
                <span className="text-sm text-[#6B7280]">Last Active</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#111827]">
                    {relativeTime(student.lastActiveAt)}
                  </p>
                  {student.lastActiveAt && (
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {formatDate(student.lastActiveAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Enrolled */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#6B7280]">Enrolled</span>
                <span className="text-sm font-medium text-[#111827]">
                  {formatDate(student.enrolledAt)}
                </span>
              </div>

              {/* Next Lesson */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#6B7280] shrink-0 mr-4">Next Lesson</span>
                <span className="text-sm font-medium text-[#111827] truncate text-right">
                  {student.nextLessonTitle ?? '—'}
                </span>
              </div>

              {/* Days Inactive */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#6B7280]">Days Inactive</span>
                <span className={cn(
                  'text-sm font-semibold',
                  daysInactive >= 7 ? 'text-red-600' : 'text-[#111827]'
                )}>
                  {daysInactive === 999 ? '—' : `${daysInactive}d`}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
