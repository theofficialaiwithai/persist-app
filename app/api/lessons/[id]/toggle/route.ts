import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, lessons, lessonCompletions, courses, students } from '@/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: lessonId } = await params

  try {
    const creator = await db.query.creators.findFirst({ where: eq(creators.userId, userId) })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // ── Find lesson + its course ──────────────────────────────────────────────
    const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    // ── Check if already completed ────────────────────────────────────────────
    const existing = await db.query.lessonCompletions.findFirst({
      where: and(
        eq(lessonCompletions.lessonId, lessonId),
        eq(lessonCompletions.learnerId, creator.id),
      ),
    })

    let completed: boolean
    if (existing) {
      // Un-complete
      await db
        .delete(lessonCompletions)
        .where(and(
          eq(lessonCompletions.lessonId, lessonId),
          eq(lessonCompletions.learnerId, creator.id),
        ))
      completed = false
    } else {
      // Complete
      await db
        .insert(lessonCompletions)
        .values({ lessonId, learnerId: creator.id })
        .onConflictDoNothing()
      completed = true
    }

    // ── Recalculate course progress ───────────────────────────────────────────
    const [totalRow] = await db
      .select({ count: count() })
      .from(lessons)
      .where(eq(lessons.courseId, lesson.courseId))

    const [doneRow] = await db
      .select({ count: count() })
      .from(lessonCompletions)
      .where(
        sql`${lessonCompletions.lessonId} IN (
          SELECT id FROM lessons WHERE course_id = ${lesson.courseId}
        ) AND ${lessonCompletions.learnerId} = ${creator.id}`
      )

    const total      = totalRow?.count ?? 0
    const done       = doneRow?.count  ?? 0
    const progressPct = total > 0 ? Math.round((done / total) * 100) : 0

    // ── Update student record for this course ─────────────────────────────────
    // Upsert a student record for the learner on this course
    const course = await db.query.courses.findFirst({ where: eq(courses.id, lesson.courseId) })
    if (course) {
      await db
        .insert(students)
        .values({
          courseId:         lesson.courseId,
          email:            creator.email,
          name:             creator.senderName || creator.name,
          progressPct,
          lastActiveAt:     new Date(),
          lessonsCompleted: done,
          streakDays:       0,
        })
        .onConflictDoUpdate({
          target: [students.courseId, students.email],
          set: {
            progressPct,
            lastActiveAt:     new Date(),
            lessonsCompleted: done,
          },
        })
    }

    return NextResponse.json({ completed, progressPct, completedCount: done, totalCount: total })
  } catch (err) {
    console.error('[lessons/toggle]', err)
    return NextResponse.json({ error: 'Failed to toggle lesson' }, { status: 500 })
  }
}
