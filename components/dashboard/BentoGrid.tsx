'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, Mail, AlertTriangle,
  BookPlus, Zap, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { AddCourseButton, DiscoverCourseButton } from '@/app/dashboard/components/CourseActions'

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

export interface UpcomingSprintData {
  id: string
  title: string
  status: string
  memberCount: number
  startDate: string
  endDate: string
}

export interface GettingStartedData {
  profileComplete:  boolean
  platformConnected: boolean
  studentsImported: boolean
  courseAdded:      boolean
  nudgeSent:        boolean
}

export interface BentoGridProps {
  creatorFirstName:   string
  totalStudents:      number
  activeCourses:      number
  nudgesThisMonth:    number
  atRiskCount:        number
  newStudentsThisWeek: number
  atRiskRows:         AtRiskRowData[]
  streakLeaders:      StreakLeaderData[]
  recentNudgeRows:    RecentNudgeData[]
  newStarters:        NewStarterData[]
  avgProgressPct:     number
  completionPct:      number
  mostActiveCourse:   string
  upcomingSprints:    UpcomingSprintData[]
  gettingStarted:     GettingStartedData
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 16 },
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'rounded-2xl border border-[#E5E7EB] shadow-sm bg-white overflow-hidden',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

// ── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({
  label, value, icon, trend, trendPositive = true, amber = false,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  trend?: string; trendPositive?: boolean; amber?: boolean
}) {
  return (
    <div className="flex flex-col justify-between h-full p-5 min-h-[130px]">
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
          <p className={cn('text-xs font-medium mt-0.5', trendPositive ? 'text-emerald-600' : 'text-red-500')}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Right-panel cards ─────────────────────────────────────────────────────────

function GettingStartedCard({ data }: { data: GettingStartedData }) {
  const items = [
    { label: 'Set up your profile',      done: data.profileComplete   },
    { label: 'Connect a course platform', done: data.platformConnected },
    { label: 'Sync your first student',   done: data.studentsImported  },
    { label: 'Add a course to track',     done: data.courseAdded       },
    { label: 'Send your first nudge',     done: data.nudgeSent         },
  ]
  const completedCount = items.filter(i => i.done).length

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111827]">Getting Started</h3>
          <span className="text-xs font-medium text-[#9CA3AF]">{completedCount}/5</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / 5) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <div className="space-y-2.5">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors',
                item.done
                  ? 'bg-emerald-500'
                  : 'border-2 border-[#D1D5DB]',
              )}>
                {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                'text-xs leading-snug',
                item.done ? 'text-[#9CA3AF] line-through' : 'text-[#374151]',
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {completedCount === 5 && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
            <span className="text-base">🎉</span>
            <p className="text-xs font-medium text-emerald-700">Setup complete!</p>
          </div>
        )}
      </div>
    </Card>
  )
}

function AddCourseCard() {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <BookPlus className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-[#111827]">Add a Course</h3>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
          Track a new course or discover what to learn next.
        </p>
        <div className="flex flex-col gap-2">
          <AddCourseButton />
          <DiscoverCourseButton />
        </div>
      </div>
    </Card>
  )
}

