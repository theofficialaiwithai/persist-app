import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

  await db
    .update(creators)
    .set({
      coursePlatform,
      senderName,
      senderEmail,
      nudgeTone,
      minDaysBetweenNudges: Number(minDaysBetweenNudges),
      blackoutWeekends: Boolean(blackoutWeekends),
    })
    .where(eq(creators.userId, userId))

  return NextResponse.json({ success: true })
}
