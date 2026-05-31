import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const body = await request.json()
    const { profileImageUrl, bannerImageUrl, bio, senderName } = body

    // Only apply fields that were explicitly passed
    const patch: Partial<typeof creators.$inferInsert> = {}
    if (profileImageUrl !== undefined) patch.profileImageUrl = profileImageUrl || null
    if (bannerImageUrl  !== undefined) patch.bannerImageUrl  = bannerImageUrl  || null
    if (bio            !== undefined) patch.bio             = bio             || null
    if (senderName     !== undefined && senderName.trim()) patch.senderName = senderName.trim()

    if (Object.keys(patch).length === 0)
      return Response.json({ error: 'No fields to update' }, { status: 400 })

    const [updated] = await db
      .update(creators)
      .set(patch)
      .where(eq(creators.userId, userId))
      .returning()

    return Response.json({ success: true, creator: updated })
  } catch (err) {
    console.error('[PATCH /api/creator/profile]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
