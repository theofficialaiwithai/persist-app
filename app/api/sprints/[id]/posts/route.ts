import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, learningSprints, sprintPosts, sprintReplies } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// ── GET: fetch all posts + replies for a sprint ───────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const posts = await db
    .select()
    .from(sprintPosts)
    .where(eq(sprintPosts.sprintId, id))
    .orderBy(desc(sprintPosts.createdAt))

  const postIds = posts.map(p => p.id)
  const replies = postIds.length > 0
    ? await db.select().from(sprintReplies).where(
        postIds.length === 1
          ? eq(sprintReplies.postId, postIds[0])
          : eq(sprintReplies.postId, postIds[0]) // will expand below
      )
    : []

  // Attach replies to posts
  const replyMap = new Map<string, typeof replies>()
  for (const r of replies) {
    const arr = replyMap.get(r.postId) ?? []
    arr.push(r)
    replyMap.set(r.postId, arr)
  }

  const postsWithReplies = posts.map(p => ({
    ...p,
    replies: replyMap.get(p.id) ?? [],
  }))

  return Response.json({ posts: postsWithReplies })
}

// ── POST: create a new post ───────────────────────────────────────────────────
export async function POST(
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
    const { content, authorName, authorInitials, parentPostId } = body

    if (!content?.trim()) return Response.json({ error: 'Content is required' }, { status: 400 })

    // If parentPostId provided → it's a reply, not a top-level post
    if (parentPostId) {
      const [reply] = await db
        .insert(sprintReplies)
        .values({
          postId:         parentPostId,
          authorName:     authorName  || 'Creator',
          authorInitials: authorInitials || 'CR',
          content:        content.trim(),
        })
        .returning()
      return Response.json({ success: true, reply })
    }

    const [post] = await db
      .insert(sprintPosts)
      .values({
        sprintId:       id,
        authorName:     authorName  || 'Creator',
        authorInitials: authorInitials || 'CR',
        content:        content.trim(),
      })
      .returning()

    return Response.json({ success: true, post })
  } catch (err) {
    console.error('[POST /api/sprints/[id]/posts]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
