'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  studentId:   string
  studentName: string
  className?:  string
}

export function SendNudgeButton({ studentId, studentName, className }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nudge/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send nudge')
      toast.success(`Nudge sent to ${studentName}!`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send nudge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
        className
      )}
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      Send Nudge
    </button>
  )
}
