import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { creators, courses, students, nudges, learningSprints, sprintPosts } from '@/db/schema'
import { eq, inArray, desc, gte } from 'drizzle-orm'

export interface Notification {
  id:        string
  type:      'nudge_sent' | 'progress' | 'completion' | 'sprint_post'
  title:     string
  subtitle:  string
  createdAt: string
  href:      string
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const creator = await db.query.creators.findFirst({ where: eq(creators.userId, userId) })
    if (!creator) return NextResponse.json({ notifications: [] })

    const creatorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.creatorId, creator.id))

    const courseIds = creatorCourses.map(c => c.id)
    const notifications: Notification[] = []

    if (courseIds.length > 0) {
      // Fetch all students for map building
      const allStudents = await db
        .select({
          id:          students.id,
          name:        students.name,
          courseId:    students.courseId,
          progressPct: students.progressPct,
          lastActiveAt: students.lastActiveAt,
        })
        .from(students)
        .where(inArray(students.courseId, courseIds))

      const studentIds   = allStudents.map(s => s.id)
      const studentMap   = new Map(allStudents.map(s => [s.id, s]))
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

      // 1. Last 3 nudges sent
      if (studentIds.length > 0) {
        const recentNudges = await db
          .select({ id: nudges.id, studentId: nudges.studentId, subject: nudges.subject, createdAt: nudges.createdAt })
          .from(nudges)
          .where(inArray(nudges.studentId, studentIds))
          .orderBy(desc(nudges.createdAt))
          .limit(3)

        for (const n of recentNudges) {
          const s = studentMap.get(n.studentId)
          notifications.push({
            id:        `nudge-${n.id}`,
            type:      'nudge_sent',
            title:     `Nudge sent to ${s?.name ?? 'student'}`,
            subtitle:  n.subject.length > 62 ? n.subject.slice(0, 62) + '…' : n.subject,
            createdAt: n.createdAt?.toISOString() ?? new Date().toISOString(),
            href:      `/dashboard/students/${n.studentId}`,
          })
        }
      }

      // 2. Last 3 students with recent progress (non-completion, active in 7d)
      const activeRecent = allStudents
        .filter(s => s.lastActiveAt && s.lastActiveAt >= sevenDaysAgo && s.progressPct < 98 && s.progressPct > 0)
        .sort((a, b) => (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0))
        .slice(0, 3)

      for (const s of activeRecent) {
        notifications.push({
          id:        `progress-${s.id}`,
          type:      'progress',
          title:     `${s.name} made progress`,
          subtitle:  `Now at ${s.progressPct}%`,
          createdAt: s.lastActiveAt?.toISOString() ?? new Date().toISOString(),
          href:      `/dashboard/students/${s.id}`,
        })
      }

      // 3. Completions in last 7 days
      const completions = allStudents
        .filter(s => s.progressPct >= 98 && s.lastActiveAt && s.lastActiveAt >= sevenDaysAgo)
        .sort((a, b) => (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0))
        .slice(0, 3)

      for (const s of completions) {
        notifications.push({
          id:        `completion-${s.id}`,
          type:      'completion',
          title:     `${s.name} completed a course! 🏆`,
          subtitle:  'Congratulations to them!',
          createdAt: s.lastActiveAt?.toISOString() ?? new Date().toISOString(),
          href:      `/dashboard/students/${s.id}`,
        })
      }
    }

    // 4. Sprint posts from creator's sprints
    const sprints = await db
      .select({ id: learningSprints.id, title: learningSprints.title })
      .from(learningSprints)
      .where(eq(learningSprints.creatorId, creator.id))

    if (sprints.length > 0) {
      const sprintIds = sprints.map(s => s.id)
      const sprintMap = new Map(sprints.map(s => [s.id, s.title]))

      const posts = await db
        .select()
        .from(sprintPosts)
        .where(inArray(sprintPosts.sprintId, sprintIds))
        .orderBy(desc(sprintPosts.createdAt))
        .limit(3)

      for (const p of posts) {
        notifications.push({
          id:        `post-${p.id}`,
          type:      'sprint_post',
          title:     `New post in ${sprintMap.get(p.sprintId) ?? 'sprint'}`,
          subtitle:  `${p.authorName} shared an update`,
          createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
          href:      `/dashboard/sprints/${p.sprintId}`,
        })
      }
    }

    // Sort all by createdAt DESC, cap at 10
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ notifications: notifications.slice(0, 10) })
  } catch (err) {
    console.error('[api/notifications]', err)
    return NextResponse.json({ notifications: [] })
  }
}
