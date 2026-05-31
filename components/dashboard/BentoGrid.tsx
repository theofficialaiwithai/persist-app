'use client'

import { motion } from 'framer-motion'
import { Users, BookOpen, Mail, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AtRiskRowData {
  id: string
  name: string
  courseId: string
  progressPct: number
  lastActiveAt: string | null
  courseName: string
  daysInactive: number
}

export interface StreakLeaderData {
  id: string
  name: string
  streakDays: number
  courseName: string
}

export interface RecentNudgeData {
  id: string
  subject: string
  status: string
  createdAt: string
  studentName: string
}

export interface NewStarterData {
  id: string
  name: string
  courseName: string
  enrolledAt: string
}

export interface BentoGridProps {
  creatorFirstName: string
  totalStudents: number
  activeCourses: number
  nudgesThisMonth: number
  atRiskCount: number
  newStudentsThisWeek: number
  atRiskRows: AtRiskRowData[]
  streakLeaders: StreakLeaderData[]
  recentNudgeRows: RecentNudgeData[]
  newStarters: NewStarterData[]
  avgProgressPct: number
  completionPct: number
  mostActiveCourse: string
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden:   { opacity: 0 },
  visible:  {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow overflow-hidden',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

// ── Mini stat for the small stat cells ────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  amber = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendPositive?: boolean
  amber?: boolean
}) {
  return (
    <div className="flex flex-col justify-between h-full p-5">
      <div className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-xl',
        amber ? 'bg-amber-100' : 'bg-indigo-50',
      )}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111827] leading-none">{value}</p>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mt-1">{label}</p>
        {trend && (
          <p className={cn(
            'text-xs font-medium mt-0.5',
            trendPositive ? 'text-emerald-600' : 'text-red-600',
          )}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

// ── BentoGrid ────────────────────────────────────────────────────────────────

export function BentoGrid({
  creatorFirstName,
  totalStudents,
  activeCourses,
  nudgesThisMonth,
  atRiskCount,
  newStudentsThisWeek,
  atRiskRows,
  streakLeaders,
  recentNudgeRows,
  newStarters,
  avgProgressPct,
  completionPct,
  mostActiveCourse,
}: BentoGridProps) {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // ── Grid ──────────────────────────────────────────────────────────────
      // mobile: 1 col stacked
      // sm:     2 col auto-placed
      // md:     4 col with explicit row+col placement (true bento)
      // auto-rows: each track is at least 140px, grows to content
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4"
    >

      {/* ── 1. WELCOME ── col 1-2, row 1 ────────────────────────────────── */}
      <Card className="sm:col-span-2 md:col-start-1 md:col-span-2 md:row-start-1 bg-indigo-600 border-indigo-500 text-white">
        <div className="h-full flex flex-col justify-between p-6">
          <div>
            <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">
              {todayLabel()}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug">
              Welcome back, {creatorFirstName} 👋
            </h1>
            <p className="mt-1 text-sm text-indigo-200">
              Here's how your students are doing today
            </p>
          </div>
          {atRiskCount > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-xs font-medium text-white/90">
                {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} need
                {atRiskCount === 1 ? 's' : ''} your attention today
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── 2. NEEDS ATTENTION ── col 1-2, rows 2-4 (TALL anchor) ────────── */}
      <Card className="sm:col-span-2 md:col-start-1 md:col-span-2 md:row-start-2 md:row-span-3 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#111827]">Needs Attention</h2>
          {atRiskRows.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {atRiskRows.length} student{atRiskRows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {atRiskRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <p className="text-2xl">🎉</p>
            <p className="mt-2 text-sm font-medium text-[#111827]">All students are on track</p>
            <p className="text-xs text-[#6B7280] mt-0.5">No one needs a nudge right now</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {atRiskRows.map(student => (
              <div
                key={student.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F9FAFB] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                  {initials(student.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827] truncate">{student.name}</p>
                  <p className="text-xs text-[#6B7280] truncate">{student.courseName}</p>
                </div>
                <div className="hidden sm:flex flex-col gap-1.5 w-20 shrink-0">
                  <span className="text-xs text-[#6B7280]">{student.progressPct}%</span>
                  <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${student.progressPct}%` }}
                    />
                  </div>
                </div>
                <span className={cn(
                  'hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  student.daysInactive >= 15 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
                )}>
                  {student.daysInactive}d
                </span>
                <div className="shrink-0">
                  <SendNudgeButton studentId={student.id} studentName={student.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 3. STREAK LEADERS ── cols 3-4, rows 1-2 (TALL right anchor) ──── */}
      <Card className="sm:col-span-2 md:col-start-3 md:col-span-2 md:row-start-1 md:row-span-2 bg-white">
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-base font-semibold text-[#111827] mb-4">🔥 Streak Leaders</h2>
          {streakLeaders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#6B7280] text-center">No active streaks yet</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {streakLeaders.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none',
                    i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600',
                  )}>
                    {initials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      i === 0 ? 'text-amber-700' : 'text-[#111827]',
                    )}>
                      {s.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF] truncate">{s.courseName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {i === 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        #1
                      </span>
                    )}
                    <span className={cn(
                      'text-sm font-bold',
                      i === 0 ? 'text-amber-600' : 'text-orange-500',
                    )}>
                      🔥 {s.streakDays}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── 4. AT RISK TODAY ── col 3, row 3 ─────────────────────────────── */}
      <Card className={cn(
        'md:col-start-3 md:row-start-3',
        atRiskCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white',
      )}>
        <MiniStat
          label="At Risk Today"
          value={atRiskCount}
          icon={<AlertTriangle className={cn('w-4 h-4', atRiskCount > 0 ? 'text-amber-600' : 'text-indigo-600')} />}
          amber={atRiskCount > 0}
          trend={atRiskCount > 0 ? 'needs attention' : 'all on track'}
          trendPositive={atRiskCount === 0}
        />
      </Card>

      {/* ── 5. TOTAL STUDENTS ── col 4, row 3 ────────────────────────────── */}
      <Card className="md:col-start-4 md:row-start-3 bg-white">
        <MiniStat
          label="Total Students"
          value={totalStudents}
          icon={<Users className="w-4 h-4 text-indigo-600" />}
          trend={newStudentsThisWeek > 0 ? `+${newStudentsThisWeek} this week` : undefined}
        />
      </Card>

      {/* ── 6. NUDGES THIS MONTH ── col 3, row 4 ─────────────────────────── */}
      <Card className="md:col-start-3 md:row-start-4 bg-white">
        <MiniStat
          label="Nudges This Month"
          value={nudgesThisMonth}
          icon={<Mail className="w-4 h-4 text-indigo-600" />}
        />
      </Card>

      {/* ── 7. ACTIVE COURSES ── col 4, row 4 ────────────────────────────── */}
      <Card className="md:col-start-4 md:row-start-4 bg-white">
        <MiniStat
          label="Active Courses"
          value={activeCourses}
          icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
        />
      </Card>

      {/* ── 8. NEW STARTERS ── cols 1-4, row 5 (full-width band) ─────────── */}
      <Card className="sm:col-span-2 md:col-span-4 md:row-start-5 bg-white">
        <div className="px-6 pt-5 pb-2 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#111827]">🌱 Just Getting Started</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Students who enrolled in the last 7 days</p>
        </div>
        {newStarters.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#6B7280]">No new students this week</p>
          </div>
        ) : (
          <div className="px-6 py-4 overflow-x-auto">
            <div className="flex gap-3 pb-1">
              {newStarters.map(s => {
                const days = daysAgo(s.enrolledAt)
                return (
                  <div
                    key={s.id}
                    className="min-w-[200px] flex items-center gap-3 bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB] shrink-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{s.courseName}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {days === 0 ? 'Joined today' : `Joined ${days}d ago`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── 9. RECENT NUDGES ── cols 1-3, row 6 ──────────────────────────── */}
      <Card className="sm:col-span-2 md:col-start-1 md:col-span-3 md:row-start-6 bg-white">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#111827]">Recent Nudges</h2>
        </div>
        {recentNudgeRows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#6B7280]">No nudges sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {recentNudgeRows.map(nudge => (
              <div key={nudge.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827]">{nudge.studentName}</p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {nudge.subject.length > 65 ? nudge.subject.slice(0, 65) + '…' : nudge.subject}
                  </p>
                </div>
                <span className="hidden sm:block text-xs text-[#9CA3AF] shrink-0 tabular-nums">
                  {relativeTime(nudge.createdAt)}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  nudge.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                )}>
                  {nudge.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 10. QUICK STATS ── col 4, row 6 ──────────────────────────────── */}
      <Card className="md:col-start-4 md:row-start-6 bg-white">
        <div className="p-6 h-full flex flex-col justify-between">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Quick Stats</h2>
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-[#6B7280]">Avg Completion</p>
                <span className="text-xs font-bold text-[#111827]">{avgProgressPct}%</span>
              </div>
              <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${avgProgressPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-[#6B7280]">Completed</p>
                <span className="text-xs font-bold text-[#111827]">{completionPct}%</span>
              </div>
              <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            {mostActiveCourse && (
              <div className="pt-3 border-t border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] mb-1">Most Active</p>
                <p className="text-xs font-medium text-[#111827] truncate">{mostActiveCourse}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

    </motion.section>
  )
}
