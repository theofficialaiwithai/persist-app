import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, learningSprints } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const body = await request.json()
    const { title, description, courseId, skillFocus, startDate, endDate, joinDeadline, maxMembers } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title?.trim())    return Response.json({ error: 'Title is required' },       { status: 400 })
    if (!startDate)        return Response.json({ error: 'Start date is required' },   { status: 400 })
    if (!endDate)          return Response.json({ error: 'End date is required' },     { status: 400 })
    if (!joinDeadline)     return Response.json({ error: 'Join deadline is required' }, { status: 400 })
    if (endDate <= startDate)
      return Response.json({ error: 'End date must be after start date' }, { status: 400 })
    if (joinDeadline >= startDate)
      return Response.json({ error: 'Join deadline must be before start date' }, { status: 400 })

    const [sprint] = await db
      .insert(learningSprints)
      .values({
        creatorId:    creator.id,
        courseId:     courseId || null,
        title:        title.trim(),
        description:  description?.trim() || null,
        skillFocus:   skillFocus?.trim()  || null,
        startDate,
        endDate,
        joinDeadline,
        maxMembers:   maxMembers ? Number(maxMembers) : 20,
        status:       'open',
      })
      .returning()

    return Response.json({ success: true, sprint })
  } catch (err) {
    console.error('[POST /api/sprints/create]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
