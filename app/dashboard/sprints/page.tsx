import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { creators, courses, learningSprints, sprintMembers } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { SprintsClient } from './SprintsClient'

export default async function SprintsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  // Courses map for badge display
  const creatorCourses = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.creatorId, creator.id))
  const courseMap = new Map(creatorCourses.map(c => [c.id, c.name]))

  // All sprints with member count
  const sprintsRaw = await db
    .select({
      id:           learningSprints.id,
      title:        learningSprints.title,
      description:  learningSprints.description,
      courseId:     learningSprints.courseId,
      skillFocus:   learningSprints.skillFocus,
      startDate:    learningSprints.startDate,
      endDate:      learningSprints.endDate,
      joinDeadline: learningSprints.joinDeadline,
      maxMembers:   learningSprints.maxMembers,
      status:       learningSprints.status,
      createdAt:    learningSprints.createdAt,
      memberCount:  sql<number>`cast(count(${sprintMembers.id}) as int)`,
    })
    .from(learningSprints)
    .leftJoin(sprintMembers, eq(sprintMembers.sprintId, learningSprints.id))
    .where(eq(learningSprints.creatorId, creator.id))
    .groupBy(learningSprints.id)
    .orderBy(desc(learningSprints.createdAt))

  // For each sprint, also grab member initials (up to 5)
  const sprintIds = sprintsRaw.map(s => s.id)

  type MemberAvatar = { sprintId: string; initials: string }
  let memberAvatars: MemberAvatar[] = []

  if (sprintIds.length > 0) {
    // Fetch all sprint member student names for avatar display
    const memberRows = await db
      .select({
        sprintId:  sprintMembers.sprintId,
        studentId: sprintMembers.studentId,
      })
      .from(sprintMembers)
      .where(
        sprintIds.length === 1
          ? eq(sprintMembers.sprintId, sprintIds[0])
          : sql`${sprintMembers.sprintId} = ANY(ARRAY[${sql.raw(sprintIds.map(id => `'${id}'`).join(','))}]::uuid[])`
      )
      .limit(100)

    // Get student names for initials
    const { students } = await import('@/db/schema')
    const { inArray } = await import('drizzle-orm')
    const studentIds = [...new Set(memberRows.map(m => m.studentId))]
    const studentNames = studentIds.length > 0
      ? await db.select({ id: students.id, name: students.name }).from(students).where(inArray(students.id, studentIds))
      : []
    const nameMap = new Map(studentNames.map(s => [s.id, s.name]))

    memberAvatars = memberRows.map(m => ({
      sprintId: m.sprintId,
      initials: (nameMap.get(m.studentId) ?? '?').split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2),
    }))
  }

  // Build avatar map
  const avatarMap = new Map<string, string[]>()
  for (const a of memberAvatars) {
    const arr = avatarMap.get(a.sprintId) ?? []
    arr.push(a.initials)
    avatarMap.set(a.sprintId, arr)
  }

  const sprints = sprintsRaw.map(s => ({
    ...s,
    courseName: s.courseId ? (courseMap.get(s.courseId) ?? null) : null,
    avatars: avatarMap.get(s.id) ?? [],
    startDate:    s.startDate    as string,
    endDate:      s.endDate      as string,
    joinDeadline: s.joinDeadline as string,
    createdAt:    s.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Learning Sprints</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Time-boxed learning challenges for your students
          </p>
        </div>
        <Link
          href="/dashboard/sprints/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4572E] hover:bg-[#CC4A23] text-white text-sm font-medium rounded-xl transition-colors"
        >
          <span>+</span> Create Sprint
        </Link>
      </div>

      <SprintsClient sprints={sprints} />
    </div>
  )
}
