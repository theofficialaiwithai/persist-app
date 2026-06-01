import { Resend } from 'resend'
import { db } from '@/db'
import { nudges } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Placeholder prevents `new Resend(undefined)` from throwing during Turbopack's
// "Collecting page data" build phase (same pattern as the neon() fix in db/index.ts).
// At request time RESEND_API_KEY is always injected by Vercel.
const resend = new Resend(process.env.RESEND_API_KEY ?? 're_build_placeholder')

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
      console.error('[email] Resend error:', error)
      await db.update(nudges).set({ status: 'failed' }).where(eq(nudges.id, nudgeId))
      // Surface a human-readable message; Resend returns structured errors
      const msg = (error as { message?: string; name?: string }).message
        ?? (error as { name?: string }).name
        ?? 'Resend rejected the email.'
      return { success: false, error: msg }
    }

    await db.update(nudges).set({ status: 'sent', sentAt: new Date() }).where(eq(nudges.id, nudgeId))
    return { success: true, emailId: data?.id }
  } catch (err) {
    await db.update(nudges).set({ status: 'failed' }).where(eq(nudges.id, nudgeId))
    return { success: false, error: String(err) }
  }
}
