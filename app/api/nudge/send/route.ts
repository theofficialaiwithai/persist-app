import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators, students, courses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  generateNudgeEmail,
  generateNudgeSubject,
  recordNudge,
} from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { studentId } = body as { studentId?: string }

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
  }

  // ── Fetch creator ────────────────────────────────────────────────────────────
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  // ── Fetch student ────────────────────────────────────────────────────────────
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // ── Fetch course + ownership check ───────────────────────────────────────────
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, student.courseId),
  })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  if (course.creatorId !== creator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Generate email content ───────────────────────────────────────────────────
  const pct = Number(student.progressPct)
  const daysSinceActivity = student.lastActiveAt
    ? Math.floor((Date.now() - student.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  try {
    const [emailBody, subject] = await Promise.all([
      generateNudgeEmail({ student, course, creator, daysSinceActivity }),
      Promise.resolve(
        generateNudgeSubject(student.name ?? student.email, course.name, pct)
      ),
    ])

    // ── Record + send ──────────────────────────────────────────────────────────
    const nudge = await recordNudge({ studentId: student.id, subject, emailBody })

    const result = await sendNudgeEmail({
      toEmail:   student.email,
      toName:    student.name ?? student.email,
      fromName:  creator.senderName,
      fromEmail: creator.senderEmail,
      subject,
      emailBody,
      nudgeId:   nudge.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, nudgeId: nudge.id })
  } catch (err) {
    console.error('[nudge/send]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
