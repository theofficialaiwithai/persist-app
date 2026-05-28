import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  getStudentsNeedingNudge,
  generateNudgeEmail,
  generateNudgeSubject,
} from '@/lib/nudge-engine'

export async function POST() {
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

  try {
    const eligible = await getStudentsNeedingNudge(creator.id)

    if (eligible.length === 0) {
      return NextResponse.json({ eligible: 0, preview: null })
    }

    // Generate a preview for the first eligible student
    const first = eligible[0]
    const pct = Number(first.student.progressPct)

    const [emailBody, subject] = await Promise.all([
      generateNudgeEmail(first),
      Promise.resolve(
        generateNudgeSubject(
          first.student.name ?? first.student.email,
          first.course.name,
          pct
        )
      ),
    ])

    return NextResponse.json({
      eligible: eligible.length,
      preview: {
        studentName:       first.student.name ?? first.student.email,
        courseTitle:       first.course.name,
        completionPercent: pct,
        subject,
        emailBody,
      },
    })
  } catch (err) {
    console.error('[nudge/generate-preview]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