function SprintsCard({ sprints }: { sprints: UpcomingSprintData[] }) {
  const statusBadge = (status: string) => {
    if (status === 'active')
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">Live</span>
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">Open</span>
  }

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-[#111827]">Learning Sprints</h3>
          </div>
          <Link href="/dashboard/sprints" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
            View all
          </Link>
        </div>

        {sprints.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-xs text-[#9CA3AF] mb-3">No active sprints yet</p>
            <Link
              href="/dashboard/sprints/new"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              + Create your first sprint
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sprints.map(sprint => (
              <Link
                key={sprint.id}
                href={`/dashboard/sprints/${sprint.id}`}
                className="flex items-start justify-between gap-2 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#111827] truncate group-hover:text-indigo-600 transition-colors">
                    {sprint.title}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {sprint.memberCount} member{sprint.memberCount !== 1 ? 's' : ''} · ends {formatDate(sprint.endDate)}
                  </p>
                </div>
                {statusBadge(sprint.status)}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
          <Link
            href="/dashboard/sprints/new"
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-indigo-600 transition-colors py-1"
          >
            + New sprint
          </Link>
        </div>
      </div>
    </Card>
  )
}

function StreakLeadersCard({ leaders }: { leaders: StreakLeaderData[] }) {
  return (
    <Card>
      <div className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">🔥 Streak Leaders</h3>
        {leaders.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] text-center py-3">No active streaks yet</p>
        ) : (
          <div className="space-y-2.5">
            {leaders.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 select-none',
                  i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600',
                )}>
                  {initials(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium truncate', i === 0 ? 'text-amber-700' : 'text-[#111827]')}>
                    {s.name}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] truncate">{s.courseName}</p>
                </div>
                <span className={cn('text-xs font-bold shrink-0', i === 0 ? 'text-amber-600' : 'text-orange-500')}>
                  🔥 {s.streakDays}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function QuickStatsCard({
  avgProgressPct, completionPct, mostActiveCourse,
}: {
  avgProgressPct: number; completionPct: number; mostActiveCourse: string
}) {
  return (
    <Card>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-[#111827] mb-4">Quick Stats</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Avg Completion</p>
              <span className="text-xs font-bold text-[#111827]">{avgProgressPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgProgressPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Completed</p>
              <span className="text-xs font-bold text-[#111827]">{completionPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionPct}%` }} />
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
  )
}

// ── BentoGrid ─────────────────────────────────────────────────────────────────
//
// Layout: flex row (lg+) — main column (flex-1) + right sidebar (w-[272px])
//   Main:    Welcome banner / 4 stat cards / Needs Attention / New Starters / Recent Nudges
//   Sidebar: Getting Started / Add a Course / Learning Sprints / Streak Leaders / Quick Stats
//
// ─────────────────────────────────────────────────────────────────────────────

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
  upcomingSprints,
  gettingStarted,
}: BentoGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col lg:flex-row gap-4 items-start"
    >
      {/* ── MAIN COLUMN ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Welcome banner */}
        <Card className="bg-indigo-600 border-indigo-500 text-white">
          <div className="flex flex-col justify-between p-6 min-h-[112px]">
            <div>
              <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">
                {todayLabel()}
              </p>
              <h1 className="mt-1.5 text-xl font-bold leading-snug">
                Welcome back, {creatorFirstName} 👋
              </h1>
              <p className="mt-0.5 text-sm text-indigo-200">
                Here&apos;s how your students are doing today
              </p>
            </div>
            {atRiskCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-xs font-medium text-white/90">
                  {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} need
                  {atRiskCount === 1 ? 's' : ''} your attention today
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <MiniStat
              label="Total Students"
              value={totalStudents}
              icon={<Users className="w-4 h-4 text-indigo-600" />}
              trend={newStudentsThisWeek > 0 ? `+${newStudentsThisWeek} this week` : undefined}
            />
          </Card>
          <Card>
            <MiniStat
              label="Active Courses"
              value={activeCourses}
              icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
            />
          </Card>
          <Card>
            <MiniStat
              label="Nudges This Month"
              value={nudgesThisMonth}
              icon={<Mail className="w-4 h-4 text-indigo-600" />}
            />
          </Card>
          <Card className={atRiskCount > 0 ? 'bg-amber-50 border-amber-200' : ''}>
            <MiniStat
              label="At Risk Today"
              value={atRiskCount}
              icon={<AlertTriangle className={cn('w-4 h-4', atRiskCount > 0 ? 'text-amber-600' : 'text-indigo-600')} />}
              amber={atRiskCount > 0}
              trend={atRiskCount > 0 ? 'needs attention' : 'all on track'}
              trendPositive={atRiskCount === 0}
            />
          </Card>
        </div>

        {/* Needs Attention */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-base font-semibold text-[#111827]">Needs Attention</h2>
            {atRiskRows.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {atRiskRows.length} student{atRiskRows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {atRiskRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <p className="text-2xl">🎉</p>
              <p className="mt-2 text-sm font-medium text-[#111827]">All students are on track</p>
              <p className="text-xs text-[#6B7280] mt-0.5">No one needs a nudge right now</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {atRiskRows.map(student => (
                <div key={student.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F9FAFB] transition-colors">
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
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${student.progressPct}%` }} />
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

        {/* New Starters */}
        <Card>
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
                    <div key={s.id} className="min-w-[200px] flex items-center gap-3 bg-[#F7F8FA] rounded-xl p-4 border border-[#E5E7EB] shrink-0">
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

        {/* Recent Nudges */}
        <Card>
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

      </div>{/* end main column */}

      {/* ── RIGHT SIDEBAR ──────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[272px] shrink-0 flex flex-col gap-4">
        <GettingStartedCard data={gettingStarted} />
        <AddCourseCard />
        <SprintsCard sprints={upcomingSprints} />
        <StreakLeadersCard leaders={streakLeaders} />
        <QuickStatsCard
          avgProgressPct={avgProgressPct}
          completionPct={completionPct}
          mostActiveCourse={mostActiveCourse}
        />
      </div>

    </motion.div>
  )
}
