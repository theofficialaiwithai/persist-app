import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { courses, creators } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const { courseName, externalId } = await req.json()
    if (!courseName?.trim())
      return Response.json({ error: 'Course name is required' }, { status: 400 })

    const [course] = await db
      .insert(courses)
      .values({
        creatorId:        creator.id,
        name:             courseName.trim(),
        // platformCourseId must be unique per creator — fall back to a timestamp-based ID
        // so manually-added courses don't collide with each other or webhook-synced courses.
        platformCourseId: externalId?.trim() || `manual-${Date.now()}`,
        active:           true,
      })
      .returning()

    return Response.json({ success: true, course })
  } catch (err) {
    console.error('[POST /api/courses/create]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
