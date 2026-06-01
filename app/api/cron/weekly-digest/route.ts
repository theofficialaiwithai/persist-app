import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, and, gte, lt, lte, gt, isNull, or, desc, sql } from 'drizzle-orm'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'

const resend  = new Resend(process.env.RESEND_API_KEY ?? 're_build_placeholder')
const claude  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'sk-build-placeholder' })

// ── Auth ──────────────────────────────────────────────────────────────────────

function authorized(request: Request) {
  const header = request.headers.get('authorization')
  return header === `Bearer ${process.env.CRON_SECRET}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? '+100%' : '—'
  const diff = Math.round(((curr - prev) / prev) * 100)
  return diff > 0 ? `+${diff}%` : `${diff}%`
}

// ── AI summary ────────────────────────────────────────────────────────────────

async function generateSummary(data: {
  firstName:        string
  newEnrollments:   number
  completions:      number
  nudgesSent:       number
  nudgesLastWeek:   number
  resumedAfterNudge: number
  streakLeader:     { name: string; days: number } | null
  atRiskCount:      number
  totalActive:      number
}): Promise<string> {
  const msg = await claude.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 180,
    messages: [{
      role:    'user',
      content: `Write a warm, encouraging weekly summary for a course creator named ${data.firstName}.
Data: ${JSON.stringify(data)}
Rules:
- Exactly 3 sentences.
- Reference specific numbers from the data (e.g. "${data.newEnrollments} new students", "${data.nudgesSent} nudges").
${data.streakLeader ? `- Mention ${data.streakLeader.name} who has a ${data.streakLeader.days}-day streak.` : ''}
- End sentence 3 with one specific, actionable focus for this week.
- Warm and encouraging tone. Under 65 words total. Plain text only, no markdown.`,
    }],
  })
  const block = msg.content[0]
  return block?.type === 'text' ? block.text.trim() : `Great week, ${data.firstName}! Keep up the momentum.`
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildEmailHtml(params: {
  firstName:        string
  weekLabel:        string
  summaryParagraph: string
  totalActive:      number
  nudgesSent:       number
  completions:      number
  newEnrollments:   number
  nudgeChange:      string
  streakLeader:     { name: string; days: number } | null
  atRiskStudents:   { name: string; courseName: string; progressPct: number; daysInactive: number }[]
  dashboardUrl:     string
}): string {
  const {
    firstName, weekLabel, summaryParagraph,
    totalActive, nudgesSent, completions, newEnrollments, nudgeChange,
    streakLeader, atRiskStudents, dashboardUrl,
  } = params

  const statPill = (label: string, value: string | number, color: string) => `
    <td style="padding:0 8px;">
      <div style="background:${color}12; border:1px solid ${color}30; border-radius:12px; padding:14px 20px; text-align:center; min-width:100px;">
        <div style="font-size:26px; font-weight:700; color:${color}; line-height:1;">${value}</div>
        <div style="font-size:11px; color:#6B7C7B; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">${label}</div>
      </div>
    </td>`

  const atRiskRows = atRiskStudents.map(s => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #F3F4F6;">
        <div style="font-size:13px; font-weight:600; color:#111827;">${s.name}</div>
        <div style="font-size:11px; color:#9CA3AF;">${s.courseName} · ${s.progressPct}% complete</div>
      </td>
      <td style="padding:10px 0; border-bottom:1px solid #F3F4F6; text-align:right;">
        <span style="background:#FEF3C7; color:#92400E; border-radius:999px; font-size:11px; font-weight:600; padding:3px 10px;">
          ${s.daysInactive}d inactive
        </span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your weekly Persist report</title></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Inter',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;">
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

      <!-- Header bar -->
      <tr>
        <td style="background:linear-gradient(135deg,#004643 0%,#003533 70%,#7FB069 100%);padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Persist</div>
          <div style="font-size:13px;color:#B8D9CE;margin-top:2px;">Student retention, automated</div>
        </td>
      </tr>

      <!-- Title -->
      <tr>
        <td style="padding:36px 40px 24px;">
          <div style="font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">${weekLabel}</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;line-height:1.2;">
            Your weekly report,<br>${firstName} 👋
          </h1>
        </td>
      </tr>

      <!-- AI Summary -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="background:#F0F7EE;border-left:3px solid #7FB069;border-radius:0 12px 12px 0;padding:16px 20px;">
            <div style="font-size:10px;font-weight:700;color:#5A8F47;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">✨ AI Summary</div>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#1A2E2D;">${summaryParagraph}</p>
          </div>
        </td>
      </tr>

      <!-- Stat pills -->
      <tr>
        <td style="padding:0 40px 36px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              ${statPill('Students Active', totalActive,   '#004643')}
              ${statPill('Nudges Sent',     nudgesSent,    '#E4572E')}
              ${statPill('Completions',     completions,   '#7FB069')}
              ${statPill('New Enrollments', newEnrollments,'#004643')}
            </tr>
          </table>
          ${nudgesSent > 0 ? `<div style="margin-top:10px;font-size:11px;color:#9CA3AF;text-align:center;">Nudge volume vs last week: <strong style="color:#004643;">${nudgeChange}</strong></div>` : ''}
        </td>
      </tr>

      ${streakLeader ? `
      <!-- Star student -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;">
            <div>
              <div style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">🏆 This week's star student</div>
              <div style="font-size:18px;font-weight:700;color:#78350F;">${streakLeader.name}</div>
              <div style="font-size:13px;color:#92400E;margin-top:2px;">🔥 ${streakLeader.days}-day streak — on fire!</div>
            </div>
          </div>
        </td>
      </tr>` : ''}

      ${atRiskStudents.length > 0 ? `
      <!-- Needs attention -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:12px;">⚠️ Needs your attention this week</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${atRiskRows}
          </table>
        </td>
      </tr>` : `
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="background:#F0F7EE;border-radius:12px;padding:16px 20px;text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">🎉</div>
            <div style="font-size:13px;font-weight:600;color:#5A8F47;">All students are on track this week!</div>
          </div>
        </td>
      </tr>`}

      <!-- CTA -->
      <tr>
        <td style="padding:0 40px 40px;text-align:center;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:#E4572E;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;letter-spacing:0.01em;">
            View your dashboard →
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F7F8FA;padding:20px 40px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.6;">
            Sent automatically every Monday at 8am by Persist.<br>
            You're receiving this because you have a Persist creator account.<br>
            <a href="${dashboardUrl}/settings" style="color:#004643;">Manage email preferences</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now          = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7  * 86_400_000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000)
  const fiveDaysAgo  = new Date(now.getTime() - 5  * 86_400_000)

  const allCreators  = await db.select().from(creators)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://persist.app'

  const results: { creatorId: string; email: string; success: boolean; error?: string }[] = []

  for (const creator of allCreators) {
    try {
      // ── 1. Creator courses ──────────────────────────────────────────────────
      const creatorCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.creatorId, creator.id))

      const courseIds = creatorCourses.map(c => c.id)
      const courseMap = new Map(creatorCourses.map(c => [c.id, c.name]))

      if (courseIds.length === 0) continue   // no courses, skip

      // ── 2. All students ─────────────────────────────────────────────────────
      const allStudents = await db
        .select()
        .from(students)
        .where(inArray(students.courseId, courseIds))

      if (allStudents.length === 0) continue  // no students, skip

      const studentIds = allStudents.map(s => s.id)

      // ── 3. This-week stats ──────────────────────────────────────────────────

      // New enrollments this week
      const newEnrollments = allStudents.filter(s => s.enrolledAt >= sevenDaysAgo).length

      // Completions this week (progressPct ≥ 98, lastActiveAt in last 7d)
      const completions = allStudents.filter(
        s => s.progressPct >= 98 && s.lastActiveAt && s.lastActiveAt >= sevenDaysAgo,
      ).length

      // Active students (lastActiveAt in last 7d)
      const totalActive = allStudents.filter(
        s => s.lastActiveAt && s.lastActiveAt >= sevenDaysAgo,
      ).length

      // At-risk: 5–98% progress, inactive > 5 days
      const atRiskRaw = allStudents
        .filter(s =>
          s.progressPct >= 5 && s.progressPct <= 98 &&
          (!s.lastActiveAt || s.lastActiveAt < fiveDaysAgo),
        )
        .sort((a, b) => (a.lastActiveAt?.getTime() ?? 0) - (b.lastActiveAt?.getTime() ?? 0))
        .slice(0, 3)

      const atRiskStudents = atRiskRaw.map(s => ({
        name:       s.name,
        courseName: courseMap.get(s.courseId) ?? 'Unknown Course',
        progressPct: s.progressPct,
        daysInactive: s.lastActiveAt
          ? Math.floor((now.getTime() - s.lastActiveAt.getTime()) / 86_400_000)
          : Math.floor((now.getTime() - s.enrolledAt.getTime()) / 86_400_000),
      }))

      // Streak leader
      const streakLeader = allStudents
        .filter(s => s.streakDays > 0)
        .sort((a, b) => b.streakDays - a.streakDays)[0] ?? null

      // ── 4. Nudges this week vs last week ────────────────────────────────────
      const allNudges = await db
        .select()
        .from(nudges)
        .where(and(
          inArray(nudges.studentId, studentIds),
          gte(nudges.createdAt, fourteenDaysAgo),
        ))

      const nudgesThisWeek = allNudges.filter(n => n.createdAt && n.createdAt >= sevenDaysAgo).length
      const nudgesLastWeek = allNudges.filter(n => n.createdAt && n.createdAt < sevenDaysAgo).length

      // Resumed after nudge: nudged last week, then had activity since
      const nudgedStudentIds = new Set(
        allNudges
          .filter(n => n.sentAt && n.sentAt < sevenDaysAgo && n.sentAt >= fourteenDaysAgo)
          .map(n => n.studentId),
      )
      const resumedAfterNudge = allStudents.filter(
        s => nudgedStudentIds.has(s.id) && s.lastActiveAt && s.lastActiveAt >= sevenDaysAgo,
      ).length

      // ── 5. AI summary ───────────────────────────────────────────────────────
      const firstName = creator.senderName?.split(' ')[0] || creator.name.split(' ')[0] || 'there'

      const summaryParagraph = await generateSummary({
        firstName,
        newEnrollments,
        completions,
        nudgesSent:       nudgesThisWeek,
        nudgesLastWeek,
        resumedAfterNudge,
        streakLeader:     streakLeader ? { name: streakLeader.name.split(' ')[0], days: streakLeader.streakDays } : null,
        atRiskCount:      atRiskStudents.length,
        totalActive,
      })

      // ── 6. Build + send email ───────────────────────────────────────────────
      const weekLabel = `Week of ${fmtDate(sevenDaysAgo)} – ${fmtDate(now)}`
      const subject   = `Your weekly Persist report · ${fmtDate(sevenDaysAgo)}`

      const html = buildEmailHtml({
        firstName,
        weekLabel,
        summaryParagraph,
        totalActive,
        nudgesSent:    nudgesThisWeek,
        completions,
        newEnrollments,
        nudgeChange:   pctChange(nudgesThisWeek, nudgesLastWeek),
        streakLeader:  streakLeader ? { name: streakLeader.name.split(' ')[0], days: streakLeader.streakDays } : null,
        atRiskStudents,
        dashboardUrl:  `${appUrl}/dashboard`,
      })

      const { error } = await resend.emails.send({
        from:    'Persist <onboarding@resend.dev>',
        to:      creator.email,
        subject,
        html,
      })

      if (error) throw new Error(error.message)

      results.push({ creatorId: creator.id, email: creator.email, success: true })
    } catch (err) {
      console.error(`[weekly-digest] creator=${creator.id}`, err)
      results.push({ creatorId: creator.id, email: creator.email, success: false, error: String(err) })
    }
  }

  const sent   = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`[cron/weekly-digest] processed=${allCreators.length} sent=${sent} failed=${failed}`)

  return Response.json({ processed: allCreators.length, sent, failed, results })
}
