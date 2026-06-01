import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

// ── PATCH: new wizard saves at step 4 ────────────────────────────────────────
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { senderName, coursePlatform, nudgeTone, minDaysBetweenNudges } = body

  // Pull Clerk identity so we always have a valid email on the record
  const user       = await currentUser()
  const clerkEmail = user?.emailAddresses[0]?.emailAddress ?? ''
  const clerkName  = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || clerkEmail

  const [creator] = await db
    .insert(creators)
    .values({
      userId,
      name:                 clerkName,
      email:                clerkEmail,
      senderEmail:          clerkEmail,
      senderName:           senderName?.trim() || clerkName,
      coursePlatform:       coursePlatform      || 'other',
      nudgeTone:            nudgeTone           || 'encouraging',
      minDaysBetweenNudges: Number(minDaysBetweenNudges) || 5,
      webhookSecret:        crypto.randomBytes(32).toString('hex'),
    })
    .onConflictDoUpdate({
      target: creators.userId,
      set: {
        senderName:           senderName?.trim() || clerkName,
        coursePlatform:       coursePlatform      || 'other',
        nudgeTone:            nudgeTone           || 'encouraging',
        minDaysBetweenNudges: Number(minDaysBetweenNudges) || 5,
      },
    })
    .returning()

  // If the upsert hit the conflict path, onConflictDoUpdate doesn't return the full row
  // — fetch it explicitly so we always have the webhookSecret + id
  const row = creator ?? await db.query.creators.findFirst({ where: eq(creators.userId, userId) })
  if (!row) return NextResponse.json({ error: 'Failed to create creator record' }, { status: 500 })

  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const webhookUrl = `${baseUrl}/api/webhook/progress?creatorId=${row.id}`

  return NextResponse.json({
    success:       true,
    webhookUrl,
    webhookSecret: row.webhookSecret,
  })
}

// ── POST: legacy form (kept for backward compat) ─────────────────────────────
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    coursePlatform,
    senderName,
    senderEmail,
    nudgeTone,
    minDaysBetweenNudges,
    blackoutWeekends,
  } = body

  // Pull real name + email from Clerk so the upsert has accurate values
  const user = await currentUser()
  const clerkEmail = user?.emailAddresses[0]?.emailAddress ?? senderEmail ?? ''
  const clerkName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    clerkEmail

  await db
    .insert(creators)
    .values({
      userId,
      name: clerkName,
      email: clerkEmail,
      coursePlatform,
      senderName,
      senderEmail,
      nudgeTone,
      minDaysBetweenNudges: Number(minDaysBetweenNudges),
      blackoutWeekends: Boolean(blackoutWeekends),
      webhookSecret: crypto.randomBytes(32).toString('hex'),
    })
    .onConflictDoUpdate({
      target: creators.userId,
      set: {
        coursePlatform,
        senderName,
        senderEmail,
        nudgeTone,
        minDaysBetweenNudges: Number(minDaysBetweenNudges),
        blackoutWeekends: Boolean(blackoutWeekends),
      },
    })

  return NextResponse.json({ success: true })
}
