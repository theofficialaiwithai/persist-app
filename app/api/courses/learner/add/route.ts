import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, courses, lessons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const creator = await db.query.creators.findFirst({ where: eq(creators.userId, userId) })
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    if (creator.userType !== 'learner') return NextResponse.json({ error: 'Learners only' }, { status: 403 })

    const { name, url, lessonTitles } = await req.json() as {
      name:         string
      url?:         string
      lessonTitles: string[]
    }

    if (!name?.trim()) return NextResponse.json({ error: 'Course name required' }, { status: 400 })
    if (!Array.isArray(lessonTitles) || lessonTitles.length === 0) {
      return NextResponse.json({ error: 'At least one lesson required' }, { status: 400 })
    }

    // ── Insert course (no platformCourseId — manually added) ──────────────────
    const [course] = await db
      .insert(courses)
      .values({
        creatorId:    creator.id,
        name:         name.trim(),
        totalLessons: lessonTitles.length,
        active:       true,
      })
      .returning()

    // ── Insert lessons in order ───────────────────────────────────────────────
    const lessonRows = lessonTitles
      .map(t => t.trim())
      .filter(Boolean)
      .map((title, i) => ({
        courseId: course.id,
        title,
        position: i,
      }))

    const savedLessons = await db
      .insert(lessons)
      .values(lessonRows)
      .returning()

    return NextResponse.json({ courseId: course.id, lessonCount: savedLessons.length })
  } catch (err) {
    console.error('[courses/learner/add]', err)
    return NextResponse.json({ error: 'Failed to save course' }, { status: 500 })
  }
}
