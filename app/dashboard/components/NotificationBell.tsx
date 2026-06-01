'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/app/api/notifications/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_META: Record<Notification['type'], { emoji: string }> = {
  nudge_sent:  { emoji: '📬' },
  progress:    { emoji: '📈' },
  completion:  { emoji: '🏆' },
  sprint_post: { emoji: '💬' },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Whether the sidebar is in collapsed (icon-only) mode */
  collapsed: boolean
}

export function NotificationBell({ collapsed }: Props) {
  const router  = useRouter()
  const ref     = useRef<HTMLDivElement>(null)
  const [open,         setOpen        ] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [read,         setRead        ] = useState<Set<string>>(new Set())
  const [loading,      setLoading     ] = useState(false)

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('persist-notif-read') ?? '[]') as string[]
      setRead(new Set(stored))
    } catch { /* ignore */ }
  }, [])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] }
        setNotifications(data.notifications)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unreadCount = notifications.filter(n => !read.has(n.id)).length

  function handleMarkAllRead() {
    const allIds = notifications.map(n => n.id)
    const next = new Set(allIds)
    setRead(next)
    try { localStorage.setItem('persist-notif-read', JSON.stringify(allIds)) } catch { /* ignore */ }
  }

  function handleNotificationClick(n: Notification) {
    // Mark as read
    const next = new Set(read)
    next.add(n.id)
    setRead(next)
    try { localStorage.setItem('persist-notif-read', JSON.stringify([...next])) } catch { /* ignore */ }
    setOpen(false)
    router.push(n.href)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        title="Notifications"
        className="relative w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA] transition-colors flex-shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E4572E] rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute top-9 z-[200] w-72 bg-white rounded-2xl shadow-xl border border-[#E2EDEC] overflow-hidden ${
            collapsed ? 'left-2' : 'left-0'
          }`}
          style={{ maxHeight: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#111827]">Recent Activity</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-medium text-[#004643] hover:text-[#003533] transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-[#E2EDEC] border-t-[#004643] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <p className="text-sm font-medium text-[#111827]">No recent activity</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Your first nudge will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F3F4F6]">
                {notifications.map(n => {
                  const isUnread = !read.has(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#F7F8FA] transition-colors ${
                        isUnread ? 'bg-[#F0F7FF]' : ''
                      }`}
                    >
                      <span className="text-base leading-none mt-0.5 shrink-0">{TYPE_META[n.type].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isUnread ? 'text-[#111827]' : 'text-[#374151]'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">{n.subtitle}</p>
                      </div>
                      <span className="text-[10px] text-[#C4CEC9] shrink-0 mt-0.5">{relativeTime(n.createdAt)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
