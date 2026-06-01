import { db } from '@/db'
import { courses, students, learningSprints, sprintMembers } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

// ── POST: student joins a sprint by email (no Clerk auth — public endpoint) ───
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { email } = await request.json()

    if (!email?.trim())
      return Response.json({ error: 'Email is required' }, { status: 400 })

    // Fetch sprint (no auth gate — public join)
    const sprint = await db.query.learningSprints.findFirst({
      where: eq(learningSprints.id, id),
    })
    if (!sprint)
      return Response.json({ error: 'Sprint not found' }, { status: 404 })

    if (sprint.status === 'cancelled' || sprint.status === 'completed')
      return Response.json({ error: 'This sprint is no longer accepting members' }, { status: 409 })

    // Resolve the creator's courses so we can find the student
    const creatorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.creatorId, sprint.creatorId))

    const courseIds = creatorCourses.map(c => c.id)
    if (courseIds.length === 0)
      return Response.json({ error: 'No courses found for this sprint creator' }, { status: 404 })

    // Find the student by email within the creator's courses
    const student = await db.query.students.findFirst({
      where: and(
        eq(students.email, email.trim().toLowerCase()),
        inArray(students.courseId, courseIds),
      ),
    })

    if (!student)
      return Response.json(
        { error: "We couldn't find you in this creator's courses. Make sure you're using the email you enrolled with." },
        { status: 404 },
      )

    // Check member cap
    const existingCount = await db.$count(sprintMembers, eq(sprintMembers.sprintId, id))
    if (sprint.maxMembers && existingCount >= sprint.maxMembers)
      return Response.json({ error: 'This sprint is at full capacity' }, { status: 409 })

    // Upsert — if already a member return their existing record
    const [member] = await db
      .insert(sprintMembers)
      .values({
        sprintId:    id,
        studentId:   student.id,
        progressPct: student.progressPct,
      })
      .onConflictDoNothing()
      .returning()

    const initials = student.name
      .split(' ')
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return Response.json({
      success: true,
      alreadyMember: !member,
      student: {
        id:       student.id,
        name:     student.name,
        initials,
        // Never return email back to the client for display
      },
    })
  } catch (err) {
    console.error('[POST /api/sprints/[id]/join]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
