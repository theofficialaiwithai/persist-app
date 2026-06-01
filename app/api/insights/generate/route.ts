import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  creators, courses, students, nudges, progressEvents,
} from '@/db/schema'
import { eq, inArray, and, gte, desc, sql } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Insight {
  insight:     string
  action:      string
  type:        'risk' | 'opportunity' | 'win'
  metric:      string
  metricLabel: string
}

export interface InsightsResponse {
  insights:    Insight[]
  generatedAt: string
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await db.query.creators.findFirst({
      where: eq(creators.userId, userId),
    })
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    // ── 1. Courses ────────────────────────────────────────────────────────────
    const creatorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.creatorId, creator.id))

    const courseIds = creatorCourses.map(c => c.id)
    const courseMap = new Map(creatorCourses.map(c => [c.id, c.name]))

    if (courseIds.length === 0) {
      // No courses yet — return placeholder insights
      const placeholders: Insight[] = [
        {
          type:        'opportunity',
          metric:      '0',
          metricLabel: 'courses tracked',
          insight:     'No courses connected yet. Add your first course to unlock AI-powered student insights.',
          action:      'Go to Settings → Connect your course platform to start tracking students.',
        },
      ]
      return NextResponse.json({ insights: placeholders, generatedAt: new Date().toISOString() })
    }

    // ── 2. Students ───────────────────────────────────────────────────────────
    const now           = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
    const fiveDaysAgo   = new Date(now.getTime() - 5  * 86_400_000)
    const threeDaysAgo  = new Date(now.getTime() - 3  * 86_400_000)

    const allStudents = await db
      .select()
      .from(students)
      .where(inArray(students.courseId, courseIds))

    const totalStudents = allStudents.length
    if (totalStudents === 0) {
      const placeholders: Insight[] = [
        {
          type:        'opportunity',
          metric:      '0',
          metricLabel: 'students imported',
          insight:     'No students synced yet. Import students to see AI-powered retention insights.',
          action:      'Go to Students → Import your first batch of students.',
        },
      ]
      return NextResponse.json({ insights: placeholders, generatedAt: new Date().toISOString() })
    }

    const studentIds = allStudents.map(s => s.id)

    // Avg completion
    const avgCompletionRate = Math.round(
      allStudents.reduce((sum, s) => sum + s.progressPct, 0) / totalStudents,
    )

    // At-risk (5–98%, inactive > 5 days)
    const atRisk = allStudents.filter(s =>
      s.progressPct >= 5 && s.progressPct <= 98 &&
      (!s.lastActiveAt || s.lastActiveAt < fiveDaysAgo),
    )
    const studentsAtRisk = atRisk.length

    // Top dropoff point — most common progressPct bucket (rounded to nearest 10) where students go inactive
    const dropoffBuckets = new Map<number, number>()
    for (const s of atRisk) {
      const bucket = Math.round(s.progressPct / 10) * 10
      dropoffBuckets.set(bucket, (dropoffBuckets.get(bucket) ?? 0) + 1)
    }
    let topDropoffPoint = 0
    let maxCount = 0
    for (const [bucket, count] of dropoffBuckets) {
      if (count > maxCount) { maxCount = count; topDropoffPoint = bucket }
    }

    // Avg days between enroll and going inactive
    const daysToDropoff = atRisk
      .filter(s => s.lastActiveAt)
      .map(s => Math.floor((s.lastActiveAt!.getTime() - s.enrolledAt.getTime()) / 86_400_000))
    const avgDaysToDropoff = daysToDropoff.length > 0
      ? Math.round(daysToDropoff.reduce((a, b) => a + b, 0) / daysToDropoff.length)
      : 0

    // ── 3. Nudges ─────────────────────────────────────────────────────────────
    const allNudges = await db
      .select()
      .from(nudges)
      .where(inArray(nudges.studentId, studentIds))

    const sentNudges     = allNudges.filter(n => n.sentAt)
    const totalSent      = sentNudges.length

    // Nudge response rate: % of nudged students who had activity within 3 days after nudge
    let respondedCount = 0
    if (totalSent > 0) {
      const studentLastActive = new Map(allStudents.map(s => [s.id, s.lastActiveAt]))
      for (const nudge of sentNudges) {
        const lastActive = studentLastActive.get(nudge.studentId)
        if (nudge.sentAt && lastActive && lastActive > nudge.sentAt) {
          const diff = lastActive.getTime() - nudge.sentAt.getTime()
          if (diff <= 3 * 86_400_000) respondedCount++
        }
      }
    }
    const nudgeResponseRate = totalSent > 0
      ? Math.round((respondedCount / totalSent) * 100)
      : 0

    // ── 4. Streak leader ──────────────────────────────────────────────────────
    const streakLeader = allStudents
      .filter(s => s.streakDays > 0)
      .sort((a, b) => b.streakDays - a.streakDays)[0] ?? null

    // ── 5. Progress events last 30d — most active day of week ─────────────────
    const recentEvents = await db
      .select({ receivedAt: progressEvents.receivedAt })
      .from(progressEvents)
      .where(and(
        inArray(progressEvents.studentId, studentIds),
        gte(progressEvents.receivedAt, thirtyDaysAgo),
      ))

    const dayBuckets = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    for (const ev of recentEvents) {
      dayBuckets[ev.receivedAt.getDay()]++
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const mostActiveDayIdx = dayBuckets.indexOf(Math.max(...dayBuckets))
    const mostActiveDay = recentEvents.length > 0 ? dayNames[mostActiveDayIdx] : 'unknown'

    // ── 6. Courses with highest dropoff ───────────────────────────────────────
    const courseDropoff = new Map<string, number>()
    for (const s of atRisk) {
      courseDropoff.set(s.courseId, (courseDropoff.get(s.courseId) ?? 0) + 1)
    }
    const coursesWithHighestDropoff = [...courseDropoff.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => courseMap.get(id) ?? 'Unknown Course')

    // ── 7. Build summary ──────────────────────────────────────────────────────
    const dataSummary = {
      totalStudents,
      avgCompletionRate,
      studentsAtRisk,
      topDropoffPoint,
      avgDaysToDropoff,
      nudgeResponseRate,
      totalNudgesSent: totalSent,
      streakLeader: streakLeader
        ? { name: streakLeader.name.split(' ')[0], days: streakLeader.streakDays }
        : null,
      mostActiveDay,
      coursesWithHighestDropoff,
      totalCourses: creatorCourses.length,
    }

    // ── 8. Call Claude ────────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are a learning analytics expert. Analyze student retention data and provide 3 specific, actionable insights for a course creator. Each insight must include a specific number from the data. Be direct and concrete. No generic advice. Focus on what's most surprising, urgent, or actionable in this exact dataset.`,
      messages: [
        {
          role: 'user',
          content: `Here is my student data: ${JSON.stringify(dataSummary, null, 2)}

Generate exactly 3 insights in this JSON format. Return ONLY valid JSON, no markdown, no explanation:
[
  {
    "insight": "specific finding with a real number from the data",
    "action": "one specific thing to do about it right now",
    "type": "risk" | "opportunity" | "win",
    "metric": "the key number as a string (e.g. '47%' or '12' or '3 days')",
    "metricLabel": "3-5 words describing what the number means"
  }
]

Rules:
- "risk" = something bad that needs fixing
- "opportunity" = positive trend to amplify
- "win" = something going well to celebrate
- Each insight must cite a different number from the data
- Action must be one sentence, specific and immediately doable`,
        },
      ],
    })

    // Parse the response
    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '[]'

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const insights: Insight[] = JSON.parse(cleaned)

    const response: InsightsResponse = {
      insights,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error('[insights/generate]', err)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
