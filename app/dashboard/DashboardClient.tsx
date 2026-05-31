'use client'

import { useEffect, useState } from 'react'
import { CompletionCelebration } from '@/components/ui/completion-celebration'

export interface RecentlyCompletedData {
  id: string
  name: string
  courseName: string
}

interface DashboardClientProps {
  recentlyCompleted: RecentlyCompletedData | null
  children: React.ReactNode
}

export function DashboardClient({ recentlyCompleted, children }: DashboardClientProps) {
  const key = recentlyCompleted ? `celebration-shown-${recentlyCompleted.id}` : null
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (!recentlyCompleted || !key) return
    if (sessionStorage.getItem(key)) return   // already shown this session

    // Small delay so the dashboard finishes rendering before the modal pops
    const t = setTimeout(() => setShowCelebration(true), 800)
    return () => clearTimeout(t)
  }, []) // intentionally empty — run once on mount only

  const handleDismiss = () => {
    if (key) sessionStorage.setItem(key, 'true')
    setShowCelebration(false)
  }

  return (
    <>
      {children}
      {showCelebration && recentlyCompleted && (
        <CompletionCelebration
          studentName={recentlyCompleted.name}
          courseName={recentlyCompleted.courseName}
          studentId={recentlyCompleted.id}
          onDismiss={handleDismiss}
        />
      )}
    </>
  )
}
