import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, students, courses, nudges } from '@/db/schema'
import { eq } from 'drizzle-orm'

const ALLOWED_EMOJIS = new Set(['😍', '❤️', '🔥', '⚡', '👍'])

/**
 * POST /api/nudge/[id]/react
 * Body: { emoji: string }
 *
 * Toggles the current user's reaction on a message nudge.
 * Reactions stored as JSON: { [emoji]: string[] }  (array of creator IDs)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: nudgeId } = await params
    const { emoji } = await request.json()

    if (!emoji || !ALLOWED_EMOJIS.has(emoji)) {
      return Response.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    // Get the current user's creator record
    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    // Load the nudge
    const nudge = await db.query.nudges.findFirst({
      where: eq(nudges.id, nudgeId),
    })
    if (!nudge) return Response.json({ error: 'Nudge not found' }, { status: 404 })

    // Verify the requester owns the nudge's course OR is the student matched to their email
    const student = await db.query.students.findFirst({
      where: eq(students.id, nudge.studentId),
    })
    if (!student) return Response.json({ error: 'Not found' }, { status: 404 })

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, student.courseId),
    })
    const isOwner   = course?.creatorId === creator.id
    const isStudent = student.email === creator.email
    if (!isOwner && !isStudent) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse existing reactions
    let reactions: Record<string, string[]> = {}
    try { reactions = JSON.parse(nudge.reactions) } catch { /* default empty */ }

    const currentReactors = reactions[emoji] ?? []
    const alreadyReacted  = currentReactors.includes(creator.id)

    if (alreadyReacted) {
      // Toggle off
      reactions[emoji] = currentReactors.filter(id => id !== creator.id)
      if (reactions[emoji].length === 0) delete reactions[emoji]
    } else {
      // Toggle on
      reactions[emoji] = [...currentReactors, creator.id]
    }

    await db
      .update(nudges)
      .set({ reactions: JSON.stringify(reactions) })
      .where(eq(nudges.id, nudgeId))

    return Response.json({ reactions, toggled: emoji, added: !alreadyReacted })
  } catch (err) {
    console.error('[nudge/react]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
