import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { creators, courses, students, progressEvents } from '@/db/schema'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import crypto from 'node:crypto'
import { generateRecapEmail, recordNudge } from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

type ProgressPayload = {
  studentEmail:      string
  studentName:       string
  courseTitle:       string
  courseExternalId:  string
  completionPercent: number
  eventType:         string
  eventTimestamp:    string
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Get creatorId from query string ──────────────────────────────────
    const creatorId = req.nextUrl.searchParams.get('creatorId')
    if (!creatorId) {
      return NextResponse.json({ error: 'Missing creatorId' }, { status: 400 })
    }

    // ── 2. Read raw body BEFORE any parsing (needed for HMAC) ───────────────
    const rawBody = await req.text()

    // ── 3. Fetch creator ────────────────────────────────────────────────────
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    })
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // ── 4. Verify HMAC-SHA256 signature ─────────────────────────────────────
    const signature = req.headers.get('x-persist-signature') ?? ''
    const expectedSig = crypto
      .createHmac('sha256', creator.webhookSecret)
      .update(rawBody)
      .digest('hex')

    let signatureValid = false
    try {
      const incoming = Buffer.from(signature, 'hex')
      const expected = Buffer.from(expectedSig, 'hex')
      signatureValid =
        incoming.length === expected.length &&
        crypto.timingSafeEqual(incoming, expected)
    } catch {
      signatureValid = false
    }

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // ── 5. Parse body ────────────────────────────────────────────────────────
    const payload = JSON.parse(rawBody) as ProgressPayload
    const {
      studentEmail,
      studentName,
      courseTitle,
      courseExternalId,
      completionPercent,
      eventType,
      eventTimestamp,
    } = payload

    const eventDate = new Date(eventTimestamp)

    // ── 6. Upsert course ─────────────────────────────────────────────────────
    const [course] = await db
      .insert(courses)
      .values({
        creatorId:       creator.id,
        name:            courseTitle,
        platformCourseId: courseExternalId,
      })
      .onConflictDoUpdate({
        target: [courses.creatorId, courses.platformCourseId],
        set:    { name: courseTitle },
      })
      .returning()

    // ── 7. Pre-upsert: get existing student for streak + recap ───────────────
    const existingStudent = await db.query.students.findFirst({
      where: and(
        eq(students.courseId, course.id),
        eq(students.email,    studentEmail),
      ),
    })

    // ── 8. Compute streak days ───────────────────────────────────────────────
    let newStreakDays = 1
    if (existingStudent) {
      const [lastEvent] = await db
        .select()
        .from(progressEvents)
        .where(eq(progressEvents.studentId, existingStudent.id))
        .orderBy(desc(progressEvents.receivedAt))
        .limit(1)

      if (lastEvent?.receivedAt) {
        const hoursSince =
          (eventDate.getTime() - new Date(lastEvent.receivedAt).getTime()) / 3_600_000
        if (hoursSince <= 24) {
          // Same calendar day — keep existing streak, don't double-count
          newStreakDays = Math.max(1, existingStudent.streakDays)
        } else if (hoursSince <= 48) {
          // Consecutive day — increment
          newStreakDays = (existingStudent.streakDays || 0) + 1
        } else {
          // Gap too large — reset
          newStreakDays = 1
        }
      }
    }

    // ── 9. Check if first progress event of today (for recap) ────────────────
    let isFirstEventOfDay = true
    if (existingStudent) {
      const todayStart = new Date(eventDate)
      todayStart.setHours(0, 0, 0, 0)

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(progressEvents)
        .where(and(
          eq(progressEvents.studentId, existingStudent.id),
          gte(progressEvents.receivedAt, todayStart),
        ))
      isFirstEventOfDay = count === 0
    }

    // ── 10. Upsert student with updated streakDays ───────────────────────────
    const [student] = await db
      .insert(students)
      .values({
        courseId:     course.id,
        email:        studentEmail,
        name:         studentName,
        lastActiveAt: eventDate,
        progressPct:  Math.round(completionPercent),
        enrolledAt:   eventType === 'course_enrolled' ? eventDate : new Date(),
        streakDays:   newStreakDays,
      })
      .onConflictDoUpdate({
        target: [students.courseId, students.email],
        set: {
          name:         studentName,
          lastActiveAt: eventDate,
          progressPct:  Math.round(completionPercent),
          streakDays:   newStreakDays,
        },
      })
      .returning()

    // ── 11. Insert progress event ────────────────────────────────────────────
    await db.insert(progressEvents).values({
      studentId:  student.id,
      eventType,
      progressPct: completionPercent.toFixed(2),
      rawPayload:  payload as Record<string, unknown>,
      receivedAt:  eventDate,
    })

    // ── 12. Daily learning recap ─────────────────────────────────────────────
    const oldProgressPct   = existingStudent?.progressPct ?? 0
    const progressIncrease = Math.round(completionPercent) - oldProgressPct

    if (isFirstEventOfDay && progressIncrease >= 5 && creator.senderEmail) {
      try {
        const recapBody = await generateRecapEmail({
          student,
          course,
          creator,
          progressPct: Math.round(completionPercent),
        })

        const firstName    = studentName.split(' ')[0]
        const recapSubject = `🎉 Great work today, ${firstName}!`

        const recapNudge = await recordNudge({
          studentId:     student.id,
          subject:       recapSubject,
          emailBody:     recapBody,
          triggerReason: 'auto:daily-recap',
          nudgeType:     'recap',
        })

        await sendNudgeEmail({
          toEmail:   studentEmail,
          toName:    studentName,
          fromName:  creator.senderName  || 'Your Instructor',
          fromEmail: creator.senderEmail || '',
          subject:   recapSubject,
          emailBody: recapBody,
          nudgeId:   recapNudge.id,
        })
      } catch (recapErr) {
        // Don't fail the whole webhook if the recap email errors
        console.error('[webhook/progress] recap email error:', recapErr)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/progress]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
