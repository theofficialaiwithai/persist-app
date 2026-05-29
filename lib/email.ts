import { Resend } from 'resend'
import { db } from '@/db'
import { nudges } from '@/db/schema'
import { eq } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY)

type SendResult =
  | { success: true;  emailId: string }
  | { success: false; error: string }

export async function sendNudgeEmail(params: {
  toEmail:   string
  toName:    string
  fromName:  string
  fromEmail: string
  subject:   string
  emailBody: string
  nudgeId:   string
}): Promise<SendResult> {
  const { toEmail, fromName, fromEmail, subject, emailBody, nudgeId } = params

  const html = `
<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.6;">
  <p style="white-space: pre-wrap;">${emailBody}</p>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="font-size: 12px; color: #6B7280;">You're receiving this because you enrolled in a course. To unsubscribe, reply with "unsubscribe".</p>
</div>`

  try {
    const { data, error } = await resend.emails.send({
      from:    'Persist <onboarding@resend.dev>', // shared test sender, no domain verification needed
      replyTo: `${fromName} <${fromEmail}>`,      // creator's address for student replies
      to:      toEmail,
      subject,
      html,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Resend returned no data')
    }

    // Mark as sent and store Resend's message ID
    await db
      .update(nudges)
      .set({ status: 'sent', sentAt: new Date(), resendMessageId: data.id })
      .where(eq(nudges.id, nudgeId))

    return { success: true, emailId: data.id }
  } catch (err) {
    // Mark as failed — suppress any secondary DB error so the original bubbles
    await db
      .update(nudges)
      .set({ status: 'failed' })
      .where(eq(nudges.id, nudgeId))
      .catch(() => {})

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown send error',
    }
  }
}
