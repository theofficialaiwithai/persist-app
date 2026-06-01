import { notFound } from 'next/navigation'
import { db } from '@/db'
import {
  creators, courses, students,
  learningSprints, sprintMembers, sprintPosts, sprintReplies,
} from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { StudentSprintClient } from './StudentSprintClient'

// Public page — no Clerk auth, accessible to anyone with the link
export default async function PublicSprintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sprint = await db.query.learningSprints.findFirst({
    where: eq(learningSprints.id, id),
  })
  if (!sprint) notFound()

  // Course name (if course sprint)
  let courseName: string | null = null
  if (sprint.courseId) {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, sprint.courseId) })
    courseName = course?.name ?? null
  }

  // Creator name (for display only — no sensitive info)
  const creator = await db.query.creators.findFirst({ where: eq(creators.id, sprint.creatorId) })
  const creatorDisplayName = creator?.senderName || creator?.name || 'Your Instructor'

  // Members — names + progress only (no emails on public page)
  const memberRows = await db
    .select({
      id:          sprintMembers.id,
      studentId:   sprintMembers.studentId,
      progressPct: sprintMembers.progressPct,
      joinedAt:    sprintMembers.joinedAt,
    })
    .from(sprintMembers)
    .where(eq(sprintMembers.sprintId, id))
    .orderBy(desc(sprintMembers.progressPct))

  const studentIds = memberRows.map(m => m.studentId)
  const studentRows = studentIds.length > 0
    ? await db
        .select({ id: students.id, name: students.name })
        .from(students)
        .where(inArray(students.id, studentIds))
    : []
  const nameMap = new Map(studentRows.map(s => [s.id, s.name]))

  const members = memberRows.map(m => {
    const name    = nameMap.get(m.studentId) ?? 'Student'
    const initials = name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
    return {
      id:          m.id,
      studentId:   m.studentId,
      name,
      initials,
      progressPct: m.progressPct,
      joinedAt:    m.joinedAt.toISOString(),
    }
  })

  // Posts + replies (forum is visible to all members)
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
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Minimal header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <span className="font-bold text-indigo-600 text-lg">Persist</span>
          <span className="mx-2 text-[#E5E7EB]">·</span>
          <span className="text-sm text-[#6B7280]">Learning Sprint</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <StudentSprintClient
          sprint={{
            id:           sprint.id,
            title:        sprint.title,
            description:  sprint.description ?? null,
            courseName,
            skillFocus:   sprint.skillFocus ?? null,
            startDate:    sprint.startDate    as string,
            endDate:      sprint.endDate      as string,
            joinDeadline: sprint.joinDeadline as string,
            maxMembers:   sprint.maxMembers ?? 20,
            status:       sprint.status,
          }}
          members={members}
          posts={postsWithReplies}
          creatorDisplayName={creatorDisplayName}
        />
      </main>
    </div>
  )
}
