import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, sql, gte, and } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  if (!creator) redirect('/sign-in')

  // Get all courses for this creator
  const creatorCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.creatorId, creator.id))

  const courseIdList = creatorCourses.map((c) => c.id)
  const activeCourses = courseIdList.length

  let totalStudents = 0
  let nudgesThisMonth = 0

  if (courseIdList.length > 0) {
    // Count total students across all creator courses
    const [studentCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(inArray(students.courseId, courseIdList))
    totalStudents = studentCountRow?.count ?? 0

    // Count nudges sent this calendar month
    if (totalStudents > 0) {
      const studentRows = await db
        .select({ id: students.id })
        .from(students)
        .where(inArray(students.courseId, courseIdList))
      const studentIdList = studentRows.map((s) => s.id)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [nudgeCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(nudges)
        .where(
          and(
            inArray(nudges.studentId, studentIdList),
            gte(nudges.createdAt, startOfMonth)
          )
        )
      nudgesThisMonth = nudgeCountRow?.count ?? 0
    }
  }

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      valueClass: 'text-[#111827]',
    },
    {
      label: 'Active Courses',
      value: activeCourses,
      valueClass: 'text-[#111827]',
    },
    {
      label: 'Nudges Sent This Month',
      value: nudgesThisMonth,
      valueClass: 'text-[#4F46E5]',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1 text-sm">
          Welcome back, {creator.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map(({ label, value, valueClass }) => (
          <Card
            key={label}
            className="border border-[#E5E7EB] shadow-none bg-white"
          >
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium text-[#6B7280]">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
