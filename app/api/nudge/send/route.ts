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
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { studentId } = body as { studentId?: string }

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
  }

  try {
    // ── 1. Creator lookup — userId is Clerk text, creators.userId is text ────────
    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── 2. Student lookup — studentId must be a UUID string ───────────────────────
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    })
    if (!student) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── 3. Course lookup + ownership check (UUID-to-UUID comparison) ─────────────
    //    student.courseId (uuid) → courses.id (uuid) → course.creatorId (uuid) === creator.id (uuid)
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, student.courseId),
    })
    if (!course || course.creatorId !== creator.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── 4. Generate email content ────────────────────────────────────────────────
    const pct = Number(student.progressPct)
    const daysSinceActivity = student.lastActiveAt
      ? Math.floor((Date.now() - student.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const [emailBody, subject] = await Promise.all([
      generateNudgeEmail({ student, course, creator, daysSinceActivity }),
      Promise.resolve(
        generateNudgeSubject(student.name ?? student.email, course.name, pct)
      ),
    ])

    // ── 5. Record nudge then send ────────────────────────────────────────────────
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
