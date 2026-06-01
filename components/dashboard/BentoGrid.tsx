'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, Mail, AlertTriangle,
  BookPlus, Zap, Check, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SendNudgeButton } from '@/components/dashboard/SendNudgeButton'
import { AddCourseButton, DiscoverCourseButton } from '@/app/dashboard/components/CourseActions'
import { InsightsCard } from '@/app/dashboard/components/InsightsCard'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AtRiskRowData {
  id: string; name: string; courseId: string; progressPct: number
  lastActiveAt: string | null; courseName: string; daysInactive: number
}
export interface StreakLeaderData {
  id: string; name: string; streakDays: number; courseName: string
}
export interface RecentNudgeData {
  id: string; subject: string; status: string; createdAt: string; studentName: string
}
export interface NewStarterData {
  id: string; name: string; courseName: string; enrolledAt: string
}
export interface UpcomingSprintData {
  id: string; title: string; status: string; memberCount: number
  startDate: string; endDate: string
}
export interface GettingStartedData {
  profileComplete: boolean; platformConnected: boolean
  studentsImported: boolean; courseAdded: boolean; nudgeSent: boolean
}

export interface BentoGridProps {
  creatorFirstName:    string
  creatorId:           string
  totalStudents:       number
  activeCourses:       number
  nudgesThisMonth:     number
  atRiskCount:         number
  newStudentsThisWeek: number
  atRiskRows:          AtRiskRowData[]
  streakLeaders:       StreakLeaderData[]
  recentNudgeRows:     RecentNudgeData[]
  newStarters:         NewStarterData[]
  avgProgressPct:      number
  completionPct:       number
  mostActiveCourse:    string
  upcomingSprints:     UpcomingSprintData[]
  gettingStarted:      GettingStartedData
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 16 } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Card shells ───────────────────────────────────────────────────────────────

// Top-level animated card (direct child of the motion.section grid)
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn('rounded-2xl border border-[#E5E7EB] shadow-sm bg-white overflow-hidden', className)}
    >
      {children}
    </motion.div>
  )
}

