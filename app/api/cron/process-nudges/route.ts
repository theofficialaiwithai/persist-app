import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { creators } from '@/db/schema'
import {
  getStudentsNeedingNudge,
  generateNudgeEmail,
  generateNudgeSubject,
  recordNudge,
} from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

type NudgeResult = {
  creatorId: string
  studentId: string
  success:   boolean
  error?:    string
}

export async function GET(req: NextRequest) {
  // ── Auth: verify Vercel Cron secret ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Fetch all creators ───────────────────────────────────────────────────────
  const allCreators = await db.select().from(creators)

  let processed = 0
  let sent = 0
  let failed = 0
  const results: NudgeResult[] = []

  for (const creator of allCreators) {
    let eligible
    try {
      eligible = await getStudentsNeedingNudge(creator.id)
    } catch (err) {
      console.error(`[cron] eligibility check failed for creator ${creator.id}:`, err)
      continue
    }

    for (const { student, course, creator: creatorRecord, daysSinceActivity } of eligible) {
      processed++

      try {
        const pct = Number(student.progressPct)

        const [emailBody, subject] = await Promise.all([
          generateNudgeEmail({ student, course, creator: creatorRecord, daysSinceActivity }),
          Promise.resolve(
            generateNudgeSubject(student.name ?? student.email, course.name, pct)
          ),
        ])

        const nudge = await recordNudge({
          studentId: student.id,
          subject,
          emailBody,
        })

        const result = await sendNudgeEmail({
          toEmail:   student.email,
          toName:    student.name ?? student.email,
          fromName:  creatorRecord.senderName,
          fromEmail: creatorRecord.senderEmail,
          subject,
          emailBody,
          nudgeId:   nudge.id,
        })

        if (result.success) {
          sent++
          results.push({ creatorId: creator.id, studentId: student.id, success: true })
        } else {
          failed++
          results.push({
            creatorId: creator.id,
            studentId: student.id,
            success:   false,
            error:     result.error,
          })
        }
      } catch (err) {
        failed++
        results.push({
          creatorId: creator.id,
          studentId: student.id,
          success:   false,
          error:     err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  console.log(`[cron/process-nudges] processed=${processed} sent=${sent} failed=${failed}`)

  return NextResponse.json({ processed, sent, failed, results })
}
