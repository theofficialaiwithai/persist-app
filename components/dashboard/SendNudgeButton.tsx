'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NudgePreviewModal } from '@/components/dashboard/NudgePreviewModal'

interface Props {
  studentId:   string
  studentName: string
  className?:  string
}

export function SendNudgeButton({ studentId, studentName, className }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#E4572E] hover:bg-[#CC4A23] rounded-md transition-colors whitespace-nowrap',
          className
        )}
      >
        Send Nudge
      </button>

      {showModal && (
        <NudgePreviewModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
