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
  lastActiveAt: string | null   // ISO string
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
  createdAt: string             // ISO string
  studentName: string
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
  avgProgressPct: number
  completionPct: number
  mostActiveCourse: string
}

// ── Animation variants ────────────────────────────────────────────────────────

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
}

const card = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)   return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendColor?: 'emerald' | 'amber' | 'red'
  bgColor?: string
  className?: string
}

function StatCard({
  label, value, icon, trend, trendColor = 'emerald', bgColor, className,
}: StatCardProps) {
  const trendCls = { emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' }[trendColor]

  return (
    <motion.div
      variants={card}
      className={cn(
        'rounded-2xl p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow',
        bgColor ?? 'bg-white',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide leading-none">
            {label}
          </p>
          <p className="mt-2.5 text-3xl font-bold text-[#111827] leading-none">{value}</p>
          {trend && (
            <p className={cn('mt-1.5 text-xs font-medium', trendCls)}>{trend}</p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-2.5 shrink-0',
          bgColor ? 'bg-white/20' : 'bg-indigo-50',
        )}>
          {icon}
        </div>
      </div>
    </motion.div>
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
  avgProgressPct,
  completionPct,
  mostActiveCourse,
}: BentoGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      variants={container}
      initial="initial"
      animate="animate"
    >

      {/* ── ROW 1 ─────────────────────────────────────────────────────────── */}

      {/* Welcome — col-span-2 */}
      <motion.div
        variants={card}
        className="col-span-1 sm:col-span-2 lg:col-span-2 rounded-2xl p-6 bg-indigo-600 text-white shadow-sm border border-indigo-500 hover:shadow-md transition-shadow"
      >
        <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">
          {todayLabel()}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          Welcome back, {creatorFirstName} 👋
        </h1>
        <p className="mt-1 text-sm text-indigo-200">
          Here's how your students are doing today
        </p>
        {atRiskCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-xs font-medium text-white/90">
              {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} need
              {atRiskCount === 1 ? 's' : ''} your attention today
            </span>
          </div>
        )}
      </motion.div>

      {/* Total Students */}
      <StatCard
        label="Total Students"
        value={totalStudents}
        icon={<Users className="w-5 h-5 text-indigo-600" />}
        trend={newStudentsThisWeek > 0 ? `+${newStudentsThisWeek} this week` : undefined}
        trendColor="emerald"
        className="col-span-1"
      />

      {/* Active Courses */}
      <StatCard
        label="Active Courses"
        value={activeCourses}
        icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
        className="col-span-1"
      />

      {/* Nudges This Month */}
      <StatCard
        label="Nudges This Month"
        value={nudgesThisMonth}
        icon={<Mail className="w-5 h-5 text-indigo-600" />}
        className="col-span-1"
      />

      {/* At Risk Today */}
      <motion.div
        variants={card}
        className={cn(
          'col-span-1 rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow',
          atRiskCount > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-[#E5E7EB]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide leading-none">
              At Risk Today
            </p>
            <p className="mt-2.5 text-3xl font-bold text-[#111827] leading-none">{atRiskCount}</p>
            <p className="mt-1.5 text-xs text-[#6B7280]">students need attention</p>
          </div>
          <div className={cn(
            'rounded-xl p-2.5 shrink-0',
            atRiskCount > 0 ? 'bg-amber-100' : 'bg-indigo-50',
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5',
              atRiskCount > 0 ? 'text-amber-600' : 'text-indigo-600',
            )} />
          </div>
        </div>
      </motion.div>

      {/* ── ROW 2 ─────────────────────────────────────────────────────────── */}

      {/* Needs Attention — col-span-4 */}
      <motion.div
        variants={card}
        className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#111827]">Needs Attention</h2>
          {atRiskRows.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {atRiskRows.length} student{atRiskRows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {atRiskRows.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
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
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                  {initials(student.name)}
                </div>

                {/* Name + course */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827] truncate">{student.name}</p>
                  <p className="text-xs text-[#6B7280] truncate">{student.courseName}</p>
                </div>

                {/* Progress bar */}
                <div className="hidden sm:flex flex-col gap-1.5 w-24 shrink-0">
                  <span className="text-xs text-[#6B7280]">{student.progressPct}%</span>
                  <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${student.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Days inactive badge */}
                <span className={cn(
                  'hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  student.daysInactive >= 15
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700',
                )}>
                  {student.daysInactive}d inactive
                </span>

                {/* Send nudge */}
                <div className="shrink-0">
                  <SendNudgeButton studentId={student.id} studentName={student.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Streak Leaders — col-span-2 */}
      <motion.div
        variants={card}
        className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow"
      >
        <h2 className="text-base font-semibold text-[#111827] mb-4">🔥 Streak Leaders</h2>

        {streakLeaders.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-6">No active streaks yet</p>
        ) : (
          <div className="space-y-3">
            {streakLeaders.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none',
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
                <span className={cn(
                  'text-sm font-semibold shrink-0',
                  i === 0 ? 'text-amber-600' : 'text-orange-500',
                )}>
                  🔥 {s.streakDays}d
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── ROW 3 ─────────────────────────────────────────────────────────── */}

      {/* Recent Nudges — col-span-4 */}
      <motion.div
        variants={card}
        className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow overflow-hidden"
      >
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
                    {nudge.subject.length > 60
                      ? nudge.subject.slice(0, 60) + '…'
                      : nudge.subject}
                  </p>
                </div>
                <span className="hidden sm:block text-xs text-[#9CA3AF] shrink-0 tabular-nums">
                  {relativeTime(nudge.createdAt)}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  nudge.status === 'sent'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700',
                )}>
                  {nudge.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Stats — col-span-2 */}
      <motion.div
        variants={card}
        className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow"
      >
        <h2 className="text-base font-semibold text-[#111827] mb-5">Quick Stats</h2>

        <div className="space-y-5">
          {/* Avg completion rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Avg Completion Rate</p>
              <span className="text-sm font-semibold text-[#111827]">{avgProgressPct}%</span>
            </div>
            <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${avgProgressPct}%` }}
              />
            </div>
          </div>

          {/* Completion rate (finished) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-[#6B7280]">Completion Rate</p>
              <span className="text-sm font-semibold text-[#111827]">{completionPct}%</span>
            </div>
            <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Most active course */}
          <div className="pt-3 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-1">Most Active Course</p>
            <p className="text-sm font-medium text-[#111827] truncate">
              {mostActiveCourse || '—'}
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
