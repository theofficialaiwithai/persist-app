import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, and, gte, lte, lt, gt, sql, desc, isNull, or } from 'drizzle-orm'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import type {
  AtRiskRowData,
  StreakLeaderData,
  RecentNudgeData,
  NewStarterData,
} from '@/components/dashboard/BentoGrid'

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const clerkUser = await currentUser()

  // ── Defaults (rendered even if creator not found yet) ─────────────────────
  let creatorFirstName    = 'there'
  let totalStudents       = 0
  let activeCourses       = 0
  let nudgesThisMonth     = 0
  let atRiskCount         = 0
  let newStudentsThisWeek = 0
  let avgProgressPct      = 0
  let completionPct       = 0
  let mostActiveCourse    = ''

  let atRiskRows:      AtRiskRowData[]    = []
  let streakLeaders:   StreakLeaderData[] = []
  let recentNudgeRows: RecentNudgeData[]  = []
  let newStarters:     NewStarterData[]   = []

  try {
    // ── 1. Creator ───────────────────────────────────────────────────────────
    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) redirect('/dashboard/onboarding')

    // Best-effort first name: Clerk → senderName → creator.name → email prefix
    creatorFirstName =
      clerkUser?.firstName ||
      (creator.senderName ? creator.senderName.split(' ')[0] : null) ||
      (creator.name       ? creator.name.split(' ')[0]       : null) ||
      clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] ||
      'there'

    // ── 2. Courses ───────────────────────────────────────────────────────────
    const creatorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.creatorId, creator.id))

    activeCourses = creatorCourses.length
    const courseIds = creatorCourses.map(c => c.id)
    const courseMap = new Map(creatorCourses.map(c => [c.id, c.name]))

    if (courseIds.length > 0) {
      // ── 3. Student count + IDs ───────────────────────────────────────────
      const allStudents = await db
        .select({
          id:       students.id,
          name:     students.name,
          courseId: students.courseId,
        })
        .from(students)
        .where(inArray(students.courseId, courseIds))

      totalStudents = allStudents.length
      const studentIds = allStudents.map(s => s.id)
      const studentMap = new Map(allStudents.map(s => [s.id, s]))

      if (studentIds.length > 0) {
        const now          = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const sevenDaysAgo = new Date(now.getTime() - 7  * 86_400_000)
        const fiveDaysAgo  = new Date(now.getTime() - 5  * 86_400_000)

        // ── 4. Nudges this month ───────────────────────────────────────────
        const [nudgeCountRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(nudges)
          .where(and(
            inArray(nudges.studentId, studentIds),
            gte(nudges.createdAt, startOfMonth),
          ))
        nudgesThisMonth = nudgeCountRow?.count ?? 0

        // ── 5. New students this week ──────────────────────────────────────
        const [weekRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
            gte(students.enrolledAt, sevenDaysAgo),
          ))
        newStudentsThisWeek = weekRow?.count ?? 0

        // ── 6. At-risk count (5–98 % progress, inactive > 5 d) ────────────
        const [arCountRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
            gte(students.progressPct, 5),
            lte(students.progressPct, 98),
            or(
              isNull(students.lastActiveAt),
              lt(students.lastActiveAt, fiveDaysAgo),
            ),
          ))
        atRiskCount = arCountRow?.count ?? 0

        // ── 7. Avg + completion stats ──────────────────────────────────────
        const [avgRow] = await db
          .select({
            avg:       sql<number>`round(avg(${students.progressPct}))::int`,
            completed: sql<number>`count(*) filter (where ${students.progressPct} >= 98)::int`,
          })
          .from(students)
          .where(inArray(students.courseId, courseIds))

        avgProgressPct = avgRow?.avg      ?? 0
        const completedCount = avgRow?.completed ?? 0
        completionPct = totalStudents > 0
          ? Math.round((completedCount / totalStudents) * 100)
          : 0

        // ── 8. Most active course (latest lastActiveAt) ────────────────────
        const [mostActive] = await db
          .select({ courseId: students.courseId })
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
          ))
          .orderBy(desc(students.lastActiveAt))
          .limit(1)
        mostActiveCourse = mostActive ? (courseMap.get(mostActive.courseId) ?? '') : ''

        // ── 9. Recent nudges (last 5) ──────────────────────────────────────
        const recentNudges = await db
          .select()
          .from(nudges)
          .where(inArray(nudges.studentId, studentIds))
          .orderBy(desc(nudges.createdAt))
          .limit(5)

        recentNudgeRows = recentNudges.map(n => {
          const s = studentMap.get(n.studentId)
          return {
            id:          n.id,
            subject:     n.subject,
            status:      n.status,
            createdAt:   n.createdAt?.toISOString() ?? new Date().toISOString(),
            studentName: s?.name ?? 'Unknown',
          }
        })

        // ── 10. At-risk list (display, limit 8) ───────────────────────────
        const atRiskStudents = await db
          .select()
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
            gte(students.progressPct, 5),
            lte(students.progressPct, 98),
          ))
          .orderBy(students.lastActiveAt)   // oldest-active first
          .limit(8)

        atRiskRows = atRiskStudents.map(s => ({
          id:          s.id,
          name:        s.name,
          courseId:    s.courseId,
          progressPct: s.progressPct,
          lastActiveAt: s.lastActiveAt?.toISOString() ?? null,
          courseName:  courseMap.get(s.courseId) ?? 'Unknown Course',
          daysInactive: s.lastActiveAt
            ? Math.floor((now.getTime() - s.lastActiveAt.getTime()) / 86_400_000)
            : 0,
        }))

        // ── 11. New starters (progressPct < 10, enrolled in last 7 days) ──
        const newStarterRows = await db
          .select({
            id:        students.id,
            name:      students.name,
            courseId:  students.courseId,
            enrolledAt: students.enrolledAt,
          })
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
            lt(students.progressPct, 10),
            gte(students.enrolledAt, sevenDaysAgo),
          ))
          .orderBy(desc(students.enrolledAt))

        newStarters = newStarterRows.map(s => ({
          id:         s.id,
          name:       s.name,
          courseName: courseMap.get(s.courseId) ?? 'Unknown Course',
          enrolledAt: s.enrolledAt.toISOString(),
        }))

        // ── 12. Streak leaders (top 5 with streak > 0) ────────────────────
        const topStreakers = await db
          .select({
            id:        students.id,
            name:      students.name,
            streakDays: students.streakDays,
            courseId:  students.courseId,
          })
          .from(students)
          .where(and(
            inArray(students.courseId, courseIds),
            gt(students.streakDays, 0),
          ))
          .orderBy(desc(students.streakDays))
          .limit(5)

        streakLeaders = topStreakers.map(s => ({
          id:        s.id,
          name:      s.name,
          streakDays: s.streakDays,
          courseName: courseMap.get(s.courseId) ?? 'Unknown Course',
        }))
      }
    }
  } catch (err) {
    console.error('[dashboard/page]', err)
  }

  return (
    <div className="p-6">
      <BentoGrid
        creatorFirstName={creatorFirstName}
        totalStudents={totalStudents}
        activeCourses={activeCourses}
        nudgesThisMonth={nudgesThisMonth}
        atRiskCount={atRiskCount}
        newStudentsThisWeek={newStudentsThisWeek}
        atRiskRows={atRiskRows}
        streakLeaders={streakLeaders}
        recentNudgeRows={recentNudgeRows}
        newStarters={newStarters}
        avgProgressPct={avgProgressPct}
        completionPct={completionPct}
        mostActiveCourse={mostActiveCourse}
      />
    </div>
  )
}
