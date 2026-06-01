import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import {
  creators, courses, students,
  learningSprints, sprintMembers, sprintPosts,
} from '@/db/schema'
import { eq, inArray, and, or, desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'
import { CopyWebhookButton } from '@/app/dashboard/learn/CopyWebhookButton'
import { Zap, BookOpen, Flame, ExternalLink } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysLeft(end: string): number {
  return Math.max(0, Math.ceil((new Date(end + 'T23:59:59').getTime() - Date.now()) / 86_400_000))
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LearnPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')
  if (creator.userType === 'creator') redirect('/dashboard')

  const firstName =
    creator.senderName?.split(' ')[0] ||
    creator.name?.split(' ')[0] ||
    'there'

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://persist-app.vercel.app'
  const webhookUrl = `${appUrl}/api/webhook/progress?creatorId=${creator.id}`

  // ── Courses ──────────────────────────────────────────────────────────────────
  const myCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.creatorId, creator.id))
    .orderBy(desc(courses.createdAt))

  const courseIds = myCourses.map(c => c.id)

  // ── Student records (progress tracking rows) ─────────────────────────────────
  const studentRows = courseIds.length > 0
    ? await db
        .select()
        .from(students)
        .where(inArray(students.courseId, courseIds))
    : []

  // Streak — max across all student rows
  const maxStreak = studentRows.reduce((m, s) => Math.max(m, s.streakDays), 0)

  // ── Active sprints (created by this learner) ─────────────────────────────────
  const activeSprints = await db
    .select()
    .from(learningSprints)
    .where(and(
      eq(learningSprints.creatorId, creator.id),
      or(
        eq(learningSprints.status, 'open'),
        eq(learningSprints.status, 'active'),
      ),
    ))
    .orderBy(learningSprints.startDate)
    .limit(5)

  // Member counts per sprint
  const sprintIds = activeSprints.map(s => s.id)
  const memberCountRows = sprintIds.length > 0
    ? await db
        .select({
          sprintId: sprintMembers.sprintId,
          count: sql<number>`count(*)::int`,
        })
        .from(sprintMembers)
        .where(inArray(sprintMembers.sprintId, sprintIds))
        .groupBy(sprintMembers.sprintId)
    : []
  const memberMap = new Map(memberCountRows.map(r => [r.sprintId, r.count]))

  // Post counts per sprint
  const postCountRows = sprintIds.length > 0
    ? await db
        .select({
          sprintId: sprintPosts.sprintId,
          count: sql<number>`count(*)::int`,
        })
        .from(sprintPosts)
        .where(inArray(sprintPosts.sprintId, sprintIds))
        .groupBy(sprintPosts.sprintId)
    : []
  const postMap = new Map(postCountRows.map(r => [r.sprintId, r.count]))

  // ── Community feed — last 5 posts from learner's sprints ────────────────────
  const recentPosts = sprintIds.length > 0
    ? await db
        .select({
          id:             sprintPosts.id,
          authorName:     sprintPosts.authorName,
          authorInitials: sprintPosts.authorInitials,
          content:        sprintPosts.content,
          createdAt:      sprintPosts.createdAt,
          sprintId:       sprintPosts.sprintId,
        })
        .from(sprintPosts)
        .where(inArray(sprintPosts.sprintId, sprintIds))
        .orderBy(desc(sprintPosts.createdAt))
        .limit(5)
    : []

  const sprintTitleMap = new Map(activeSprints.map(s => [s.id, s.title]))

  // ── Progress per course ──────────────────────────────────────────────────────
  const progressByCourse = new Map<string, { pct: number; lastActive: Date | null }>()
  for (const s of studentRows) {
    const existing = progressByCourse.get(s.courseId)
    const pct = s.progressPct
    if (!existing || pct > existing.pct) {
      progressByCourse.set(s.courseId, { pct, lastActive: s.lastActiveAt })
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[#1A2E2D]">
          Welcome back, {firstName} 🎓
        </h1>
        <p className="text-[#6B7C7B] mt-1 text-sm">Keep the momentum going.</p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-500" />, label: 'Learning Streak',   value: `${maxStreak} day${maxStreak !== 1 ? 's' : ''}`, bg: 'bg-orange-50' },
          { icon: <BookOpen className="w-5 h-5 text-[#004643]" />, label: 'Courses Enrolled', value: myCourses.length,                                   bg: 'bg-[#E8F4F0]' },
          { icon: <Zap className="w-5 h-5 text-[#E4572E]" />,      label: 'Active Sprints',  value: activeSprints.length,                               bg: 'bg-[#FFF0EB]' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${stat.bg} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-[#1A2E2D] leading-none">{stat.value}</p>
            <p className="text-xs font-medium text-[#6B7C7B] uppercase tracking-wide mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Course progress ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#111827]">Your Progress</h2>
          {myCourses.length > 0 && (
            <Link href="/dashboard/students" className="text-xs text-[#004643] hover:text-[#003533] transition-colors">
              Manage courses →
            </Link>
          )}
        </div>

        {myCourses.length === 0 ? (
          /* ── Empty: no courses yet ─── */
          <div className="py-8 space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-[#111827] mb-1">Connect a course to start tracking your progress</p>
              <p className="text-xs text-[#6B7C7B]">Add it manually, or paste your tracking URL into Zapier.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Manual add */}
              <Link
                href="/dashboard/students"
                className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-[#E5E7EB] hover:border-[#004643] hover:bg-[#F7FFFE] transition-all group"
              >
                <BookOpen className="w-5 h-5 text-[#004643]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827] group-hover:text-[#004643]">Add a course manually</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Import students and set up tracking</p>
                </div>
              </Link>

              {/* Tracking URL */}
              <div className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-[#E5E7EB]">
                <ExternalLink className="w-5 h-5 text-[#E4572E]" />
                <div className="w-full">
                  <p className="text-sm font-semibold text-[#111827]">Get your tracking URL</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 mb-2">
                    Paste into Zapier → your course platform → Persist gets notified when you make progress
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] font-mono bg-[#F7F8FA] border border-[#E5E7EB] rounded px-2 py-1 truncate text-[#374151]">
                      {webhookUrl}
                    </code>
                    <CopyWebhookButton url={webhookUrl} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Course list ─── */
          <div className="divide-y divide-[#E5E7EB]">
            {myCourses.map(course => {
              const prog      = progressByCourse.get(course.id)
              const pct       = prog?.pct ?? 0
              const lastActive = prog?.lastActive

              return (
                <div key={course.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#E8F4F0] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-[#004643] text-sm font-bold">
                          {course.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{course.name}</p>
                        {lastActive && (
                          <p className="text-xs text-[#9CA3AF]">Last active {fmtDate(lastActive)}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#004643]">{pct}%</span>
                  </div>
                  <AnimatedProgressBar value={pct} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Active Sprints ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#111827]">Your Learning Sprints</h2>
          <Link href="/dashboard/sprints" className="text-xs text-[#004643] hover:text-[#003533] transition-colors">
            Browse all →
          </Link>
        </div>

        {activeSprints.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-[#FFF0EB] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-[#E4572E]" />
            </div>
            <p className="text-sm font-medium text-[#111827] mb-1">No active sprints</p>
            <p className="text-xs text-[#6B7C7B] mb-4 max-w-xs mx-auto">
              Join a learning sprint to build accountability and momentum with other learners.
            </p>
            <Link
              href="/dashboard/sprints"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4572E] hover:bg-[#CC4A23] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Browse sprints
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSprints.map(sprint => {
              const members  = memberMap.get(sprint.id) ?? 0
              const posts    = postMap.get(sprint.id) ?? 0
              const days     = daysLeft(sprint.endDate as string)
              const isActive = sprint.status === 'active'

              return (
                <Link
                  key={sprint.id}
                  href={`/dashboard/sprints/${sprint.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#F0F7EE]' : 'bg-[#E8F4F0]'}`}>
                    <Zap className={`w-4 h-4 ${isActive ? 'text-[#5A8F47]' : 'text-[#004643]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate group-hover:text-[#004643] transition-colors">
                      {sprint.title}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {members} member{members !== 1 ? 's' : ''} · {posts} post{posts !== 1 ? 's' : ''} · {fmtDate(sprint.startDate as string)} → {fmtDate(sprint.endDate as string)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-[#F0F7EE] text-[#5A8F47]' : 'bg-[#E8F4F0] text-[#004643]'
                    }`}>
                      {isActive ? 'Live' : 'Open'}
                    </span>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{days}d left</p>
                  </div>
                </Link>
              )
            })}

            <Link
              href="/dashboard/sprints/new"
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#6B7280] hover:text-[#004643] border border-dashed border-[#E5E7EB] rounded-xl hover:border-[#004643] transition-all"
            >
              <span>+</span> Start a new sprint
            </Link>
          </div>
        )}
      </div>

      {/* ── Community Feed ───────────────────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-4">Recent Sprint Activity</h2>
          <div className="divide-y divide-[#E5E7EB]">
            {recentPosts.map(post => (
              <div key={post.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-[#E8F4F0] text-[#004643] text-xs font-semibold flex items-center justify-center flex-shrink-0 select-none">
                  {post.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#111827]">{post.authorName}</span>
                    <span className="text-[10px] text-[#9CA3AF]">in {sprintTitleMap.get(post.sprintId) ?? 'Sprint'}</span>
                    <span className="text-[10px] text-[#9CA3AF] ml-auto">{relativeTime(post.createdAt)}</span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
                    {post.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

