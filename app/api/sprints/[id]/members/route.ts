import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, courses, students, learningSprints, sprintMembers } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

// ── POST: add a student to a sprint ──────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Not found' }, { status: 404 })

    const sprint = await db.query.learningSprints.findFirst({
      where: and(eq(learningSprints.id, id), eq(learningSprints.creatorId, creator.id)),
    })
    if (!sprint) return Response.json({ error: 'Sprint not found' }, { status: 404 })

    const body = await request.json()
    const { studentId } = body
    if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 })

    // Verify the student belongs to this creator
    const creatorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.creatorId, creator.id))
    const courseIds = creatorCourses.map(c => c.id)

    const student = courseIds.length > 0
      ? await db.query.students.findFirst({
          where: and(eq(students.id, studentId), inArray(students.courseId, courseIds)),
        })
      : null

    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

    // Check member cap
    const existingCount = await db.$count(
      sprintMembers,
      eq(sprintMembers.sprintId, id),
    )
    if (sprint.maxMembers && existingCount >= sprint.maxMembers)
      return Response.json({ error: 'Sprint is at capacity' }, { status: 409 })

    const [member] = await db
      .insert(sprintMembers)
      .values({ sprintId: id, studentId, progressPct: student.progressPct })
      .onConflictDoNothing()
      .returning()

    return Response.json({ success: true, member })
  } catch (err) {
    console.error('[POST /api/sprints/[id]/members]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
