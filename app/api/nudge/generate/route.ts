import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, students, courses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateNudgeEmail, generateNudgeMessage, generateNudgeSubject } from '@/lib/nudge-engine'

/**
 * POST /api/nudge/generate
 * Body: { studentId: string; mode?: 'email' | 'message' }
 *
 * Generates an AI-drafted nudge preview for a student.
 * mode='email'   → formal re-engagement email (subject + body)
 * mode='message' → short conversational in-app message (body only)
 * Does NOT write anything to the database.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const reqBody = await request.json()
    const { studentId, mode = 'email' } = reqBody
    if (!studentId || typeof studentId !== 'string') {
      return Response.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Verify ownership
    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    })
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, student.courseId),
    })
    if (!course || course.creatorId !== creator.id) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // Load past tone examples from creator profile
    let toneExamples: string[] = []
    if (creator.nudgeToneExamples) {
      try {
        const parsed = JSON.parse(creator.nudgeToneExamples)
        if (Array.isArray(parsed)) toneExamples = parsed
      } catch { /* ignore */ }
    }

    const daysSinceActivity = student.lastActiveAt
      ? Math.floor((Date.now() - new Date(student.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
      : 7

    if (mode === 'message') {
      const body = await generateNudgeMessage({ student, course, creator, daysSinceActivity, toneExamples })
      return Response.json({
        body,
        studentName:     student.name ?? student.email,
        courseName:      course.name,
        progressPct:     student.progressPct,
        hasToneExamples: toneExamples.length > 0,
      })
    }

    // Email mode (default)
    const [emailBody, subject] = await Promise.all([
      generateNudgeEmail({ student, course, creator, daysSinceActivity, toneExamples }),
      Promise.resolve(generateNudgeSubject(student.name ?? student.email, course.name, student.progressPct)),
    ])

    return Response.json({
      subject,
      body:            emailBody,
      studentName:     student.name ?? student.email,
      courseName:      course.name,
      progressPct:     student.progressPct,
      hasToneExamples: toneExamples.length > 0,
    })
  } catch (err) {
    console.error('[nudge/generate]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
