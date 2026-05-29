'use client'

import { BookOpen } from 'lucide-react'
import { AnimatedProgressCard } from '@/components/ui/animated-progress-card'

interface CourseProgressCardProps {
  courseName: string
  progressPct: number
  enrolledLabel: string   // pre-formatted on the server: "Enrolled January 1, 2025"
}

export function CourseProgressCard({
  courseName,
  progressPct,
  enrolledLabel,
}: CourseProgressCardProps) {
  return (
    <AnimatedProgressCard
      icon={<BookOpen className="w-4 h-4 text-white" />}
      title={courseName}
      progressLabel="Course Completion"
      progressSubLabel={enrolledLabel}
      currentValue={progressPct}
      maxValue={100}
      className="bg-indigo-600 text-white border-indigo-500"
    />
  )
}
