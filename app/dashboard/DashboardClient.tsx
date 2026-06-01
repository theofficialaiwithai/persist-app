'use client'

import { WelcomeDialog } from '@/app/dashboard/components/WelcomeDialog'

interface DashboardClientProps {
  creatorId: string
  children:  React.ReactNode
}

export function DashboardClient({ creatorId, children }: DashboardClientProps) {
  return (
    <>
      {children}
      <WelcomeDialog creatorId={creatorId} />
    </>
  )
}
