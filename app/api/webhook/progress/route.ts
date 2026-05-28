import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { creators, courses, students, progressEvents } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

type ProgressPayload = {
  studentEmail: string
  studentName: string
  courseTitle: string
  courseExternalId: string
  completionPercent: number
  eventType: string
  eventTimestamp: string
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
    //    Conflict target: (creatorId, platformCourseId) unique index
    const [course] = await db
      .insert(courses)
      .values({
        creatorId: creator.id,
        name: courseTitle,
        platformCourseId: courseExternalId,
      })
      .onConflictDoUpdate({
        target: [courses.creatorId, courses.platformCourseId],
        set: { name: courseTitle },
      })
      .returning()

    // ── 7. Upsert student ────────────────────────────────────────────────────
    //    Conflict target: (courseId, email) unique index
    const [student] = await db
      .insert(students)
      .values({
        courseId: course.id,
        email: studentEmail,
        name: studentName,
        lastActiveAt: eventDate,
        progressPct: completionPercent.toFixed(2),
        enrolledAt: eventType === 'course_enrolled' ? eventDate : undefined,
      })
      .onConflictDoUpdate({
        target: [students.courseId, students.email],
        set: {
          name: studentName,
          lastActiveAt: eventDate,
          progressPct: completionPercent.toFixed(2),
        },
      })
      .returning()

    // ── 8. Insert progress event ─────────────────────────────────────────────
    await db.insert(progressEvents).values({
      studentId: student.id,
      eventType,
      progressPct: completionPercent.toFixed(2),
      rawPayload: payload as Record<string, unknown>,
      receivedAt: eventDate,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/progress]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
