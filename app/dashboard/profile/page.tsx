import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, and, desc, sql } from 'drizzle-orm'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // ── Creator ───────────────────────────────────────────────────────────────
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  // ── Courses with per-course student count + avg completion ────────────────
  const coursesWithStats = await db
    .select({
      id:            courses.id,
      name:          courses.name,
      studentCount:  sql<number>`cast(count(${students.id}) as int)`,
      avgCompletion: sql<number>`cast(coalesce(round(avg(${students.progressPct})), 0) as int)`,
    })
    .from(courses)
    .leftJoin(students, eq(students.courseId, courses.id))
    .where(eq(courses.creatorId, creator.id))
    .groupBy(courses.id, courses.name)
    .orderBy(courses.name)

  const courseIds = coursesWithStats.map(c => c.id)

  // ── Overall stats ─────────────────────────────────────────────────────────
  let totalStudents    = 0
  let avgCompletion    = 0
  let totalNudgesSent  = 0

  if (courseIds.length > 0) {
    const [statsRow] = await db
      .select({
        totalStudents: sql<number>`cast(count(${students.id}) as int)`,
        avgCompletion: sql<number>`cast(coalesce(round(avg(${students.progressPct})), 0) as int)`,
      })
      .from(students)
      .where(inArray(students.courseId, courseIds))

    totalStudents = statsRow?.totalStudents ?? 0
    avgCompletion = statsRow?.avgCompletion ?? 0

    // Total nudges sent via an innerJoin (no student IDs needed)
    const [nudgesRow] = await db
      .select({ count: sql<number>`cast(count(${nudges.id}) as int)` })
      .from(nudges)
      .innerJoin(students, eq(nudges.studentId, students.id))
      .where(and(
        inArray(students.courseId, courseIds),
        eq(nudges.status, 'sent'),
      ))
    totalNudgesSent = nudgesRow?.count ?? 0
  }

  // ── Recent nudges (last 5 sent) ───────────────────────────────────────────
  const recentNudgeRows = courseIds.length > 0
    ? await db
        .select({
          id:          nudges.id,
          subject:     nudges.subject,
          status:      nudges.status,
          createdAt:   nudges.createdAt,
          studentName: students.name,
        })
        .from(nudges)
        .innerJoin(students, eq(nudges.studentId, students.id))
        .where(and(
          inArray(students.courseId, courseIds),
          eq(nudges.status, 'sent'),
        ))
        .orderBy(desc(nudges.createdAt))
        .limit(5)
    : []

  return (
    <ProfileClient
      creator={{
        id:             creator.id,
        senderName:     creator.senderName,
        name:           creator.name,
        email:          creator.email,
        coursePlatform: creator.coursePlatform,
        profileImageUrl: creator.profileImageUrl ?? null,
        bannerImageUrl:  creator.bannerImageUrl  ?? null,
        bio:             creator.bio             ?? null,
      }}
      stats={{
        totalStudents,
        activeCourses: coursesWithStats.length,
        totalNudgesSent,
        avgCompletion,
      }}
      courses={coursesWithStats}
      recentNudges={recentNudgeRows.map(n => ({
        id:          n.id,
        subject:     n.subject,
        status:      n.status,
        createdAt:   n.createdAt?.toISOString() ?? new Date().toISOString(),
        studentName: n.studentName,
      }))}
    />
  )
}
