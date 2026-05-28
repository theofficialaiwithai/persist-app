import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import crypto from 'node:crypto'

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