// Non-animated inner card — used inside col-span-3 / col-span-1 containers
function InnerCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-[#E5E7EB] shadow-sm bg-white overflow-hidden', className)}>
      {children}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function MiniStat({
  label, value, icon, trend, trendPositive = true, amber = false,
}: {
  label: string; value: string | number; icon: React.ReactNode
  trend?: string; trendPositive?: boolean; amber?: boolean
}) {
  return (
    <div className="flex flex-col justify-between h-full p-5 min-h-[130px]">
      <div className={cn('inline-flex items-center justify-center w-9 h-9 rounded-xl', amber ? 'bg-amber-100' : 'bg-[#E8F4F0]')}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111827] leading-none">{value}</p>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mt-1">{label}</p>
        {trend && (
          <p className={cn('text-xs font-medium mt-0.5', trendPositive ? 'text-[#6A9A55]' : 'text-red-500')}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Right-column card contents ────────────────────────────────────────────────

function GettingStartedContent({ data }: { data: GettingStartedData }) {
  const items = [
    { label: 'Set up your profile',       done: data.profileComplete,   href: '/dashboard/profile'   },
    { label: 'Connect a course platform', done: data.platformConnected,  href: '/dashboard/settings'  },
    { label: 'Sync your first student',   done: data.studentsImported,   href: '/dashboard/students'  },
    { label: 'Add a course to track',     done: data.courseAdded,        href: '/dashboard'           },
    { label: 'Send your first nudge',     done: data.nudgeSent,          href: '/dashboard/students'  },
  ]
  const done = items.filter(i => i.done).length

  return (
    <InnerCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-[#111827]">Getting Started</h3>
          <span className="text-xs font-medium text-[#9CA3AF]">{done}/5</span>
        </div>
        <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden mb-3.5">
          <motion.div
            className="h-full bg-[#7FB069] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(done / 5) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="space-y-1.5">
          {items.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 transition-colors group',
                item.done
                  ? 'hover:bg-[#F0F7EE]/60 cursor-default'
                  : 'hover:bg-[#E8F4F0] cursor-pointer',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors',
                item.done ? 'bg-[#7FB069]' : 'border-2 border-[#D1D5DB] group-hover:border-[#004643]',
              )}>
                {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                'text-xs leading-snug flex-1 transition-colors',
                item.done
                  ? 'text-[#9CA3AF] line-through'
                  : 'text-[#374151] group-hover:text-[#003533]',
              )}>
                {item.label}
              </span>
              {!item.done && (
                <ChevronRight className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#004643] transition-colors flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
        {done === 5 && (
          <div className="mt-3 flex items-center gap-2 bg-[#F0F7EE] rounded-xl px-3 py-2">
            <span className="text-sm">🎉</span>
            <p className="text-xs font-medium text-[#5A8F47]">Setup complete!</p>
          </div>
        )}
      </div>
    </InnerCard>
  )
}

function AddCourseContent() {
  return (
    <InnerCard>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookPlus className="w-4 h-4 text-[#004643]" />
          <h3 className="text-sm font-semibold text-[#111827]">Add a Course</h3>
        </div>
        <div className="flex flex-col gap-2">
          <AddCourseButton />
          <DiscoverCourseButton />
        </div>
      </div>
    </InnerCard>
  )
}

function SprintsContent({ sprints }: { sprints: UpcomingSprintData[] }) {
  return (
    <InnerCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#004643]" />
            <h3 className="text-sm font-semibold text-[#111827]">Learning Sprints</h3>
          </div>
          <Link href="/dashboard/sprints" className="text-xs text-[#004643] hover:text-[#003533] transition-colors">
            View all
          </Link>
        </div>

        {sprints.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-[#9CA3AF] mb-2">No active sprints</p>
            <Link href="/dashboard/sprints/new" className="text-xs font-medium text-[#004643] hover:text-[#003533]">
              + Create your first sprint
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sprints.map(s => (
              <Link key={s.id} href={`/dashboard/sprints/${s.id}`} className="flex items-start justify-between gap-2 group">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#111827] truncate group-hover:text-[#004643] transition-colors">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {s.memberCount} member{s.memberCount !== 1 ? 's' : ''} · ends {formatDate(s.endDate)}
                  </p>
                </div>
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0',
                  s.status === 'active' ? 'bg-[#F0F7EE] text-[#5A8F47]' : 'bg-[#E8F4F0] text-[#004643]',
                )}>
                  {s.status === 'active' ? 'Live' : 'Open'}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 pt-2.5 border-t border-[#F3F4F6]">
          <Link href="/dashboard/sprints/new" className="w-full flex items-center justify-center text-xs font-medium text-[#6B7280] hover:text-[#004643] transition-colors py-0.5">
            + New sprint
          </Link>
        </div>
      </div>
    </InnerCard>
  )
}

function StreakLeadersContent({ leaders }: { leaders: StreakLeaderData[] }) {
  return (
    <InnerCard>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">🔥 Streak Leaders</h3>
        {leaders.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] text-center py-2">No active streaks yet</p>
        ) : (
          <div className="space-y-2.5">
            {leaders.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 select-none',
                  i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#E8F4F0] text-[#004643]',
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
    </InnerCard>
  )
}

function QuickStatsContent({ avgProgressPct, completionPct, mostActiveCourse }: {
  avgProgressPct: number; completionPct: number; mostActiveCourse: string
}) {
  return (
    <InnerCard>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Stats</h3>
        <div className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Avg Completion</p>
              <span className="text-xs font-bold text-[#111827]">{avgProgressPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-[#004643] rounded-full" style={{ width: `${avgProgressPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Completed</p>
              <span className="text-xs font-bold text-[#111827]">{completionPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-[#7FB069] rounded-full" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
          {mostActiveCourse && (
            <div className="pt-2.5 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280] mb-1">Most Active</p>
              <p className="text-xs font-medium text-[#111827] truncate">{mostActiveCourse}</p>
            </div>
          )}
        </div>
      </div>
    </InnerCard>
  )
}

// ── BentoGrid ─────────────────────────────────────────────────────────────────
//
// Layout (md = 4-column grid, col-span only — no col-start / row-start):
//   Row 1  │ Welcome banner                             col-span-4
//   Row 2  │ Total Students │ Courses │ Nudges │ AtRisk col-span-1 each
//   Row 3+ │ Left container (col-span-3)  │ Right sidebar container (col-span-1)
//            ├─ Needs Attention            ├─ Getting Started
//            ├─ New Starters               ├─ Add a Course
//            └─ Recent Nudges              ├─ Learning Sprints
//                                          ├─ Streak Leaders
//                                          └─ Quick Stats
//
// Both containers are motion.div children of the grid (get stagger animation).
// Inner sub-cards use InnerCard (plain div) — no nested motion overhead.
// ─────────────────────────────────────────────────────────────────────────────

export function BentoGrid({
  creatorFirstName, creatorId, totalStudents, activeCourses, nudgesThisMonth, atRiskCount,
  newStudentsThisWeek, atRiskRows, streakLeaders, recentNudgeRows, newStarters,
  avgProgressPct, completionPct, mostActiveCourse, upcomingSprints, gettingStarted,
}: BentoGridProps) {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >

      {/* ── ROW 1: Welcome banner — full width ──────────────────────────────── */}
      <Card className="col-span-1 sm:col-span-2 lg:col-span-4 bg-[#004643] border-[#004643] text-white">
        <div className="flex flex-col justify-between p-6 min-h-[112px]">
          <div>
            <p className="text-xs font-medium text-[#B8D9CE] uppercase tracking-wide">{todayLabel()}</p>
            <h1 className="mt-1.5 text-xl font-bold leading-snug">Welcome back, {creatorFirstName} 👋</h1>
            <p className="mt-0.5 text-sm text-[#B8D9CE]">Here&apos;s how your students are doing today</p>
          </div>
          {atRiskCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-xs font-medium text-white/90">
                {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} need{atRiskCount === 1 ? 's' : ''} your attention today
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── ROW 2: Stat cards — 4 × col-span-1 ─────────────────────────────── */}
      <Card>
        <MiniStat
          label="Total Students" value={totalStudents}
          icon={<Users className="w-4 h-4 text-[#004643]" />}
          trend={newStudentsThisWeek > 0 ? `+${newStudentsThisWeek} this week` : undefined}
        />
      </Card>
      <Card>
        <MiniStat label="Active Courses" value={activeCourses} icon={<BookOpen className="w-4 h-4 text-[#004643]" />} />
      </Card>
      <Card>
        <MiniStat label="Nudges This Month" value={nudgesThisMonth} icon={<Mail className="w-4 h-4 text-[#004643]" />} />
      </Card>
      <Card className={atRiskCount > 0 ? 'bg-amber-50 border-amber-200' : ''}>
        <MiniStat
          label="At Risk Today" value={atRiskCount}
          icon={<AlertTriangle className={cn('w-4 h-4', atRiskCount > 0 ? 'text-amber-600' : 'text-[#004643]')} />}
          amber={atRiskCount > 0}
          trend={atRiskCount > 0 ? 'needs attention' : 'all on track'}
          trendPositive={atRiskCount === 0}
        />
      </Card>

      {/* ── AI Insights — full width, between stats and main content ────────── */}
      <motion.div
        variants={itemVariants}
        className="col-span-1 sm:col-span-2 lg:col-span-4"
      >
        <InsightsCard creatorId={creatorId} />
      </motion.div>

      {/* ── ROW 3+: Left main (col-span-3) — animated container ─────────────── */}
      <motion.div
        variants={itemVariants}
        className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col gap-4"
      >
        {/* Needs Attention */}
        <InnerCard>
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
                  <div className="w-8 h-8 rounded-full bg-[#E8F4F0] text-[#004643] flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                    {initials(student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111827] truncate">{student.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{student.courseName}</p>
                  </div>
                  <div className="hidden sm:flex flex-col gap-1.5 w-20 shrink-0">
                    <span className="text-xs text-[#6B7280]">{student.progressPct}%</span>
                    <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#004643] rounded-full" style={{ width: `${student.progressPct}%` }} />
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
        </InnerCard>

        {/* New Starters */}
        <InnerCard>
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
                      <div className="w-9 h-9 rounded-full bg-[#D1EBE5] text-[#004643] flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{s.courseName}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{days === 0 ? 'Joined today' : `Joined ${days}d ago`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </InnerCard>

        {/* Recent Nudges */}
        <InnerCard>
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
                  <span className="hidden sm:block text-xs text-[#9CA3AF] shrink-0 tabular-nums">{relativeTime(nudge.createdAt)}</span>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                    nudge.status === 'sent' ? 'bg-[#F0F7EE] text-[#5A8F47]' : 'bg-red-50 text-red-700',
                  )}>
                    {nudge.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </InnerCard>
      </motion.div>

      {/* ── ROW 3+: Right sidebar (col-span-1) — animated container ─────────── */}
      <motion.div
        variants={itemVariants}
        className="col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col gap-4"
      >
        <GettingStartedContent data={gettingStarted} />
        <AddCourseContent />
        <SprintsContent sprints={upcomingSprints} />
        <StreakLeadersContent leaders={streakLeaders} />
        <QuickStatsContent
          avgProgressPct={avgProgressPct}
          completionPct={completionPct}
          mostActiveCourse={mostActiveCourse}
        />
      </motion.div>

    </motion.section>
  )
}
