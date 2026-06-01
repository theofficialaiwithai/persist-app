import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, learningSprints, sprintMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// ── PATCH: update a sprint member's progress ──────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Not found' }, { status: 404 })

    const sprint = await db.query.learningSprints.findFirst({
      where: and(eq(learningSprints.id, id), eq(learningSprints.creatorId, creator.id)),
    })
    if (!sprint) return Response.json({ error: 'Sprint not found' }, { status: 404 })

    const body = await request.json()
    const { studentId, progressPct } = body
    if (!studentId || progressPct === undefined)
      return Response.json({ error: 'studentId and progressPct are required' }, { status: 400 })

    const pct = Math.max(0, Math.min(100, Number(progressPct)))

    const [updated] = await db
      .update(sprintMembers)
      .set({ progressPct: pct })
      .where(and(eq(sprintMembers.sprintId, id), eq(sprintMembers.studentId, studentId)))
      .returning()

    if (!updated) return Response.json({ error: 'Member not found in this sprint' }, { status: 404 })

    return Response.json({ success: true, member: updated })
  } catch (err) {
    console.error('[PATCH /api/sprints/[id]/progress]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
