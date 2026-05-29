'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const DISMISS_KEY = 'persist_setup_banner_v1'

export function SetupBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
      <p className="text-sm text-amber-800">
        ⚠️{' '}Finish setting up your account to start sending nudges.{' '}
        <Link
          href="/dashboard/settings"
          className="font-medium underline underline-offset-2 hover:text-amber-900"
        >
          Complete setup →
        </Link>
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-4 text-amber-500 hover:text-amber-800 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
