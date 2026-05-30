'use client'

import * as React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar"
import { SendNudgeButton } from "@/components/dashboard/SendNudgeButton"

// ── Types ─────────────────────────────────────────────────────────────────────

// Accepts the same kebab status values used throughout the app
export type StudentCardStatus = 'on-track' | 'at-risk' | 'completed' | 'new'

export interface StudentProfileCardProps {
  id: string
  name: string
  email: string
  courseName: string
  progressPct: number
  status: StudentCardStatus
  lastActiveLabel: string   // e.g. "Today", "3 days ago"
  nudgesCount: number
  streakDays: number
  bannerGradient?: string
  className?: string
}

// ── Animation variants ────────────────────────────────────────────────────────

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  hover: { scale: 1.02, transition: { duration: 0.25 } },
}

const contentVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBannerGradient(status: StudentCardStatus, progressPct: number): string {
  if (status === 'completed') return 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
  if (status === 'at-risk')   return 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
  if (progressPct > 60)       return 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)'
  return 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)'
}

const STATUS_LABEL: Record<StudentCardStatus, string> = {
  'on-track':  'On Track',
  'at-risk':   'At Risk',
  'completed': 'Completed',
  'new':       'New',
}

const STATUS_BADGE_CLS: Record<StudentCardStatus, string> = {
  'on-track':  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'at-risk':   'bg-amber-50 text-amber-700 border border-amber-200',
  'completed': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'new':       'bg-gray-50 text-gray-600 border border-gray-200',
}

// ── Component ─────────────────────────────────────────────────────────────────

export const StudentProfileCard = React.forwardRef<HTMLDivElement, StudentProfileCardProps>(
  (
    {
      id, name, email, courseName, progressPct,
      status, lastActiveLabel, nudgesCount, streakDays,
      bannerGradient, className,
    },
    ref,
  ) => {
    const initials = name
      .split(' ')
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const gradient = bannerGradient ?? getBannerGradient(status, progressPct)

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E5E7EB]",
          className,
        )}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        {/* Coloured banner */}
        <div className="h-28 w-full" style={{ background: gradient }} />

        {/* Avatar overlapping the banner */}
        <div className="absolute left-1/2 top-28 -translate-x-1/2 -translate-y-1/2">
          <Avatar className="h-20 w-20 border-4 border-white shadow-md">
            <AvatarFallback className="bg-indigo-50 text-indigo-600 text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Card content */}
        <motion.div className="px-5 pb-5 pt-12" variants={contentVariants}>

          {/* Name + streak */}
          <motion.div className="text-center mb-1" variants={itemVariants}>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-semibold text-[#111827]">{name}</h2>
              {streakDays >= 3 && (
                <span className="text-sm font-medium text-orange-500">🔥 {streakDays}d</span>
              )}
            </div>
            <p className="text-sm text-[#6B7280] truncate">{email}</p>
          </motion.div>

          {/* Course */}
          <motion.p
            className="text-center text-sm font-medium text-indigo-600 mb-3 truncate"
            variants={itemVariants}
          >
            {courseName}
          </motion.p>

          {/* Progress */}
          <motion.div className="mb-4" variants={itemVariants}>
            <div className="flex justify-between text-xs text-[#6B7280] mb-1">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <AnimatedProgressBar value={progressPct} className="w-full" />
          </motion.div>

          {/* Stats strip */}
          <motion.div
            className="flex items-center justify-around rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 mb-4"
            variants={itemVariants}
          >
            <div className="flex flex-col items-center gap-1">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_BADGE_CLS[status])}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-xs text-[#9CA3AF]">status</span>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-[#111827]">{lastActiveLabel}</span>
              <span className="text-xs text-[#9CA3AF]">last active</span>
            </div>
            <div className="h-8 w-px bg-[#E5E7EB]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-[#111827]">{nudgesCount}</span>
              <span className="text-xs text-[#9CA3AF]">nudges</span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div className="flex gap-2" variants={itemVariants}>
            <SendNudgeButton
              studentId={id}
              studentName={name}
              className="flex-1 justify-center text-sm py-2"
            />
            <Link
              href={`/dashboard/students/${id}`}
              className="flex-1 text-center text-sm px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F9FAFB] transition-colors font-medium"
            >
              View →
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  },
)
StudentProfileCard.displayName = "StudentProfileCard"
