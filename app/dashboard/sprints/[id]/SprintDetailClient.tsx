'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import {
  ChevronLeft, Users, MessageSquare, Zap, Calendar,
  Plus, Loader2, X, CheckCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sprint {
  id: string; title: string; description: string | null
  courseId: string | null; courseName: string | null; skillFocus: string | null
  startDate: string; endDate: string; joinDeadline: string
  maxMembers: number; status: string
}

interface Member {
  id: string; studentId: string; name: string; email: string
  progressPct: number; joinedAt: string; initials: string
}

interface Reply {
  id: string; authorName: string; authorInitials: string
  content: string; createdAt: string
}

interface Post extends Reply {
  replies: Reply[]
}

interface EligibleStudent { id: string; name: string; email: string }

interface Props {
  sprint: Sprint
  members: Member[]
  posts: Post[]
  eligibleStudents: EligibleStudent[]
  creatorName: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr + 'T00:00:00')
  const n = new Date(); n.setHours(0,0,0,0)
  return Math.ceil((t.getTime() - n.getTime()) / 86_400_000)
}

function sprintElapsedPct(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00').getTime()
  const e = new Date(end   + 'T00:00:00').getTime()
  const n = Date.now()
  if (n <= s) return 0
  if (n >= e) return 100
  return Math.round(((n - s) / (e - s)) * 100)
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusBadge(status: string) {
  switch (status) {
    case 'open':      return { label: 'Enrolling',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    case 'active':    return { label: 'In Progress',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'completed': return { label: 'Completed',    cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
    case 'cancelled': return { label: 'Cancelled',    cls: 'bg-red-50 text-red-700 border-red-200' }
    default:          return { label: status,          cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
  }
}

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r  = (size - 8) / 2
  const c  = 2 * Math.PI * r
  const sd = c * (1 - pct / 100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#4F46E5" strokeWidth={6}
        strokeDasharray={c} strokeDashoffset={sd}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

function AddMemberModal({
  sprintId,
  eligible,
  onClose,
  onAdded,
}: {
  sprintId: string
  eligible: EligibleStudent[]
  onClose: () => void
  onAdded: (s: EligibleStudent) => void
}) {
  const [query, setQuery]   = useState('')
  const [adding, setAdding] = useState<string | null>(null)

  const filtered = eligible.filter(
    s => s.name.toLowerCase().includes(query.toLowerCase()) ||
         s.email.toLowerCase().includes(query.toLowerCase()),
  )

  async function addStudent(student: EligibleStudent) {
    setAdding(student.id)
    try {
      const res = await fetch(`/api/sprints/${sprintId}/members`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast.saved(`${student.name} added to sprint`)
      onAdded(student)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setAdding(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-base font-semibold text-[#111827]">Add Student to Sprint</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <input
              autoFocus
              type="text"
              placeholder="Search students…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-[#F3F4F6]">
            {filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center text-[#9CA3AF]">
                {eligible.length === 0 ? 'All students are already in this sprint' : 'No students match'}
              </p>
            ) : filtered.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#F9FAFB]">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{s.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{s.email}</p>
                </div>
                <button
                  onClick={() => addStudent(s)}
                  disabled={!!adding}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {adding === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Forum Post (EmailClientCard style) ───────────────────────────────────────

const REACTIONS = ['😍', '❤️', '🔥', '⚡️', '👍']

function ForumPost({
  post,
  sprintId,
  creatorInitials,
  creatorName,
}: {
  post: Post
  sprintId: string
  creatorInitials: string
  creatorName: string
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending,   setSending  ] = useState(false)
  const [replies,   setReplies  ] = useState(post.replies)
  const isCreatorPost = post.authorName.includes('(Creator)')

  async function submitReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/sprints/${sprintId}/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:        replyText.trim(),
          authorName:     `${creatorName} (Creator)`,
          authorInitials: creatorInitials,
          parentPostId:   post.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReplies(prev => [...prev, { ...data.reply, createdAt: data.reply.createdAt ?? new Date().toISOString() }])
      setReplyText('')
      setShowReply(false)
    } catch {
      showToast.error('Failed to post reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
    >
      {/* Header — avatar + name + timestamp */}
      <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F3F4F6]">
        <div className={cn(
          'w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0',
          isCreatorPost ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600',
        )}>
          {post.authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111827] leading-none">{post.authorName}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{relTime(post.createdAt)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Threaded replies */}
      {replies.length > 0 && (
        <div className="px-4 pb-3 space-y-2.5">
          {replies.map(r => (
            <div key={r.id} className="flex gap-2 pl-3 border-l-2 border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-semibold flex items-center justify-center shrink-0">
                {r.authorInitials}
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-[#111827]">{r.authorName}</span>
                      <span className="text-[10px] text-[#9CA3AF]">{relTime(r.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Footer — reply input + emoji reactions */}
      <div className="px-3 py-2.5 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <AnimatePresence>
          {showReply && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden"
            >
              <textarea
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-[#9CA3AF] bg-white"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Click-to-expand reply input */}
          {!showReply && (
            <input
              type="text"
              readOnly
              onClick={() => setShowReply(true)}
              placeholder="Type here..."
              className="flex-1 h-8 rounded-lg border border-[#E5E7EB] px-3 text-sm bg-white text-[#9CA3AF] cursor-text focus:outline-none"
            />
          )}

          {/* Emoji quick-react buttons */}
          <div className="flex items-center gap-0.5">
            {REACTIONS.map((emoji, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                onClick={() => { setShowReply(true); setReplyText(prev => prev + emoji + ' ') }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-[#F3F4F6] transition-colors"
                title={`React with ${emoji}`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {showReply && (
            <>
              <button
                onClick={() => { setShowReply(false); setReplyText('') }}
                className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors ml-1"
              >
                Cancel
              </button>
              <button
                onClick={submitReply}
                disabled={!replyText.trim() || sending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {sending && <Loader2 className="w-3 h-3 animate-spin" />}
                Reply
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function SprintDetailClient({ sprint, members: initialMembers, posts: initialPosts, eligibleStudents: initialEligible, creatorName }: Props) {
  const router = useRouter()
  const badge  = statusBadge(sprint.status)
  const label  = sprint.courseName || sprint.skillFocus || 'Open Sprint'

  const creatorInitials = (creatorName ?? 'Creator').split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)

  // ── State ──────────────────────────────────────────────────────────────────
  const [members,  setMembers ] = useState(initialMembers)
  const [posts,    setPosts   ] = useState(initialPosts)
  const [eligible, setEligible] = useState(initialEligible)
  const [showAdd,  setShowAdd ] = useState(false)
  const [newPost,  setNewPost ] = useState('')
  const [posting,  setPosting ] = useState(false)
  const [ending,   setEnding  ] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  // Countdown
  const daysToDeadline = daysUntil(sprint.joinDeadline)
  const daysToEnd      = daysUntil(sprint.endDate)
  const elapsedPct     = sprintElapsedPct(sprint.startDate, sprint.endDate)

  function handleMemberAdded(student: EligibleStudent) {
    const initials = student.name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
    setMembers(prev => [...prev, {
      id: crypto.randomUUID(), studentId: student.id,
      name: student.name, email: student.email,
      progressPct: 0, joinedAt: new Date().toISOString(), initials,
    }])
    setEligible(prev => prev.filter(s => s.id !== student.id))
  }

  async function submitPost() {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/sprints/${sprint.id}/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:        newPost.trim(),
          authorName:     `${creatorName} (Creator)`,
          authorInitials: creatorInitials,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPosts(prev => [{ ...data.post, createdAt: data.post.createdAt ?? new Date().toISOString(), replies: [] }, ...prev])
      setNewPost('')
    } catch {
      showToast.error('Failed to post — please try again')
    } finally {
      setPosting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Back link */}
      <Link href="/dashboard/sprints" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Sprints
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl font-bold text-[#111827] flex-1">{sprint.title}</h1>
          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0', badge.cls)}>
            {badge.label}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-3 py-1 text-xs text-[#6B7280]">
          <Zap className="w-3 h-3 text-indigo-500" />{label}
        </span>
        <div className="flex items-center gap-3 mt-3 text-xs text-[#9CA3AF] flex-wrap">
          <span><Calendar className="w-3 h-3 inline mr-1" />Joins close {fmtDate(sprint.joinDeadline)}</span>
          <span>·</span>
          <span>Starts {fmtDate(sprint.startDate)}</span>
          <span>·</span>
          <span>Ends {fmtDate(sprint.endDate)}</span>
          {sprint.status === 'active' && daysToEnd > 0 && (
            <><span>·</span><span className="text-emerald-600 font-medium">{daysToEnd} days remaining</span></>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: members + forum ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Member Progress */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Member Progress
                <span className="text-xs font-medium text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                  {members.length} / {sprint.maxMembers}
                </span>
              </h2>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Student
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">No members yet.</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Add students from your course to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center shrink-0">
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-[#111827]">{m.name}</span>
                          <span className="text-xs text-[#9CA3AF] ml-2">Joined {relTime(m.joinedAt)}</span>
                        </div>
                        <span className="text-xs font-bold text-[#111827] tabular-nums">{m.progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${m.progressPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discussion Forum */}
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" /> Discussion
              </h2>
              <span className="text-xs font-medium text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                {posts.length}
              </span>
            </div>

            {/* Compose card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              {/* Composer header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F3F4F6]">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {creatorInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] leading-none">{creatorName} (Creator)</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Write a post to your cohort</p>
                </div>
              </div>
              {/* Composer body */}
              <div className="px-4 py-3">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share an update, question, or encouragement…"
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitPost() }}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-[#9CA3AF] bg-[#FAFAFA]"
                />
              </div>
              {/* Composer footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FAFAFA]">
                <div className="flex items-center gap-0.5">
                  {REACTIONS.map((emoji, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      onClick={() => setNewPost(prev => prev + emoji + ' ')}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-[#F3F4F6] transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={submitPost}
                  disabled={!newPost.trim() || posting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {posting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Post
                </button>
              </div>
            </div>

            {/* Posts list */}
            {posts.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-[#E5E7EB] bg-white">
                <MessageSquare className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">No posts yet.</p>
                <p className="text-xs text-[#9CA3AF]">Be the first to post an update!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(p => (
                  <ForumPost
                    key={p.id}
                    post={p}
                    sprintId={sprint.id}
                    creatorInitials={creatorInitials}
                    creatorName={creatorName}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: details + countdown + actions ─────────────────────────── */}
        <div className="space-y-4">

          {/* Sprint Details */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Sprint Details</h3>
            {sprint.description && (
              <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{sprint.description}</p>
            )}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Focus</span>
                <span className="font-medium text-[#111827] truncate max-w-[60%] text-right">{label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Duration</span>
                <span className="font-medium text-[#111827]">
                  {Math.ceil((new Date(sprint.endDate+'T00:00:00').getTime() - new Date(sprint.startDate+'T00:00:00').getTime()) / 86_400_000)}d
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Capacity</span>
                <span className="font-medium text-[#111827]">{members.length} / {sprint.maxMembers}</span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">
              {sprint.status === 'active' ? 'Sprint Progress' : 'Countdown'}
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ProgressRing pct={sprint.status === 'active' ? elapsedPct : Math.max(0, Math.min(100, daysToDeadline > 0 ? (1 - daysToDeadline/14)*100 : 100))} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#111827]">
                    {sprint.status === 'active' ? `${elapsedPct}%` : `${Math.max(0, daysToDeadline)}d`}
                  </span>
                </div>
              </div>
              <div>
                {sprint.status === 'open' && (
                  <>
                    <p className={cn('text-2xl font-bold tabular-nums', daysToDeadline < 3 ? 'text-amber-600' : 'text-[#111827]')}>
                      {Math.max(0, daysToDeadline)}
                    </p>
                    <p className="text-xs text-[#6B7280]">days to join</p>
                    {daysToDeadline < 3 && daysToDeadline > 0 && (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">⚡ Closes soon</p>
                    )}
                  </>
                )}
                {sprint.status === 'active' && (
                  <>
                    <p className="text-2xl font-bold tabular-nums text-emerald-600">{Math.max(0, daysToEnd)}</p>
                    <p className="text-xs text-[#6B7280]">days left</p>
                  </>
                )}
                {(sprint.status === 'completed' || sprint.status === 'cancelled') && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-medium text-[#6B7280] capitalize">{sprint.status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-2">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Actions</h3>

            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Student to Sprint
            </button>

            <button
              onClick={() => {
                const publicUrl = `${window.location.origin}/sprints/${sprint.id}`
                navigator.clipboard.writeText(publicUrl)
                showToast.copied('Sprint link copied — share it with your students')
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827] rounded-xl transition-colors"
            >
              Share Sprint Link
            </button>

            {sprint.status !== 'completed' && sprint.status !== 'cancelled' && (
              confirmEnd ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs text-red-700 font-medium">End this sprint early?</p>
                  <p className="text-xs text-red-600">This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="flex-1 py-1.5 text-xs font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={ending}
                      onClick={async () => {
                        setEnding(true)
                        // In a real app you'd call PATCH /api/sprints/[id] to update status
                        await new Promise(r => setTimeout(r, 600))
                        showToast.saved('Sprint ended')
                        router.push('/dashboard/sprints')
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {ending ? '…' : 'End Sprint'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="w-full px-4 py-2 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                >
                  End Sprint Early
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddMemberModal
            sprintId={sprint.id}
            eligible={eligible}
            onClose={() => setShowAdd(false)}
            onAdded={s => { handleMemberAdded(s); setShowAdd(false) }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
