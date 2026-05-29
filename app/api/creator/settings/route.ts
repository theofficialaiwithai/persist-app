import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULTS = {
  nudgeTone:            'encouraging',
  minDaysBetweenNudges: 5,
  blackoutWeekends:     false,
} as const

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const body = await request.json()

    // ── Hard reset of nudge preferences ─────────────────────────────────────
    if (body.reset === true) {
      await db
        .update(creators)
        .set(DEFAULTS)
        .where(eq(creators.userId, userId))
      return Response.json({ success: true, reset: true })
    }

    // ── Partial update ───────────────────────────────────────────────────────
    const patch: Partial<typeof creators.$inferInsert> = {}

    if (typeof body.senderName            === 'string')  patch.senderName            = body.senderName
    if (typeof body.senderEmail           === 'string')  patch.senderEmail           = body.senderEmail
    if (typeof body.coursePlatform        === 'string')  patch.coursePlatform        = body.coursePlatform
    if (typeof body.nudgeTone             === 'string')  patch.nudgeTone             = body.nudgeTone
    if (typeof body.minDaysBetweenNudges  === 'number')  patch.minDaysBetweenNudges  = body.minDaysBetweenNudges
    if (typeof body.blackoutWeekends      === 'boolean') patch.blackoutWeekends      = body.blackoutWeekends

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await db.update(creators).set(patch).where(eq(creators.userId, userId))

    return Response.json({ success: true })
  } catch (err) {
    console.error('[creator/settings PATCH]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
