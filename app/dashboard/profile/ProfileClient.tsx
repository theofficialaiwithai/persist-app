'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Pencil, Check, X, ArrowRight, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { showToast } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreatorData {
  id: string
  senderName: string
  name: string
  email: string
  coursePlatform: string
  profileImageUrl: string | null
  bannerImageUrl: string | null
  bio: string | null
}

interface CourseData {
  id: string
  name: string
  studentCount: number
  avgCompletion: number
}

interface NudgeData {
  id: string
  subject: string
  status: string
  createdAt: string
  studentName: string
}

interface ProfileClientProps {
  creator: CreatorData
  stats: {
    totalStudents: number
    activeCourses: number
    totalNudgesSent: number
    avgCompletion: number
  }
  courses: CourseData[]
  recentNudges: NudgeData[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BANNER_GRADIENT = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)'

function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Image URL modal ───────────────────────────────────────────────────────────

interface ImageUrlModalProps {
  title: string
  placeholder: string
  onSave: (url: string) => void
  onClose: () => void
}

function ImageUrlModal({ title, placeholder, onSave, onClose }: ImageUrlModalProps) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F7F8FA] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && url.trim()) onSave(url.trim()) }}
          className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-[#9CA3AF]"
        />
        <p className="text-xs text-[#9CA3AF] mt-1.5">Paste a direct image URL (https://...)</p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#6B7280] hover:bg-[#F7F8FA] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => url.trim() && onSave(url.trim())}
            disabled={!url.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── ProfileClient ─────────────────────────────────────────────────────────────

export function ProfileClient({ creator, stats, courses, recentNudges }: ProfileClientProps) {
  const router = useRouter()

  // Local copies for optimistic UI
  const [profileImageUrl, setProfileImageUrl] = useState(creator.profileImageUrl)
  const [bannerImageUrl,  setBannerImageUrl]  = useState(creator.bannerImageUrl)
  const [bio,             setBio]             = useState(
    creator.bio ?? `Course creator on ${creator.coursePlatform || 'my platform'}. Helping students learn and grow.`
  )

  // Dialog visibility
  const [showBannerDialog,  setShowBannerDialog]  = useState(false)
  const [showPhotoDialog,   setShowPhotoDialog]   = useState(false)

  // Bio edit mode
  const [editingBio,  setEditingBio]  = useState(false)
  const [bioDraft,    setBioDraft]    = useState(bio)

  // Edit profile (senderName)
  const [editingName,  setEditingName]  = useState(false)
  const [nameDraft,    setNameDraft]    = useState(creator.senderName || creator.name)

  const firstName = (creator.senderName || creator.name).split(' ')[0] || 'Creator'
  const displayName = creator.senderName || creator.name || 'Creator'
  const avatarInitials = initials(displayName)

  // ── PATCH helper ────────────────────────────────────────────────────────────
  async function patchProfile(payload: Record<string, string | null>) {
    const res = await fetch('/api/creator/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    router.refresh()
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleBannerSave(url: string) {
    setShowBannerDialog(false)
    setBannerImageUrl(url)
    try {
      await patchProfile({ bannerImageUrl: url })
      showToast.saved('Banner updated')
    } catch {
      setBannerImageUrl(creator.bannerImageUrl)
      showToast.error('Failed to update banner')
    }
  }

  async function handlePhotoSave(url: string) {
    setShowPhotoDialog(false)
    setProfileImageUrl(url)
    try {
      await patchProfile({ profileImageUrl: url })
      showToast.saved('Profile photo updated')
    } catch {
      setProfileImageUrl(creator.profileImageUrl)
      showToast.error('Failed to update photo')
    }
  }

  async function handleBioSave() {
    const saved = bioDraft.trim()
    setBio(saved)
    setEditingBio(false)
    try {
      await patchProfile({ bio: saved })
      showToast.saved('Bio saved')
    } catch {
      setBio(bio)
      showToast.error('Failed to save bio')
    }
  }

  async function handleNameSave() {
    const saved = nameDraft.trim()
    if (!saved) { setEditingName(false); return }
    setEditingName(false)
    try {
      await patchProfile({ senderName: saved })
      showToast.saved('Name updated')
    } catch {
      showToast.error('Failed to update name')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">

      {/* ── BANNER ──────────────────────────────────────────────────────────── */}
      <div className="relative h-48 rounded-2xl overflow-hidden group">
        {bannerImageUrl ? (
          <img src={bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: BANNER_GRADIENT }} />
        )}

        {/* Change banner button — visible on hover */}
        <button
          onClick={() => setShowBannerDialog(true)}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-black/70"
        >
          <Pencil className="w-3 h-3" />
          Change banner
        </button>
      </div>

      {/* ── AVATAR + NAME ROW ────────────────────────────────────────────────── */}
      <div className="flex items-end gap-4 -mt-14 px-2">
        {/* Avatar — overlaps banner */}
        <div
          className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg flex-shrink-0 overflow-hidden group cursor-pointer bg-gradient-to-br from-indigo-500 to-indigo-700"
          onClick={() => setShowPhotoDialog(true)}
        >
          {profileImageUrl
            ? <img src={profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
            : <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">{avatarInitials}</span>
          }
          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Name + platform */}
        <div className="flex-1 min-w-0 pb-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false) }}
                autoFocus
                className="text-2xl font-bold text-[#111827] bg-transparent border-b-2 border-indigo-400 focus:outline-none w-full max-w-xs"
              />
              <button onClick={handleNameSave} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingName(false)} className="text-[#6B7280] hover:text-[#111827]"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/name">
              <h1 className="text-2xl font-bold text-[#111827] truncate">{displayName}</h1>
              <button
                onClick={() => { setNameDraft(displayName); setEditingName(true) }}
                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-[#9CA3AF] hover:text-indigo-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-[#6B7280] mt-0.5">
            {creator.coursePlatform
              ? creator.coursePlatform.charAt(0).toUpperCase() + creator.coursePlatform.slice(1)
              : 'Course Creator'}
          </p>
        </div>

        {/* Edit Profile button (goes to settings) */}
        <Link
          href="/dashboard/settings"
          className="mb-1 shrink-0 px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-[#F7F8FA] transition-colors"
        >
          Edit Settings
        </Link>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'Total Students',    value: stats.totalStudents   },
          { label: 'Active Courses',    value: stats.activeCourses   },
          { label: 'Nudges Sent',       value: stats.totalNudgesSent },
          { label: 'Avg Completion',    value: `${stats.avgCompletion}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{value}</p>
            <p className="text-xs text-[#6B7280] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── ABOUT ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#111827]">About</h2>
          {!editingBio && (
            <button
              onClick={() => { setBioDraft(bio); setEditingBio(true) }}
              className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-indigo-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {editingBio ? (
          <div className="space-y-3">
            <textarea
              value={bioDraft}
              onChange={e => setBioDraft(e.target.value)}
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-[#374151] leading-relaxed"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingBio(false)}
                className="px-3 py-1.5 text-xs text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBioSave}
                className="px-3 py-1.5 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] leading-relaxed">{bio}</p>
        )}
      </div>

      {/* ── COURSES ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#111827] mb-4">My Courses</h2>
        {courses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#6B7280]">No courses connected yet.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Set up your webhook to start tracking student progress.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {courses.map(course => (
              <div key={course.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                {/* Course icon */}
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 text-sm font-bold">
                    {course.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Course name + stats */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">{course.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#6B7280]">{course.studentCount} student{course.studentCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-[#9CA3AF]">·</span>
                    <span className="text-xs text-[#6B7280]">{course.avgCompletion}% avg completion</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="hidden sm:block w-24">
                  <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${course.avgCompletion}%` }}
                    />
                  </div>
                </div>
                {/* Link */}
                <Link
                  href={`/dashboard/students?course=${course.id}`}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View Students
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RECENT ACTIVITY ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#111827] mb-4">Recent Activity</h2>
        {recentNudges.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#6B7280]">No nudges sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {recentNudges.map(nudge => (
              <div key={nudge.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827]">{nudge.studentName}</p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {nudge.subject.length > 60 ? nudge.subject.slice(0, 60) + '…' : nudge.subject}
                  </p>
                </div>
                <span className="hidden sm:block text-xs text-[#9CA3AF] shrink-0 tabular-nums">
                  {relativeTime(nudge.createdAt)}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  nudge.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                )}>
                  {nudge.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Image URL modals ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBannerDialog && (
          <ImageUrlModal
            title="Change Banner Image"
            placeholder="https://images.unsplash.com/..."
            onSave={handleBannerSave}
            onClose={() => setShowBannerDialog(false)}
          />
        )}
        {showPhotoDialog && (
          <ImageUrlModal
            title="Change Profile Photo"
            placeholder="https://example.com/your-photo.jpg"
            onSave={handlePhotoSave}
            onClose={() => setShowPhotoDialog(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
