import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/db'
import {
  creators, courses, students,
  learningSprints, sprintMembers, sprintPosts, sprintReplies,
} from '@/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { SprintDetailClient } from './SprintDetailClient'

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  // ── Sprint (must belong to this creator) ─────────────────────────────────
  const sprint = await db.query.learningSprints.findFirst({
    where: and(eq(learningSprints.id, id), eq(learningSprints.creatorId, creator.id)),
  })
  if (!sprint) notFound()

  // ── Course name ───────────────────────────────────────────────────────────
  let courseName: string | null = null
  if (sprint.courseId) {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, sprint.courseId) })
    courseName = course?.name ?? null
  }

  // ── Members with student info ──────────────────────────────────────────────
  const members = await db
    .select({
      id:          sprintMembers.id,
      studentId:   sprintMembers.studentId,
      progressPct: sprintMembers.progressPct,
      joinedAt:    sprintMembers.joinedAt,
    })
    .from(sprintMembers)
    .where(eq(sprintMembers.sprintId, id))
    .orderBy(desc(sprintMembers.progressPct))

  const studentIds = members.map(m => m.studentId)
  const studentRows = studentIds.length > 0
    ? await db
        .select({ id: students.id, name: students.name, email: students.email })
        .from(students)
        .where(inArray(students.id, studentIds))
    : []
  const studentMap = new Map(studentRows.map(s => [s.id, s]))

  const membersWithInfo = members.map(m => {
    const s = studentMap.get(m.studentId)
    return {
      id:          m.id,
      studentId:   m.studentId,
      name:        s?.name  ?? 'Unknown',
      email:       s?.email ?? '',
      progressPct: m.progressPct,
      joinedAt:    m.joinedAt.toISOString(),
      initials:    (s?.name ?? '?').split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2),
    }
  })

  // ── This creator's students not yet in this sprint (for add modal) ─────────
  const creatorCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.creatorId, creator.id))
  const courseIds = creatorCourses.map(c => c.id)

  const allCreatorStudents = courseIds.length > 0
    ? await db
        .select({ id: students.id, name: students.name, email: students.email })
        .from(students)
        .where(inArray(students.courseId, courseIds))
        .orderBy(students.name)
    : []

  const memberStudentIds = new Set(studentIds)
  const eligibleStudents = allCreatorStudents.filter(s => !memberStudentIds.has(s.id))

  // ── Posts + replies ───────────────────────────────────────────────────────
  const posts = await db
    .select()
    .from(sprintPosts)
    .where(eq(sprintPosts.sprintId, id))
    .orderBy(desc(sprintPosts.createdAt))

  const postIds = posts.map(p => p.id)
  const replies = postIds.length > 0
    ? await db
        .select()
        .from(sprintReplies)
        .where(inArray(sprintReplies.postId, postIds))
        .orderBy(sprintReplies.createdAt)
    : []

  const replyMap = new Map<string, typeof replies>()
  for (const r of replies) {
    const arr = replyMap.get(r.postId) ?? []
    arr.push(r)
    replyMap.set(r.postId, arr)
  }

  const postsWithReplies = posts.map(p => ({
    id:             p.id,
    authorName:     p.authorName,
    authorInitials: p.authorInitials,
    content:        p.content,
    createdAt:      p.createdAt.toISOString(),
    replies: (replyMap.get(p.id) ?? []).map(r => ({
      id:             r.id,
      authorName:     r.authorName,
      authorInitials: r.authorInitials,
      content:        r.content,
      createdAt:      r.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SprintDetailClient
        sprint={{
          id:           sprint.id,
          title:        sprint.title,
          description:  sprint.description ?? null,
          courseId:     sprint.courseId    ?? null,
          courseName,
          skillFocus:   sprint.skillFocus  ?? null,
          startDate:    sprint.startDate   as string,
          endDate:      sprint.endDate     as string,
          joinDeadline: sprint.joinDeadline as string,
          maxMembers:   sprint.maxMembers  ?? 20,
          status:       sprint.status,
        }}
        members={membersWithInfo}
        posts={postsWithReplies}
        eligibleStudents={eligibleStudents}
        creatorName={creator.senderName || creator.name}
      />
    </div>
  )
}
