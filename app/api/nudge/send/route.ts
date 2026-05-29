import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, students, courses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateNudgeEmail, generateNudgeSubject, recordNudge } from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId } = body

    if (!studentId || typeof studentId !== 'string') {
      return Response.json({ error: 'studentId is required' }, { status: 400 })
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId)
    })
    if (!creator) {
      return Response.json({ error: 'Creator not found' }, { status: 404 })
    }

    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId)
    })
    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    // students have no direct creatorId — ownership flows through courses
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, student.courseId)
    })
    if (!course || course.creatorId !== creator.id) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const daysSinceActivity = student.lastActiveAt
      ? Math.floor((Date.now() - new Date(student.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
      : 7

    const pct = Number(student.progressPct) || 45

    const emailBody = await generateNudgeEmail({ student, course, creator, daysSinceActivity })
    const subject = generateNudgeSubject(student.name ?? student.email, course.name, pct)

    const nudge = await recordNudge({
      studentId: student.id,
      emailBody,
      subject
    })

    const result = await sendNudgeEmail({
      toEmail:   student.email,
      toName:    student.name ?? student.email,
      fromName:  creator.senderName || 'Your Instructor',
      fromEmail: creator.senderEmail || 'noreply@example.com',
      subject,
      emailBody,
      nudgeId:   nudge.id
    })

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 })
    }

    return Response.json({ success: true, nudgeId: nudge.id })
  } catch (error) {
    console.error('Nudge send error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
