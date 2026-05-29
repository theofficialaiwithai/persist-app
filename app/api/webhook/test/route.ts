import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

    const testPayload = {
      studentEmail:      'test-student@example.com',
      studentName:       'Test Student',
      courseTitle:       'My Test Course',
      courseExternalId:  'test-course-001',
      completionPercent: 45,
      eventType:         'lesson_completed',
      eventTimestamp:    new Date().toISOString(),
    }

    const rawBody = JSON.stringify(testPayload)
    const signature = crypto
      .createHmac('sha256', creator.webhookSecret)
      .update(rawBody)
      .digest('hex')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(
      `${baseUrl}/api/webhook/progress?creatorId=${creator.id}`,
      {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-persist-signature': signature,
        },
        body: rawBody,
      }
    )

    const result = await res.json()
    return Response.json({ success: res.ok, status: res.status, result })
  } catch (err) {
    console.error('[webhook/test]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
