import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students } from '@/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import { LayoutClient } from '@/app/dashboard/LayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Fetch creator — redirect to onboarding if missing
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

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

  return (
    <LayoutClient
      creator={{
        senderName:     creator.senderName,
        name:           creator.name,
        coursePlatform: creator.coursePlatform,
        profileImageUrl: creator.profileImageUrl ?? null,
      }}
      totalStudents={totalStudents}
      activeCourses={activeCourses}
    >
      {children}
    </LayoutClient>
  )
}
