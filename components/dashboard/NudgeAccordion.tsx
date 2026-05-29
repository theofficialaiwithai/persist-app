'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NudgeItem = {
  id:        string
  subject:   string
  body:      string
  status:    string
  sentAt:    string | null  // ISO string
  createdAt: string         // ISO string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_CLS: Record<string, string> = {
  sent:    'bg-emerald-50 text-emerald-700',
  failed:  'bg-red-50 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NudgeAccordion({ nudges }: { nudges: NudgeItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (nudges.length === 0) {
    return <p className="text-sm text-muted-foreground">No nudges sent yet</p>
  }

  return (
    <div className="space-y-2">
      {nudges.map(nudge => {
        const isOpen = openId === nudge.id
        const statusCls = STATUS_CLS[nudge.status] ?? 'bg-gray-100 text-gray-600'

        return (
          <div
            key={nudge.id}
            className="border border-[#E5E7EB] rounded-lg overflow-hidden"
          >
            {/* ── Header row (always visible) ───────────────────────────── */}
            <button
              onClick={() => setOpenId(isOpen ? null : nudge.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  statusCls
                )}>
                  {nudge.status}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {nudge.subject}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground">
                  {formatDate(nudge.sentAt ?? nudge.createdAt)}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </div>
            </button>

            {/* ── Expanded body ─────────────────────────────────────────── */}
            {isOpen && (
              <div className="px-4 py-4 border-t border-[#E5E7EB] bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {nudge.body}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
