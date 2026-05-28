import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return NextResponse.json({
    webhookUrl: `${appUrl}/api/webhook/progress?creatorId=${creator.id}`,
    webhookSecret: creator.webhookSecret,
    examplePayload: {
      studentEmail: 'student@example.com',
      studentName: 'Jane Doe',
      courseTitle: 'My Flagship Course',
      courseExternalId: 'course_123',
      completionPercent: 45,
      eventType: 'lesson_complete',
      eventTimestamp: new Date().toISOString(),
    },
  })
}
