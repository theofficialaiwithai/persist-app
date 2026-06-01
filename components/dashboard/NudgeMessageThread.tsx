'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { cn } from '@/lib/utils'

export interface MessageNudge {
  id:          string
  body:        string
  reactions:   string   // raw JSON string
  sentAt:      string | null
  createdAt:   string | null
  senderName:  string
  senderInitials: string
}

interface Props {
  messages:    MessageNudge[]
  currentUserId: string   // creator.id of the logged-in user
}

const EMOJIS = ['😍', '❤️', '🔥', '⚡', '👍'] as const

function relTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function parseReactions(raw: string): Record<string, string[]> {
  try { return JSON.parse(raw) } catch { return {} }
}

// ── Single message bubble ─────────────────────────────────────────────────────

function MessageBubble({
  message,
  currentUserId,
}: {
  message: MessageNudge
  currentUserId: string
}) {
  const [reactions, setReactions] = useState(() => parseReactions(message.reactions))
  const [, startTransition] = useTransition()

  async function handleReact(emoji: string) {
    const prev = reactions
    const currentReactors = reactions[emoji] ?? []
    const alreadyReacted  = currentReactors.includes(currentUserId)

    // Optimistic update
    setReactions(r => {
      const next = { ...r }
      if (alreadyReacted) {
        next[emoji] = (next[emoji] ?? []).filter(id => id !== currentUserId)
        if (next[emoji].length === 0) delete next[emoji]
      } else {
        next[emoji] = [...(next[emoji] ?? []), currentUserId]
      }
      return next
    })

    startTransition(async () => {
      try {
        const res = await fetch(`/api/nudge/${message.id}/react`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ emoji }),
        })
        if (!res.ok) setReactions(prev) // revert on error
        else {
          const data = await res.json()
          setReactions(data.reactions ?? prev)
        }
      } catch {
        setReactions(prev)
      }
    })
  }

  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#E8F4F0] text-[#004643] text-xs font-bold flex items-center justify-center flex-shrink-0 select-none">
        {message.senderInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-[#111827]">
            {message.senderName}
          </span>
          <span className="text-[11px] text-[#9CA3AF]">
            {relTime(message.sentAt ?? message.createdAt)}
          </span>
        </div>

        {/* Message body */}
        <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>

        {/* Reaction bar */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {EMOJIS.map(emoji => {
            const reactors  = reactions[emoji] ?? []
            const count     = reactors.length
            const myReacted = reactors.includes(currentUserId)
            return (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-all',
                  myReacted
                    ? 'bg-[#E8F4F0] border-[#7FB069] text-[#004643] font-medium'
                    : count > 0
                      ? 'bg-[#F7F8FA] border-[#E5E7EB] text-[#374151] hover:border-[#004643]/30'
                      : 'border-[#E5E7EB] text-[#9CA3AF] hover:border-[#9CA3AF] opacity-60 hover:opacity-100'
                )}
              >
                <span>{emoji}</span>
                {count > 0 && (
                  <span className="text-xs leading-none">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Thread ────────────────────────────────────────────────────────────────────

export function NudgeMessageThread({ messages, currentUserId }: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF] py-4 text-center">
        No messages sent yet. Send a message nudge to start a conversation.
      </p>
    )
  }

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
