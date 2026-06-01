'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Zap, Users, MessageSquare, Loader2,
  CornerDownRight, Heart, CheckCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sprint {
  id: string; title: string; description: string | null
  courseName: string | null; skillFocus: string | null
  startDate: string; endDate: string; joinDeadline: string
  maxMembers: number; status: string
}

interface Member {
  id: string; studentId: string; name: string
  initials: string; progressPct: number; joinedAt: string
}

interface Reply {
  id: string; authorName: string; authorInitials: string
  content: string; createdAt: string
}

interface Post extends Reply { replies: Reply[] }

interface StudentIdentity {
  studentId: string; name: string; initials: string
}

interface Props {
  sprint: Sprint
  members: Member[]
  posts: Post[]
  creatorDisplayName: string
}

// ── Local-storage key ─────────────────────────────────────────────────────────
const identityKey = (sprintId: string) => `persist-sprint-identity-${sprintId}`

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr + 'T00:00:00')
  const n = new Date(); n.setHours(0, 0, 0, 0)
  return Math.ceil((t.getTime() - n.getTime()) / 86_400_000)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusInfo(status: string) {
  switch (status) {
    case 'open':      return { label: 'Enrolling Now',  cls: 'bg-[#E8F4F0] text-[#003533] border-[#B8D9CE]' }
    case 'active':    return { label: 'In Progress',    cls: 'bg-[#F0F7EE] text-[#5A8F47] border-[#B8D9CE]' }
    case 'completed': return { label: 'Completed',      cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
    case 'cancelled': return { label: 'Cancelled',      cls: 'bg-red-50 text-red-700 border-red-200' }
    default:          return { label: status,            cls: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' }
  }
}

// ── Forum post component ──────────────────────────────────────────────────────

function ForumPost({
  post, sprintId, identity,
}: {
  post: Post; sprintId: string; identity: StudentIdentity | null
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending,   setSending  ] = useState(false)
  const [replies,   setReplies  ] = useState(post.replies)
  const isEncouragement = post.content.startsWith('💪')

  async function submitReply() {
    if (!replyText.trim() || !identity) return
    setSending(true)
    try {
      const res = await fetch(`/api/sprints/${sprintId}/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:        replyText.trim(),
          authorName:     identity.name,
          authorInitials: identity.initials,
          parentPostId:   post.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReplies(prev => [...prev, { ...data.reply, createdAt: new Date().toISOString() }])
      setReplyText(''); setShowReply(false)
    } catch { /* silently ignore */ }
    finally { setSending(false) }
  }

  const isCreator = post.authorName.includes('(Creator)')
  const avatarCls = isCreator
    ? 'bg-[#004643] text-white'
    : isEncouragement
      ? 'bg-rose-100 text-rose-600'
      : 'bg-[#F3F4F6] text-[#6B7280]'

  return (
    <div className={cn('py-4', isEncouragement && 'bg-rose-50/50 -mx-6 px-6 rounded-xl')}>
      <div className="flex gap-3">
        <div className={cn('w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center shrink-0', avatarCls)}>
          {post.authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#111827]">{post.authorName}</span>
            <span className="text-xs text-[#9CA3AF]">{relTime(post.createdAt)}</span>
          </div>
          <p className="text-sm text-[#374151] mt-1 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Reply button — only if identified */}
          {identity && (
            <button
              onClick={() => setShowReply(p => !p)}
              className="mt-2 flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#004643] transition-colors"
            >
              <CornerDownRight className="w-3 h-3" />
              {showReply ? 'Cancel' : replies.length > 0 ? `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}` : 'Reply'}
            </button>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-[#E5E7EB] space-y-3">
              {replies.map(r => (
                <div key={r.id} className="flex gap-2">
                  <div className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0',
                    r.authorName.includes('(Creator)') ? 'bg-[#004643] text-white' : 'bg-[#F3F4F6] text-[#6B7280]',
                  )}>
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

          {/* Reply form */}
          <AnimatePresence>
            {showReply && identity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  rows={2}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004643] resize-none placeholder:text-[#9CA3AF]"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim() || sending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#004643] hover:bg-[#003533] text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Reply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Member row with encourage button ─────────────────────────────────────────

function MemberRow({
  member,
  isMe,
  sprintId,
  identity,
  onEncourageSent,
}: {
  member: Member
  isMe: boolean
  sprintId: string
  identity: StudentIdentity | null
  onEncourageSent: (post: Post) => void
}) {
  const [open,    setOpen   ] = useState(false)
  const [text,    setText   ] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent   ] = useState(false)

  const defaultMessage = `${member.name.split(' ')[0]}, you're doing amazing — keep going! 💪`

  async function sendEncouragement() {
    if (!identity) return
    setSending(true)
    const message = text.trim() || defaultMessage
    try {
      const res = await fetch(`/api/sprints/${sprintId}/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:        `💪 To ${member.name.split(' ')[0]}: ${message}`,
          authorName:     identity.name,
          authorInitials: identity.initials,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onEncourageSent({ ...data.post, createdAt: new Date().toISOString(), replies: [] })
      setSent(true)
      setTimeout(() => { setSent(false); setOpen(false); setText('') }, 2000)
    } catch { /* silently ignore */ }
    finally { setSending(false) }
  }

  return (
    <div className={cn('rounded-xl transition-colors', open ? 'bg-rose-50 -mx-2 px-2' : '')}>
      <div className="flex items-center gap-3 py-3">
        <div className={cn(
          'w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center shrink-0',
          isMe ? 'bg-[#004643] text-white ring-2 ring-indigo-300' : 'bg-[#D1EBE5] text-[#004643]',
        )}>
          {member.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[#111827]">{member.name}</span>
            {isMe && <span className="text-[10px] font-medium text-[#004643] bg-[#E8F4F0] px-1.5 rounded-full">You</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#004643] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${member.progressPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs tabular-nums text-[#9CA3AF] shrink-0">{member.progressPct}%</span>
          </div>
        </div>

        {/* Encourage button — only for other members when identified */}
        {!isMe && identity && (
          <button
            onClick={() => { setOpen(p => !p); if (!open) setText('') }}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              sent
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : open
                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                  : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50',
            )}
          >
            {sent
              ? <><CheckCircle className="w-3 h-3" /> Sent!</>
              : <><Heart className="w-3 h-3" /> Cheer</>
            }
          </button>
        )}
      </div>

      {/* Encourage inline form */}
      <AnimatePresence>
        {open && !sent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pb-3"
          >
            <div className="bg-white rounded-xl border border-rose-200 p-3 space-y-2">
              <p className="text-xs text-rose-600 font-medium">Send an encouragement to {member.name.split(' ')[0]}</p>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={defaultMessage}
                rows={2}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none placeholder:text-[#D1D5DB]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9CA3AF]">Will appear in the group discussion</span>
                <button
                  onClick={sendEncouragement}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
                  {sending ? 'Sending…' : 'Send Cheer'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Identity / Join section ───────────────────────────────────────────────────

function IdentityGate({
  sprintId,
  onIdentified,
  joining,
  setJoining,
}: {
  sprintId: string
  onIdentified: (identity: StudentIdentity, isNew: boolean) => void
  joining: boolean
  setJoining: (v: boolean) => void
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(''); setJoining(true)
    try {
      const res = await fetch(`/api/sprints/${sprintId}/join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      onIdentified(data.student, !data.alreadyMember)
    } catch {
      setError('Connection error — please try again')
    } finally {
      setJoining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F4F0] flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-[#004643]" />
        </div>
        <h2 className="text-base font-semibold text-[#111827]">Join this sprint</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Enter the email you enrolled with to join and connect with your cohort.
        </p>
      </div>

      <form onSubmit={handleJoin} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#004643] placeholder:text-[#9CA3AF]"
        />
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={joining || !email.trim()}
          className="w-full h-11 bg-[#004643] hover:bg-[#003533] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : 'Join Sprint →'}
        </button>
      </form>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudentSprintClient({ sprint, members: initialMembers, posts: initialPosts, creatorDisplayName }: Props) {
  const [identity,   setIdentity  ] = useState<StudentIdentity | null>(null)
  const [members,    setMembers   ] = useState(initialMembers)
  const [posts,      setPosts     ] = useState(initialPosts)
  const [joining,    setJoining   ] = useState(false)
  const [newPost,    setNewPost   ] = useState('')
  const [posting,    setPosting   ] = useState(false)
  const [joinedJust, setJoinedJust] = useState(false)

  const badge   = statusInfo(sprint.status)
  const label   = sprint.courseName || sprint.skillFocus || 'Open Sprint'
  const cap     = sprint.maxMembers
  const fillPct = Math.min(100, Math.round((members.length / cap) * 100))

  const daysToJoin = daysUntil(sprint.joinDeadline)
  const daysToEnd  = daysUntil(sprint.endDate)

  // Restore identity from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(identityKey(sprint.id))
      if (raw) setIdentity(JSON.parse(raw))
    } catch {}
  }, [sprint.id])

  const isMember = identity ? members.some(m => m.studentId === identity.studentId) : false

  function handleIdentified(student: StudentIdentity, isNew: boolean) {
    setIdentity(student)
    localStorage.setItem(identityKey(sprint.id), JSON.stringify(student))
    if (isNew) {
      // Optimistically add them to the members list
      setMembers(prev => [...prev, {
        id:          crypto.randomUUID(),
        studentId:   student.studentId,
        name:        student.name,
        initials:    student.initials,
        progressPct: 0,
        joinedAt:    new Date().toISOString(),
      }])
      setJoinedJust(true)
      setTimeout(() => setJoinedJust(false), 4000)
    }
  }

  async function submitPost() {
    if (!newPost.trim() || !identity) return
    setPosting(true)
    try {
      const res = await fetch(`/api/sprints/${sprint.id}/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:        newPost.trim(),
          authorName:     identity.name,
          authorInitials: identity.initials,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPosts(prev => [{ ...data.post, createdAt: new Date().toISOString(), replies: [] }, ...prev])
      setNewPost('')
    } catch {}
    finally { setPosting(false) }
  }

  return (
    <div className="space-y-5">

      {/* ── Sprint header card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
      >
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-xl font-bold text-[#111827] flex-1">{sprint.title}</h1>
          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0', badge.cls)}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#004643]" />
          <span className="text-sm text-[#6B7280]">{label}</span>
          <span className="text-[#D1D5DB] mx-1">·</span>
          <span className="text-sm text-[#6B7280]">Hosted by {creatorDisplayName}</span>
        </div>

        {sprint.description && (
          <p className="text-sm text-[#374151] leading-relaxed mb-4">{sprint.description}</p>
        )}

        {/* Key dates + countdown */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#9CA3AF]">
          <span>{fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}</span>
          {sprint.status === 'open' && daysToJoin > 0 && (
            <span className={cn('font-medium', daysToJoin < 3 ? 'text-amber-600' : 'text-[#004643]')}>
              {daysToJoin < 3 ? '⚡ ' : ''}Enrollment closes in {daysToJoin} day{daysToJoin !== 1 ? 's' : ''}
            </span>
          )}
          {sprint.status === 'active' && (
            <span className="text-[#6A9A55] font-medium">{daysToEnd} days remaining</span>
          )}
        </div>

        {/* Member fill bar */}
        <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-[#6B7280]">{members.length} / {cap} members</span>
            {members.length > 0 && (
              <div className="flex -space-x-1.5">
                {members.slice(0, 6).map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center border-2 border-white',
                      identity?.studentId === m.studentId
                        ? 'bg-[#004643] text-white'
                        : 'bg-[#D1EBE5] text-[#004643]',
                    )}
                  >
                    {m.initials}
                  </div>
                ))}
                {members.length > 6 && (
                  <div className="w-6 h-6 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[9px] font-semibold flex items-center justify-center border-2 border-white">
                    +{members.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-[#004643] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      </motion.div>

      {/* ── Just joined banner ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {joinedJust && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-[#F0F7EE] border border-[#B8D9CE] rounded-2xl p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-[#7FB069] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">You're in! Welcome to the sprint, {identity?.name.split(' ')[0]} 🎉</p>
              <p className="text-xs text-[#6A9A55] mt-0.5">Introduce yourself in the discussion below, and cheer on your cohort.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Identity gate (not yet identified) ─────────────────────────────── */}
      {!identity && (sprint.status === 'open' || sprint.status === 'active') && (
        <IdentityGate
          sprintId={sprint.id}
          onIdentified={handleIdentified}
          joining={joining}
          setJoining={setJoining}
        />
      )}

      {/* ── Already identified — show full experience ───────────────────────── */}
      {identity && (
        <>
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
          >
            <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#004643]" />
              Your Cohort
              <span className="text-xs font-normal text-[#9CA3AF] ml-1">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </h2>

            {members.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-6">Be the first member!</p>
            ) : (
              <div className="space-y-1 divide-y divide-[#F7F8FA]">
                {members.map(m => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isMe={m.studentId === identity.studentId}
                    sprintId={sprint.id}
                    identity={identity}
                    onEncourageSent={post => setPosts(prev => [post, ...prev])}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Discussion forum */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"
          >
            <h2 className="text-base font-semibold text-[#111827] flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-[#004643]" />
              Discussion
              <span className="text-xs font-normal text-[#9CA3AF] ml-1">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
            </h2>

            {/* Post composer */}
            <div className="flex gap-3 mb-5 pb-5 border-b border-[#F3F4F6]">
              <div className="w-8 h-8 rounded-full bg-[#D1EBE5] text-[#004643] text-xs font-semibold flex items-center justify-center shrink-0">
                {identity.initials}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share an update, question, or win with your cohort…"
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitPost() }}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#004643] resize-none placeholder:text-[#9CA3AF]"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#9CA3AF]">Posting as {identity.name}</span>
                  <button
                    onClick={submitPost}
                    disabled={!newPost.trim() || posting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-[#004643] hover:bg-[#003533] text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {posting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">No posts yet — be the first to say hello! 👋</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F3F4F6] space-y-1">
                {posts.map(p => (
                  <ForumPost key={p.id} post={p} sprintId={sprint.id} identity={identity} />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Sprint closed / completed state */}
      {(sprint.status === 'completed' || sprint.status === 'cancelled') && !identity && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
          <CheckCircle className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#6B7280]">
            This sprint has {sprint.status === 'completed' ? 'concluded' : 'been cancelled'}.
          </p>
        </div>
      )}

    </div>
  )
}
