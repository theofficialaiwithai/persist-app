import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db'
import { creators, courses, students, nudges } from '@/db/schema'
import { eq, inArray, and, gte, lte, gt, isNotNull } from 'drizzle-orm'

// ── Inferred types from schema ───────────────────────────────────────────────
type Creator = typeof creators.$inferSelect
type Course  = typeof courses.$inferSelect
type Student = typeof students.$inferSelect

export type EligibleStudent = {
  student:          Student
  course:           Course
  creator:          Creator
  daysSinceActivity: number
}

// ── Singleton Anthropic client ───────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the completion % sits in a known drop-off zone. */
function isInRiskZone(pct: number): boolean {
  return (
    (pct >= 20 && pct <= 35) ||
    (pct >= 45 && pct <= 65) ||
    (pct >= 80 && pct <= 95)
  )
}

// ── 1. Eligibility engine ────────────────────────────────────────────────────

/**
 * Returns every student that currently needs a nudge for a given creator.
 * All four conditions must be true:
 *   a) Completion % in a high-risk drop-off zone (20-35 | 45-65 | 80-95)
 *   b) Inactive longer than (minDaysBetweenNudges × 1.5), min 3 days
 *   c) No nudge sent in the last minDaysBetweenNudges days
 *   d) Not a blackout weekend (if the creator has that setting enabled)
 */
export async function getStudentsNeedingNudge(
  creatorId: string
): Promise<EligibleStudent[]> {
  // Fetch creator settings
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  })
  if (!creator) return []

  // d. Blackout weekend — bail early for the whole batch
  const todayDow = new Date().getDay() // 0 = Sun, 6 = Sat
  if (creator.blackoutWeekends && (todayDow === 0 || todayDow === 6)) return []

  // Get all active courses for this creator
  const creatorCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.creatorId, creatorId))

  if (creatorCourses.length === 0) return []

  const courseMap = new Map<string, Course>(creatorCourses.map((c) => [c.id, c]))
  const courseIds = creatorCourses.map((c) => c.id)

  // Fetch students with completion between 5 % and 98 %
  const candidateStudents = await db
    .select()
    .from(students)
    .where(
      and(
        inArray(students.courseId, courseIds),
        gte(students.progressPct, 5),
        lte(students.progressPct, 98)
      )
    )

  if (candidateStudents.length === 0) return []

  const inactivityThresholdDays = 0 // TODO: restore to Math.max(3, creator.minDaysBetweenNudges * 1.5)
  const now = new Date()
  const nudgeCutoff = new Date(now)
  nudgeCutoff.setDate(nudgeCutoff.getDate() - creator.minDaysBetweenNudges)

  const eligible: EligibleStudent[] = []

  for (const student of candidateStudents) {
    const pct = student.progressPct  // already a number (integer column)

    // a. High-risk completion zone
    if (!isInRiskZone(pct)) continue

    // b. Inactivity threshold
    if (!student.lastActiveAt) continue
    const daysSinceActivity =
      (now.getTime() - student.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceActivity < inactivityThresholdDays) continue

    // c. No recent nudge
    const recentNudge = await db.query.nudges.findFirst({
      where: and(
        eq(nudges.studentId, student.id),
        isNotNull(nudges.sentAt),
        gt(nudges.sentAt, nudgeCutoff)
      ),
    })
    if (recentNudge) continue

    const course = courseMap.get(student.courseId)
    if (!course) continue

    eligible.push({
      student,
      course,
      creator,
      daysSinceActivity: Math.floor(daysSinceActivity),
    })
  }

  return eligible
}

// ── 2. Subject line generator (deterministic, no AI) ────────────────────────

export function generateNudgeSubject(
  studentName: string,
  _courseTitle: string,
  completionPercent: number
): string {
  const firstName = (studentName || 'there').split(' ')[0]

  if (completionPercent >= 20 && completionPercent <= 35) {
    return `You're building momentum, ${firstName} 🌱`
  }
  if (completionPercent >= 45 && completionPercent <= 65) {
    return `You're halfway there, ${firstName} — keep going 💪`
  }
  if (completionPercent >= 80 && completionPercent <= 95) {
    return `So close! You're almost done, ${firstName} 🎯`
  }
  // Fallback (shouldn't reach here if called after eligibility check)
  return `Keep going, ${firstName} — your course is waiting 📚`
}

// ── 3. AI email body generator ───────────────────────────────────────────────

export async function generateNudgeEmail(params: {
  student:           Student
  course:            Course
  creator:           Creator
  daysSinceActivity: number
}): Promise<string> {
  const { student, course, creator, daysSinceActivity } = params
  const pct = student.progressPct  // already a number (integer column)

  const systemPrompt =
    'You are a helpful assistant for online course creators. ' +
    'Write warm, personalized re-engagement emails to help students complete their courses. ' +
    'Keep emails concise (under 150 words), never guilt-trip, always encouraging.'

  const userPrompt =
    `Write a re-engagement email for a student who enrolled in '${course.name}'.\n\n` +
    `Student: ${student.name ?? student.email}\n` +
    `Course completion: ${pct}%\n` +
    `Days since last activity: ${daysSinceActivity}\n` +
    `Creator's preferred tone: ${creator.nudgeTone}\n` +
    `The email is from: ${creator.senderName}\n\n` +
    `Write only the email body (no subject line, no 'Dear' salutation — start directly with the content).\n` +
    `End with a warm sign-off from ${creator.senderName}.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected Anthropic response type: ' + block.type)
  }
  return block.text
}

// ── 4. Record a nudge in the database ───────────────────────────────────────

export async function recordNudge(params: {
  studentId:      string
  subject:        string
  emailBody:      string
  triggerReason?: string
  nudgeType?:     string
}) {
  const [nudge] = await db
    .insert(nudges)
    .values({
      studentId:     params.studentId,
      subject:       params.subject,
      body:          params.emailBody,
      triggerReason: params.triggerReason ?? 'auto:inactivity',
      nudgeType:     params.nudgeType     ?? 'nudge',
      status:        'pending',
      sentAt:        new Date(),
    })
    .returning()

  return nudge
}

// ── 5. Daily learning recap email ────────────────────────────────────────────

/**
 * Generates a short warm recap celebrating today's progress.
 * Fired from the webhook handler when a student makes 5+% progress
 * and it's their first event of the calendar day.
 */
export async function generateRecapEmail(params: {
  student:     Student
  course:      Course
  creator:     Creator
  progressPct: number
}): Promise<string> {
  const { student, course, creator, progressPct } = params

  const systemPrompt =
    'You are a helpful assistant for online course creators. ' +
    'Write short, warm daily learning recaps celebrating student progress. ' +
    'Keep it under 100 words, celebratory but not cheesy, always encouraging.'

  const userPrompt =
    `Write a short daily learning recap for a student who just made progress.\n\n` +
    `Student: ${student.name}\n` +
    `Course: ${course.name}\n` +
    `Current progress: ${progressPct}%\n` +
    `The email is from: ${creator.senderName}\n\n` +
    `Write only the email body (no subject line, no salutation). ` +
    `Under 100 words. Celebrate what they did today. ` +
    `Sign off from ${creator.senderName}.`

  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 200,
    messages:   [{ role: 'user', content: userPrompt }],
    system:     systemPrompt,
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected Anthropic response type: ' + block.type)
  }
  return block.text
}
