'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SprintData {
  id: string
  title: string
  description: string | null
  courseId: string | null
  courseName: string | null
  skillFocus: string | null
  startDate: string
  endDate: string
  joinDeadline: string
  maxMembers: number | null
  status: string
  memberCount: number
  avatars: string[]
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now    = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function durationDays(start: string, end: string): number {
  return Math.ceil(
    (new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()) / 86_400_000,
  )
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function statusBadge(status: string) {
  switch (status) {
    case 'open':      return { label: 'Enrolling',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    case 'active':    return { label: 'In Progress',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'completed': return { label: 'Completed',    cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
    case 'cancelled': return { label: 'Cancelled',    cls: 'bg-red-50 text-red-700 border-red-200' }
    default:          return { label: status,          cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
  }
}

// ── Sprint Card ───────────────────────────────────────────────────────────────

function SprintCard({ sprint }: { sprint: SprintData }) {
  const badge      = statusBadge(sprint.status)
  const label      = sprint.courseName || sprint.skillFocus || 'Open Sprint'
  const daysToJoin = daysUntil(sprint.joinDeadline)
  const daysToEnd  = daysUntil(sprint.endDate)
  const duration   = durationDays(sprint.startDate, sprint.endDate)
  const cap        = sprint.maxMembers ?? 20
  const fillPct    = Math.min(100, Math.round((sprint.memberCount / cap) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 16 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4"
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[#111827] leading-snug">{sprint.title}</h3>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0', badge.cls)}>
          {badge.label}
        </span>
      </div>

      {/* Course/skill pill */}
      <span className="inline-flex w-fit items-center gap-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-3 py-1 text-xs text-[#6B7280]">
        <Zap className="w-3 h-3 text-indigo-500" />
        {label}
      </span>

      {/* Countdown */}
      {sprint.status === 'open' && (
        <div className="rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] px-4 py-3">
          {daysToJoin > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-3xl font-bold tabular-nums', daysToJoin < 3 ? 'text-amber-600' : 'text-[#111827]')}>
                  {daysToJoin}
                </span>
                <span className={cn('text-sm font-medium', daysToJoin < 3 ? 'text-amber-600' : 'text-[#6B7280]')}>
                  day{daysToJoin !== 1 ? 's' : ''} left to join
                </span>
                {daysToJoin < 3 && <span className="text-amber-500 text-sm">⚡</span>}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Starts {fmtDate(sprint.startDate)}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-[#6B7280]">Enrollment closed</p>
          )}
        </div>
      )}

      {sprint.status === 'active' && daysToEnd > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-emerald-700">{daysToEnd}</span>
            <span className="text-sm font-medium text-emerald-700">days remaining</span>
          </div>
          <p className="text-xs text-emerald-600 mt-0.5">Ends {fmtDate(sprint.endDate)}</p>
        </div>
      )}

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#6B7280]">
            {sprint.memberCount} / {cap} members
          </span>
          {sprint.avatars.length > 0 && (
            <div className="flex -space-x-1.5">
              {sprint.avatars.slice(0, 5).map((ini, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-semibold flex items-center justify-center border-2 border-white"
                >
                  {ini}
                </div>
              ))}
              {sprint.avatars.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[9px] font-semibold flex items-center justify-center border-2 border-white">
                  +{sprint.avatars.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
        {/* fill bar */}
        <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
        <span>Starts {fmtDate(sprint.startDate)}</span>
        <span>·</span>
        <span>Ends {fmtDate(sprint.endDate)}</span>
        <span>·</span>
        <span>{duration}d sprint</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#F3F4F6]">
        <Link
          href={`/dashboard/sprints/${sprint.id}`}
          className="flex-1 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          View Sprint →
        </Link>
      </div>
    </motion.div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export function SprintsClient({ sprints }: { sprints: SprintData[] }) {
  const [tab, setTab] = useState<'active' | 'all'>('active')

  const active = sprints.filter(s => s.status === 'open' || s.status === 'active')
  const shown  = tab === 'active' ? active : sprints

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 w-fit mb-6">
        {(['active', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]',
            )}
          >
            {t === 'active' ? 'Active Sprints' : 'All Sprints'}
            <span className={cn('ml-1.5 text-xs', tab === t ? 'text-indigo-600' : 'text-[#9CA3AF]')}>
              {t === 'active' ? active.length : sprints.length}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-[#111827] mb-1">
            {tab === 'active' ? 'No active sprints' : 'No sprints yet'}
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            {tab === 'active'
              ? 'Create a sprint to energise your students with a shared challenge.'
              : 'Create your first learning sprint.'}
          </p>
          <Link
            href="/dashboard/sprints/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <span>+</span> Create your first sprint
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map(s => <SprintCard key={s.id} sprint={s} />)}
        </div>
      )}
    </div>
  )
}
