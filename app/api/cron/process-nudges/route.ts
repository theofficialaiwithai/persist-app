import { db } from '@/db'
import { creators } from '@/db/schema'
import { getStudentsNeedingNudge, generateNudgeEmail, generateNudgeSubject, recordNudge } from '@/lib/nudge-engine'
import { sendNudgeEmail } from '@/lib/email'

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch all creators
  const allCreators = await db.select().from(creators)

  const results: {
    creatorId: string
    studentId?: string
    success: boolean
    error?: string
  }[] = []

  // 3. For each creator, find eligible students and send nudges
  for (const creator of allCreators) {
    try {
      const eligible = await getStudentsNeedingNudge(creator.id)

      for (const { student, course, daysSinceActivity } of eligible) {
        try {
          const emailBody = await generateNudgeEmail({ student, course, creator, daysSinceActivity })
          const subject = generateNudgeSubject(student.name, course.name, student.progressPct ?? 45)
          const nudge = await recordNudge({
            studentId: student.id,
            emailBody,
            subject,
          })
          const result = await sendNudgeEmail({
            toEmail:   student.email,
            toName:    student.name,
            fromName:  creator.senderName || 'Your Instructor',
            fromEmail: creator.senderEmail || '',
            subject,
            emailBody,
            nudgeId:   nudge.id,
          })
          results.push({
            creatorId: creator.id,
            studentId: student.id,
            success:   result.success,
            error:     result.success ? undefined : result.error,
          })
        } catch (err) {
          results.push({ creatorId: creator.id, studentId: student.id, success: false, error: String(err) })
        }
      }
    } catch (err) {
      results.push({ creatorId: creator.id, success: false, error: String(err) })
    }
  }

  const sent   = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`[cron/process-nudges] processed=${allCreators.length} sent=${sent} failed=${failed}`)

  return Response.json({ processed: allCreators.length, sent, failed, results })
}
