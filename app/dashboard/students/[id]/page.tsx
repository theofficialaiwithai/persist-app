import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
  'at-risk':   { label: 'At Risk',   cls: 'bg-red-50 text-red-700'        },
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
    <div className="p-8 space-y-6">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Students
      </Link>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{student.name}</h1>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusCls
            )}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ─────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">

          {/* Progress card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Course Progress</h2>

            <p className="text-lg font-medium text-gray-800">{course.name}</p>

            <div className="space-y-2">
              <Progress value={student.progressPct} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {student.progressPct}% complete
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#E5E7EB]">
              <div>
                <p className="text-xs text-muted-foreground">Lessons Completed</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {student.lessonsCompleted}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Days Between Sessions</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {student.avgDaysBetweenSessions ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Lesson Completed</p>
                <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                  {student.lastLessonCompleted ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Nudge History card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Nudge History</h2>
            <NudgeAccordion nudges={nudgeItems} />
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Quick Actions card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>

            <SendNudgeButton
              studentId={student.id}
              studentName={student.name}
              className="w-full justify-center text-sm py-2"
            />

            <dl className="space-y-3 pt-2 border-t border-[#E5E7EB] text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Student since</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {formatDate(student.enrolledAt)}
                </dd>
              </div>
              {student.platformStudentId && (
                <div>
                  <dt className="text-xs text-muted-foreground">Platform ID</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 font-mono text-xs">
                    {student.platformStudentId}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Activity card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Activity</h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Last Active</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {relativeTime(student.lastActiveAt)}
                </dd>
                {student.lastActiveAt && (
                  <dd className="text-xs text-muted-foreground">
                    {formatDate(student.lastActiveAt)}
                  </dd>
                )}
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Enrolled</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {formatDate(student.enrolledAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Next Lesson</dt>
                <dd className="mt-0.5 font-medium text-gray-900 truncate">
                  {student.nextLessonTitle ?? '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Days Inactive</dt>
                <dd className={cn(
                  'mt-0.5 font-semibold',
                  daysInactive >= 7 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {daysInactive === 999 ? '—' : `${daysInactive}d`}
                </dd>
              </div>
            </dl>
          </div>

        </div>
      </div>
    </div>
  )
}
