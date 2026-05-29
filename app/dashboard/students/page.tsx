import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { StudentsTable } from '@/components/dashboard/StudentsTable'
import type { StudentRowData } from '@/components/dashboard/StudentsTable'

// ── Status helper (mirrors nudge-engine risk zones) ───────────────────────────

function getStatus(
  progressPct: number,
  daysInactive: number,
): StudentRowData['status'] {
  if (progressPct >= 98) return 'completed'
  if (progressPct < 5)   return 'new'
  if (progressPct >= 20 && progressPct <= 95 && daysInactive > 5) return 'at-risk'
  return 'on-track'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  // ── Courses for this creator ──────────────────────────────────────────────
  const creatorCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.creatorId, creator.id))

  const courseIds = creatorCourses.map(c => c.id)
  const courseMap = new Map(creatorCourses.map(c => [c.id, c.name]))

  // ── Students ──────────────────────────────────────────────────────────────
  let rows: StudentRowData[] = []

  if (courseIds.length > 0) {
    const allStudents = await db
      .select()
      .from(students)
      .where(inArray(students.courseId, courseIds))

    const now = Date.now()

    rows = allStudents.map(s => {
      const daysInactive = s.lastActiveAt
        ? Math.floor((now - s.lastActiveAt.getTime()) / 86400000)
        : 999

      return {
        id:           s.id,
        name:         s.name,
        email:        s.email,
        progressPct:  s.progressPct,
        lastActiveAt: s.lastActiveAt ? s.lastActiveAt.toISOString() : null,
        enrolledAt:   s.enrolledAt   ? s.enrolledAt.toISOString()   : null,
        courseId:     s.courseId,
        courseName:   courseMap.get(s.courseId) ?? 'Unknown Course',
        status:       getStatus(s.progressPct, daysInactive),
        daysInactive,
        streakDays:   s.streakDays,
      }
    })
  }

  const courseOptions = creatorCourses.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="p-8 space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track engagement across all your courses
        </p>
      </div>

      {/* ── Table (client component handles search + filter) ─────────────── */}
      <StudentsTable rows={rows} courses={courseOptions} />
    </div>
  )
}
