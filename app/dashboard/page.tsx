import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, and, gte, lte, sql, desc, asc } from 'drizzle-orm'
import { Users, BookOpen, Mail } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60)  return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return `${mins}m ago`
  const hrs  = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs  / 24)
  return `${days}d ago`
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // ── Clerk user (for welcome name) ─────────────────────────────────────────
  const clerkUser = await currentUser()
  const displayName =
    clerkUser?.firstName ||
    clerkUser?.emailAddresses[0]?.emailAddress.split('@')[0] ||
    ''

  // ── Defaults ──────────────────────────────────────────────────────────────
  let creatorFirstName = displayName
  let totalStudents    = 0
  let activeCourses    = 0
  let nudgesThisMonth  = 0

  type AtRiskRow = {
    id: string
    name: string
    email: string
    courseId: string
    progressPct: number
    lastActiveAt: Date | null
    courseName: string
    daysInactive: number
  }

  type RecentNudgeRow = {
    id: string
    subject: string
    status: string
    createdAt: Date
    studentName: string
    courseName: string
  }

  let atRiskRows: AtRiskRow[]       = []
  let recentNudgeRows: RecentNudgeRow[] = []

  try {
    // ── 1. Creator ───────────────────────────────────────────────────────────
    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) redirect('/dashboard/onboarding')

    // displayName already set from Clerk above; keep creatorFirstName as-is

    // ── 2. Courses ───────────────────────────────────────────────────────────
    const creatorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.creatorId, creator.id))

    activeCourses = creatorCourses.length
    const courseIds  = creatorCourses.map((c) => c.id)
    const courseMap  = new Map(creatorCourses.map((c) => [c.id, c.name]))

    if (courseIds.length > 0) {
      // ── 3. All students for this creator (used for counts + nudge lookup) ─
      const allStudents = await db
        .select({ id: students.id, name: students.name, email: students.email, courseId: students.courseId })
        .from(students)
        .where(inArray(students.courseId, courseIds))

      totalStudents = allStudents.length
      const studentIds  = allStudents.map((s) => s.id)
      const studentMap  = new Map(allStudents.map((s) => [s.id, s]))

      // ── 4. Nudges this calendar month ─────────────────────────────────────
      if (studentIds.length > 0) {
        const now          = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [nudgeCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(nudges)
          .where(and(
            inArray(nudges.studentId, studentIds),
            gte(nudges.createdAt, startOfMonth),
          ))
        nudgesThisMonth = nudgeCount?.count ?? 0

        // ── 5. Recent nudges ─────────────────────────────────────────────────
        const recentNudges = await db
          .select()
          .from(nudges)
          .where(inArray(nudges.studentId, studentIds))
          .orderBy(desc(nudges.createdAt))
          .limit(5)

        recentNudgeRows = recentNudges.map((n) => {
          const s = studentMap.get(n.studentId)
          return {
            id:          n.id,
            subject:     n.subject,
            status:      n.status,
            createdAt:   n.createdAt,
            studentName: s?.name ?? 'Unknown',
            courseName:  s ? (courseMap.get(s.courseId) ?? 'Unknown Course') : 'Unknown Course',
          }
        })
      }

      // ── 6. At-risk students (all active students, 5–98%) ────────────────
      //    No inactivity threshold here — the cron handles that logic.
      //    Dashboard just shows students with incomplete progress.
      const atRisk = await db
        .select()
        .from(students)
        .where(and(
          inArray(students.courseId, courseIds),
          gte(students.progressPct, 5),
          lte(students.progressPct, 98),
        ))
        .orderBy(asc(students.lastActiveAt))
        .limit(10)

      atRiskRows = atRisk.map((s) => ({
        id:          s.id,
        name:        s.name,
        email:       s.email,
        courseId:    s.courseId,
        progressPct: s.progressPct,
        lastActiveAt: s.lastActiveAt,
        courseName:  courseMap.get(s.courseId) ?? 'Unknown Course',
        daysInactive: s.lastActiveAt
          ? Math.floor((Date.now() - s.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }))
    }
  } catch (err) {
    console.error('[dashboard/page]', err)
  }

  // ── Stats config ──────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon:  Users,
    },
    {
      label: 'Active Courses',
      value: activeCourses,
      icon:  BookOpen,
    },
    {
      label: 'Nudges This Month',
      value: nudgesThisMonth,
      icon:  Mail,
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        {creatorFirstName && (
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {creatorFirstName}
          </p>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-2 shrink-0">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        ))}
      </div>

      {/* ── At-risk students ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Needs Attention</h2>
          <p className="text-sm text-muted-foreground">Students who may need a nudge</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          {atRiskRows.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <p className="text-2xl">🎉</p>
              <p className="mt-2 text-sm font-medium text-gray-700">All students are on track</p>
              <p className="text-sm text-muted-foreground">No one needs a nudge right now</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {atRiskRows.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-medium shrink-0 select-none">
                    {getInitials(student.name)}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>

                  {/* Course */}
                  <div className="hidden md:block min-w-0 w-40">
                    <p className="text-xs text-muted-foreground truncate">{student.courseName}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden sm:flex flex-col gap-1 w-28 shrink-0">
                    <span className="text-xs text-muted-foreground">{student.progressPct}%</span>
                    <Progress value={student.progressPct} />
                  </div>

                  {/* Days inactive badge */}
                  <span
                    className={cn(
                      'hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      student.daysInactive >= 15
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {student.daysInactive}d inactive
                  </span>

                  {/* Send nudge */}
                  <div className="shrink-0">
                    <SendNudgeButton
                      studentId={student.id}
                      studentName={student.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent nudges ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent Nudges</h2>

        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          {recentNudgeRows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No nudges sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {recentNudgeRows.map((nudge) => (
                <div key={nudge.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Student + course */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{nudge.studentName}</p>
                    <p className="text-xs text-muted-foreground">{nudge.courseName}</p>
                  </div>

                  {/* Subject */}
                  <p className="hidden md:block flex-1 text-sm text-gray-600 truncate max-w-xs">
                    {nudge.subject.length > 60
                      ? nudge.subject.slice(0, 60) + '…'
                      : nudge.subject}
                  </p>

                  {/* Relative time */}
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {relativeTime(new Date(nudge.createdAt))}
                  </span>

                  {/* Status badge */}
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      nudge.status === 'sent'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    )}
                  >
                    {nudge.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
