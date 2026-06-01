'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Clock, Users, Zap } from 'lucide-react'

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
    case 'open':      return { label: 'Enrolling',   cls: 'bg-[#004643]/10 text-[#004643] border-[#004643]/20' }
    case 'active':    return { label: 'In Progress',  cls: 'bg-[#7FB069]/15 text-[#5A8F47] border-[#7FB069]/30' }
    case 'completed': return { label: 'Completed',    cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
    case 'cancelled': return { label: 'Cancelled',    cls: 'bg-red-50 text-red-700 border-red-200' }
    default:          return { label: status,          cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
  }
}

// ── Sprint Card ───────────────────────────────────────────────────────────────

function SprintCard({ sprint }: { sprint: SprintData }) {
  const badge    = statusBadge(sprint.status)
  const label    = sprint.courseName || sprint.skillFocus || 'Open Sprint'
  const cap      = sprint.maxMembers ?? 20
  const fillPct  = Math.min(100, Math.round((sprint.memberCount / cap) * 100))
  const duration = durationDays(sprint.startDate, sprint.endDate)

  // Live countdown — target is join deadline for open sprints, end date for active
  const target = sprint.status === 'open' ? sprint.joinDeadline : sprint.endDate
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(target + 'T23:59:59').getTime() - Date.now()) / 1000)),
  )

  useEffect(() => {
    const ms = new Date(target + 'T23:59:59').getTime()
    const id = setInterval(() => setSecsLeft(Math.max(0, Math.floor((ms - Date.now()) / 1000))), 1000)
    return () => clearInterval(id)
  }, [target])

  const days  = Math.floor(secsLeft / 86400)
  const hours = Math.floor((secsLeft % 86400) / 3600)
  const mins  = Math.floor((secsLeft % 3600) / 60)
  const secs  = secsLeft % 60
  const isUrgent = (sprint.status === 'open' || sprint.status === 'active') && days < 3

  // Gradient header per status
  const headerGradient =
    sprint.status === 'open'      ? 'from-[#004643] via-[#003533] to-indigo-900' :
    sprint.status === 'active'    ? 'from-[#6A9A55] via-[#5A8F47] to-emerald-900' :
    sprint.status === 'completed' ? 'from-slate-500 to-slate-700' :
                                    'from-red-500 to-red-700'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ scale: 1.02, y: -5, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
      className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden cursor-pointer group"
    >
      {/* ── Gradient header ───────────────────────────────────────────────── */}
      <div className={cn('relative bg-gradient-to-br p-5', headerGradient)}>
        {/* Status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white">
            <Zap className="w-3 h-3" /> {label}
          </span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-white/20 text-white border-white/30">
            {badge.label}
          </span>
        </div>

        <h3 className="text-base font-bold text-white leading-snug">{sprint.title}</h3>

        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/70">
          <span>{fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}</span>
          <span>·</span>
          <span>{duration}d sprint</span>
        </div>

        {/* Urgent badge overlay */}
        {isUrgent && secsLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          >
            ⚡ Ending soon
          </motion.div>
        )}
      </div>

      {/* ── Card body ─────────────────────────────────────────────────────── */}
      <div className="p-5 space-y-4">

        {/* Countdown boxes — only for open/active with time remaining */}
        {(sprint.status === 'open' || sprint.status === 'active') && secsLeft > 0 ? (
          <div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              <Clock className="w-3 h-3" />
              {sprint.status === 'open' ? 'Deadline to join' : 'Sprint ends in'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: days,  label: 'Days' },
                { value: hours, label: 'Hrs'  },
                { value: mins,  label: 'Min'  },
                { value: secs,  label: 'Sec'  },
              ].map(({ value, label: unit }, idx) => (
                <motion.div
                  key={unit}
                  animate={idx === 3 ? { scale: [1, 1.1, 1], opacity: [1, 0.65, 1] } : {}}
                  transition={idx === 3 ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
                  className={cn(
                    'rounded-xl p-2.5 text-center border',
                    isUrgent
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-[#F7F8FA] border-[#E5E7EB]',
                  )}
                >
                  <div className={cn('text-lg font-bold tabular-nums leading-none', isUrgent ? 'text-amber-600' : 'text-[#111827]')}>
                    {value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[9px] text-[#9CA3AF] font-medium mt-0.5">{unit}</div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : sprint.status === 'completed' ? (
          <div className="text-center py-2 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#374151]">Sprint completed 🎉</p>
          </div>
        ) : null}

        {/* Members + fill bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
              <Users className="w-3.5 h-3.5" />
              {sprint.memberCount} / {cap} members
            </div>
            {sprint.avatars.length > 0 && (
              <div className="flex -space-x-1.5">
                {sprint.avatars.slice(0, 5).map((ini, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-[#D1EBE5] text-[#004643] text-[9px] font-semibold flex items-center justify-center border-2 border-white"
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
          <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#004643] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>

        {/* CTA button */}
        <Link
          href={`/dashboard/sprints/${sprint.id}`}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all',
            'bg-[#004643] hover:bg-[#003533] text-white shadow-sm shadow-[#B8D9CE]/60',
          )}
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
            <span className={cn('ml-1.5 text-xs', tab === t ? 'text-[#004643]' : 'text-[#9CA3AF]')}>
              {t === 'active' ? active.length : sprints.length}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F4F0] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-[#004643]" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004643] hover:bg-[#003533] text-white text-sm font-medium rounded-xl transition-colors"
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
