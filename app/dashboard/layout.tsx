import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students } from '@/db/schema'
import { eq, inArray, sql, desc } from 'drizzle-orm'
import { LayoutClient } from '@/app/dashboard/LayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Fetch creator.
  // IMPORTANT: do NOT redirect to /dashboard/onboarding here — that route is
  // nested inside this same layout, so a redirect would loop infinitely.
  // The onboarding page handles its own auth/redirect logic.
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  // No creator yet (webhook hasn't fired) OR onboarding not finished:
  // render children bare so the onboarding page can display itself.
  if (!creator?.senderName) {
    return <>{children}</>
  }

  // Sidebar stats: active courses + student count
  const creatorCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.creatorId, creator.id))

  const courseIds      = creatorCourses.map(c => c.id)
  const activeCourses  = creatorCourses.length

  let totalStudents = 0
  if (courseIds.length > 0) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(inArray(students.courseId, courseIds))
    totalStudents = row?.count ?? 0
  }

  // Top 20 students for the command palette search
  const paletteStudents = courseIds.length > 0
    ? await db
        .select({
          id:          students.id,
          name:        students.name,
          email:       students.email,
          progressPct: students.progressPct,
          courseName:  courses.name,
        })
        .from(students)
        .innerJoin(courses, eq(students.courseId, courses.id))
        .where(inArray(students.courseId, courseIds))
        .orderBy(desc(students.lastActiveAt))
        .limit(20)
    : []

  return (
    <LayoutClient
      creator={{
        senderName:     creator.senderName,
        name:           creator.name,
        coursePlatform: creator.coursePlatform,
        profileImageUrl: creator.profileImageUrl ?? null,
      }}
      userType={creator.userType ?? 'creator'}
      totalStudents={totalStudents}
      activeCourses={activeCourses}
      students={paletteStudents}
    >
      {children}
    </LayoutClient>
  )
}
