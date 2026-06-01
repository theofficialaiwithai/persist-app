import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, students, courses, nudges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateNudgeSubject, recordNudge } from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

/**
 * POST /api/nudge/send
 * Body: { studentId, subject, body }
 *
 * The preview modal passes the final (possibly user-edited) subject + body.
 * After a successful Resend delivery, we prepend the body to the creator's
 * nudgeToneExamples array (keeps last 5) so future AI generations match
 * their writing style.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reqBody = await request.json()
    const { studentId, subject: customSubject, body: customBody, mode = 'email' } = reqBody

    if (!studentId || typeof studentId !== 'string') {
      return Response.json({ error: 'studentId is required' }, { status: 400 })
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) {
      return Response.json({ error: 'Creator not found' }, { status: 404 })
    }

    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    })
    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, student.courseId),
    })
    if (!course || course.creatorId !== creator.id) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const pct = student.progressPct

    // Use caller-supplied content (from preview modal, possibly edited)
    const emailBody = customBody   || '(no body)'
    const subject   = customSubject || (mode === 'message' ? 'Message' : generateNudgeSubject(student.name ?? student.email, course.name, pct))

    // Record the nudge (status = pending for email, sent immediately for message)
    const nudge = await recordNudge({
      studentId:     student.id,
      emailBody,
      subject,
      nudgeType:     mode === 'message' ? 'message' : 'nudge',
      triggerReason: mode === 'message' ? 'manual:message' : 'manual:email',
    })

    // ── In-app message: skip Resend, mark sent immediately ───────────────────
    if (mode === 'message') {
      await db.update(nudges).set({ status: 'sent', sentAt: new Date() }).where(eq(nudges.id, nudge.id))

      // Tone learning — store message body too
      try {
        let examples: string[] = []
        if (creator.nudgeToneExamples) {
          const parsed = JSON.parse(creator.nudgeToneExamples)
          if (Array.isArray(parsed)) examples = parsed
        }
        examples = [emailBody, ...examples].slice(0, 5)
        await db.update(creators).set({ nudgeToneExamples: JSON.stringify(examples) }).where(eq(creators.id, creator.id))
      } catch { /* non-fatal */ }

      return Response.json({ success: true, nudgeId: nudge.id, mode: 'message' })
    }

    // ── Email: attempt Resend delivery ───────────────────────────────────────
    const result = await sendNudgeEmail({
      toEmail:   student.email,
      toName:    student.name ?? student.email,
      fromName:  creator.senderName  || 'Your Instructor',
      fromEmail: creator.senderEmail || 'noreply@example.com',
      subject,
      emailBody,
      nudgeId:   nudge.id,
    })

    if (!result.success) {
      return Response.json({ error: result.error ?? 'Email delivery failed' }, { status: 500 })
    }

    // ── Tone learning ────────────────────────────────────────────────────────
    // Store the successfully-sent body so future AI drafts match this creator's style.
    // Keep the 5 most recent examples.
    try {
      let examples: string[] = []
      if (creator.nudgeToneExamples) {
        const parsed = JSON.parse(creator.nudgeToneExamples)
        if (Array.isArray(parsed)) examples = parsed
      }
      // Prepend newest, cap at 5
      examples = [emailBody, ...examples].slice(0, 5)

      await db
        .update(creators)
        .set({ nudgeToneExamples: JSON.stringify(examples) })
        .where(eq(creators.id, creator.id))
    } catch (toneErr) {
      // Non-fatal — email already sent, just log
      console.warn('[nudge/send] tone-learning update failed:', toneErr)
    }

    return Response.json({ success: true, nudgeId: nudge.id })
  } catch (error) {
    console.error('Nudge send error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
