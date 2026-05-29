import { Resend } from 'resend'
import { db } from '@/db'
import { nudges } from '@/db/schema'
import { eq } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNudgeEmail(params: {
  toEmail: string
  toName: string
  fromName: string
  fromEmail: string
  subject: string
  emailBody: string
  nudgeId: string
}) {
  console.log('Sending email to:', params.toEmail, 'from:', 'onboarding@resend.dev')

  const { toEmail, toName, fromName, fromEmail, subject, emailBody, nudgeId } = params

  try {
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.6;">
        <p style="white-space: pre-wrap;">${emailBody}</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6B7280;">You're receiving this because you enrolled in a course. To unsubscribe, reply with "unsubscribe".</p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'Persist <onboarding@resend.dev>',
      replyTo: params.fromEmail ? `${params.fromName} <${params.fromEmail}>` : undefined,
      to: params.toEmail,
      subject,
      html,
    })

    if (error) {
      await db.update(nudges).set({ status: 'failed' }).where(eq(nudges.id, nudgeId))
      return { success: false, error: error.message }
    }

    await db.update(nudges).set({ status: 'sent', sentAt: new Date() }).where(eq(nudges.id, nudgeId))
    return { success: true, emailId: data?.id }
  } catch (err) {
    await db.update(nudges).set({ status: 'failed' }).where(eq(nudges.id, nudgeId))
    return { success: false, error: String(err) }
  }
}
