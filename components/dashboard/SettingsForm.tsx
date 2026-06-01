'use client'

import { useState } from 'react'
import { showToast } from '@/lib/toast'
import { Copy, Eye, EyeOff, Loader2, X, FlaskConical, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SettingsFormProps {
  userType:  string
  initialData: {
    senderName:           string
    senderEmail:          string
    coursePlatform:       string
    nudgeTone:            string
    minDaysBetweenNudges: number
    blackoutWeekends:     boolean
    nudgeTriggerType:     string
    nudgeMilestones:      string
  }
  webhookUrl:    string
  webhookSecret: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'teachable',  label: 'Teachable'  },
  { value: 'kajabi',     label: 'Kajabi'     },
  { value: 'thinkific',  label: 'Thinkific'  },
  { value: 'podia',      label: 'Podia'      },
  { value: 'gumroad',    label: 'Gumroad'    },
  { value: 'other',      label: 'Other'      },
]

const TONES: { value: string; label: string; description: string }[] = [
  { value: 'encouraging',  label: 'Encouraging',  description: 'Warm and positive — celebrates every win, big or small'   },
  { value: 'professional', label: 'Professional', description: 'Clear and direct — focused on outcomes and value'          },
  { value: 'urgent',       label: 'Urgent',       description: 'Time-sensitive — motivates action with a gentle nudge'    },
  { value: 'friendly',     label: 'Friendly',     description: 'Conversational and casual — like a friend checking in'    },
]

const TRIGGER_OPTIONS = [
  {
    value:       'inactivity',
    label:       'Inactivity',
    emoji:       '💤',
    description: 'Get nudged when you (or your students) have gone quiet for too long',
  },
  {
    value:       'frequency',
    label:       'Frequency',
    emoji:       '📅',
    description: 'Receive regular reminders on a set schedule regardless of activity',
  },
  {
    value:       'milestones',
    label:       'Milestones',
    emoji:       '🏁',
    description: 'Get nudged when you hit specific progress checkpoints in the course',
  },
]

const MILESTONE_OPTIONS = [
  { value: 25,  label: '25% completed',  emoji: '🌱' },
  { value: 50,  label: '50% completed',  emoji: '🌿' },
  { value: 75,  label: '75% completed',  emoji: '🌳' },
  { value: 90,  label: '90% completed',  emoji: '🏆' },
]

const EXAMPLE_PAYLOAD = `{
  "studentEmail": "student@example.com",
  "studentName": "Jane Smith",
  "courseTitle": "My Awesome Course",
  "courseExternalId": "course-123",
  "completionPercent": 45.5,
  "eventType": "lesson_completed",
  "eventTimestamp": "2024-01-15T10:30:00Z"
}`

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#111827] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#004643] focus:border-transparent ' +
  'disabled:bg-[#F7F8FA] disabled:text-[#6B7280] disabled:cursor-not-allowed'

const labelCls = 'block text-sm font-medium text-[#111827] mb-1'
const hintCls  = 'mt-1 text-xs text-[#6B7280]'

const saveBtnCls =
  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white ' +
  'bg-[#E4572E] hover:bg-[#CC4A23] rounded-lg transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMilestones(raw: string): number[] {
  return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
}

function serializeMilestones(values: number[]): string {
  return values.sort((a, b) => a - b).join(',')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsForm({ userType, initialData, webhookUrl, webhookSecret }: SettingsFormProps) {
  const isCreator = userType === 'creator'

  // ── Section 1: Email Identity ──────────────────────────────────────────────
  const [senderName,     setSenderName    ] = useState(initialData.senderName)
  const [senderEmail,    setSenderEmail   ] = useState(initialData.senderEmail)
  const [coursePlatform, setCoursePlatform] = useState(initialData.coursePlatform)
  const [identitySaving, setIdentitySaving] = useState(false)

  // ── Section 2: Nudge Preferences ──────────────────────────────────────────
  const [nudgeTone,            setNudgeTone           ] = useState(initialData.nudgeTone)
  const [minDaysBetweenNudges, setMinDaysBetweenNudges] = useState(initialData.minDaysBetweenNudges)
  const [blackoutWeekends,     setBlackoutWeekends    ] = useState(initialData.blackoutWeekends)
  const [nudgeTriggerType,     setNudgeTriggerType    ] = useState(initialData.nudgeTriggerType || 'inactivity')
  const [selectedMilestones,   setSelectedMilestones  ] = useState<number[]>(
    parseMilestones(initialData.nudgeMilestones || '25,50,75,90')
  )
  const [prefsSaving, setPrefsSaving] = useState(false)

  // ── Section 3: Webhook ─────────────────────────────────────────────────────
  const [showSecret,  setShowSecret ] = useState(false)
  const [testOpen,    setTestOpen   ] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult,  setTestResult ] = useState<{ success: boolean; message: string } | null>(null)

  // ── Section 4: Danger zone ─────────────────────────────────────────────────
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast.copied(`${label} copied`)
    } catch {
      showToast.error('Failed to copy — please copy manually')
    }
  }

  const saveIdentity = async () => {
    setIdentitySaving(true)
    try {
      const res = await fetch('/api/creator/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ senderName, senderEmail, coursePlatform }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast.saved('Email identity saved')
    } catch {
      showToast.error('Failed to save — please try again')
    } finally {
      setIdentitySaving(false)
    }
  }

  const savePrefs = async () => {
    setPrefsSaving(true)
    try {
      const res = await fetch('/api/creator/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nudgeTone,
          minDaysBetweenNudges: Number(minDaysBetweenNudges),
          blackoutWeekends,
          nudgeTriggerType,
          nudgeMilestones: serializeMilestones(selectedMilestones),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      showToast.saved('Nudge preferences saved')
    } catch {
      showToast.error('Failed to save — please try again')
    } finally {
      setPrefsSaving(false)
    }
  }

  const runTest = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res  = await fetch('/api/webhook/test', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: 'Test event received successfully! Check your students list.' })
      } else {
        setTestResult({ success: false, message: data.result?.error ?? 'Webhook test failed' })
      }
    } catch (err) {
      setTestResult({ success: false, message: String(err) })
    } finally {
      setTestLoading(false)
    }
  }

  const handleReset = async () => {
    setResetLoading(true)
    try {
      const res = await fetch('/api/creator/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reset: true }),
      })
      if (!res.ok) throw new Error('Reset failed')
      setNudgeTone('encouraging')
      setMinDaysBetweenNudges(5)
      setBlackoutWeekends(false)
      setNudgeTriggerType('inactivity')
      setSelectedMilestones([25, 50, 75, 90])
      setResetConfirm(false)
      showToast.saved('Settings reset to defaults')
    } catch {
      showToast.error('Reset failed — please try again')
    } finally {
      setResetLoading(false)
    }
  }

  function toggleMilestone(value: number) {
    setSelectedMilestones(prev =>
      prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
    )
  }

  const toneDescription = TONES.find(t => t.value === nudgeTone)?.description ?? ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Section 0: Account Type ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Account Type</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Your account type determines which features are available to you
            </p>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-4',
            isCreator
              ? 'bg-[#E8F4F0] text-[#004643] border border-[#B8D9CE]'
              : 'bg-[#FFF0EB] text-[#CC4A23] border border-[#F5C4B4]',
          )}>
            {isCreator ? '🚀 Course Creator' : '🎓 Independent Learner'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Creator features */}
          <div className={cn(
            'rounded-xl p-4 border',
            isCreator ? 'bg-[#F0F7EE] border-[#B8D9CE]' : 'bg-[#F7F8FA] border-[#E5E7EB] opacity-50',
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🚀</span>
              <p className="text-sm font-semibold text-[#111827]">Course Creator</p>
              {isCreator && (
                <span className="ml-auto text-[10px] font-bold text-[#5A8F47] bg-[#7FB069]/20 px-1.5 py-0.5 rounded-full">
                  YOUR PLAN
                </span>
              )}
            </div>
            <ul className="space-y-1 text-xs text-[#6B7280]">
              {['AI nudges for your students', 'Webhook integration', 'Student dashboard', 'Weekly digest emails'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-[#7FB069]">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Learner features */}
          <div className={cn(
            'rounded-xl p-4 border',
            !isCreator ? 'bg-[#FFF0EB] border-[#F5C4B4]' : 'bg-[#F7F8FA] border-[#E5E7EB] opacity-50',
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🎓</span>
              <p className="text-sm font-semibold text-[#111827]">Independent Learner</p>
              {!isCreator && (
                <span className="ml-auto text-[10px] font-bold text-[#CC4A23] bg-[#E4572E]/20 px-1.5 py-0.5 rounded-full">
                  YOUR PLAN
                </span>
              )}
            </div>
            <ul className="space-y-1 text-xs text-[#6B7280]">
              {['Course progress tracking', 'Lesson checklists', 'Learning sprints', 'Accountability nudges'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-[#E4572E]">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-xs text-[#9CA3AF]">
          Want to switch account types? Contact{' '}
          <a href="mailto:support@persist.app" className="text-[#004643] hover:underline">support@persist.app</a>
        </p>
      </div>

      {/* ── Section 1: Email Identity ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Email Identity</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {isCreator
              ? 'How you appear in nudge emails sent to students'
              : 'How you appear in accountability emails and sprint notifications'}
          </p>
        </div>

        <div>
          <label className={labelCls}>Display name</label>
          <input
            type="text"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder="Jane Smith"
            className={inputCls}
          />
          <p className={hintCls}>Your name as it appears in emails</p>
        </div>

        <div>
          <label className={labelCls}>Reply-to email</label>
          <input
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="jane@example.com"
            className={inputCls}
          />
          <p className={hintCls}>Replies will be sent to this address</p>
        </div>

        {isCreator && (
          <div>
            <label className={labelCls}>Course platform</label>
            <select
              value={coursePlatform}
              onChange={e => setCoursePlatform(e.target.value)}
              className={cn(inputCls, 'cursor-pointer')}
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={saveIdentity} disabled={identitySaving} className={saveBtnCls}>
            {identitySaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

      {/* ── Section 2: Nudge Preferences ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Nudge Preferences</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Control how and when you receive nudges</p>
        </div>

        {/* Nudge trigger type */}
        <div>
          <label className={cn(labelCls, 'mb-3')}>When should nudges be sent?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TRIGGER_OPTIONS.map(opt => {
              const selected = nudgeTriggerType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNudgeTriggerType(opt.value)}
                  className={cn(
                    'flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all',
                    selected
                      ? 'border-[#004643] bg-[#F0F7EE]'
                      : 'border-[#E5E7EB] hover:border-[#B8D9CE] hover:bg-[#F7FFFE]',
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <span className={cn('text-sm font-semibold', selected ? 'text-[#004643]' : 'text-[#111827]')}>
                      {opt.label}
                    </span>
                    <div className={cn(
                      'ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                      selected ? 'border-[#004643] bg-[#004643]' : 'border-[#D1D5DB]',
                    )}>
                      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{opt.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Milestone checkboxes — only when milestones selected */}
        {nudgeTriggerType === 'milestones' && (
          <div>
            <label className={cn(labelCls, 'mb-3')}>Notify me at these progress points</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MILESTONE_OPTIONS.map(m => {
                const checked = selectedMilestones.includes(m.value)
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMilestone(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                      checked
                        ? 'border-[#004643] bg-[#F0F7EE]'
                        : 'border-[#E5E7EB] hover:border-[#B8D9CE]',
                    )}
                  >
                    <span className="text-xl leading-none">{m.emoji}</span>
                    <span className={cn('text-sm font-bold', checked ? 'text-[#004643]' : 'text-[#9CA3AF]')}>
                      {m.value}%
                    </span>
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      checked ? 'border-[#004643] bg-[#004643]' : 'border-[#D1D5DB]',
                    )}>
                      {checked && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedMilestones.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Select at least one milestone to receive nudges</p>
            )}
          </div>
        )}

        {/* Inactivity / frequency threshold — shown for inactivity + frequency */}
        {nudgeTriggerType !== 'milestones' && (
          <div>
            <label className={labelCls}>
              {nudgeTriggerType === 'frequency' ? 'Send a nudge every' : 'Nudge after inactivity of'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={30}
                value={minDaysBetweenNudges}
                onChange={e => setMinDaysBetweenNudges(Number(e.target.value))}
                className={cn(inputCls, 'w-24')}
              />
              <span className="text-sm text-[#6B7280]">days</span>
            </div>
            <p className={hintCls}>
              {nudgeTriggerType === 'frequency'
                ? 'A nudge will go out on this interval regardless of activity'
                : "Persist won't send more than one nudge per student within this window"}
            </p>
          </div>
        )}

        {/* Nudge tone — creators only */}
        {isCreator && (
          <div>
            <label className={labelCls}>Nudge tone</label>
            <select
              value={nudgeTone}
              onChange={e => setNudgeTone(e.target.value)}
              className={cn(inputCls, 'cursor-pointer')}
            >
              {TONES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {toneDescription && <p className={hintCls}>{toneDescription}</p>}
          </div>
        )}

        {/* Blackout weekends */}
        <div className="flex items-start gap-3">
          <input
            id="blackout"
            type="checkbox"
            checked={blackoutWeekends}
            onChange={e => setBlackoutWeekends(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#E5E7EB] text-[#004643] focus:ring-[#004643] cursor-pointer"
          />
          <label htmlFor="blackout" className="text-sm text-[#111827] cursor-pointer select-none">
            <span className="font-medium">Blackout weekends</span>
            <span className="block text-[#6B7280] text-xs mt-0.5">
              Don't send nudges on Saturdays or Sundays
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={savePrefs} disabled={prefsSaving} className={saveBtnCls}>
            {prefsSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

      {/* ── Section 3: Webhook Setup ─────────────────────────────────────── */}
      {isCreator ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Webhook Setup</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Paste this URL into Zapier, Make, or your course platform's webhook settings.
                Send a POST request whenever a student completes a lesson.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E8F4F0] text-[#004643] border border-[#B8D9CE] flex-shrink-0">
              🚀 Course Creators Only
            </span>
          </div>

          {/* Webhook URL */}
          <div>
            <label className={labelCls}>Webhook URL</label>
            <div className="flex gap-2">
              <input readOnly value={webhookUrl} className={cn(inputCls, 'flex-1 font-mono text-xs')} />
              <button
                onClick={() => copy(webhookUrl, 'Webhook URL')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy URL
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className={labelCls}>Signing secret</label>
            <div className="flex gap-2">
              <input
                readOnly
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret}
                className={cn(inputCls, 'flex-1 font-mono text-xs')}
              />
              <button
                onClick={() => setShowSecret(s => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSecret ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={() => copy(webhookSecret, 'Signing secret')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <p className={hintCls}>
              Include this as the <code className="font-mono bg-[#F7F8FA] px-1 rounded">x-persist-signature</code> header (HMAC-SHA256 of the raw body).
            </p>
          </div>

          {/* Expected payload */}
          <div>
            <label className={labelCls}>Expected payload shape</label>
            <pre className="text-xs font-mono bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4 overflow-x-auto text-[#374151] leading-relaxed">
              {EXAMPLE_PAYLOAD}
            </pre>
          </div>

          {/* Test webhook */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-[#6B7280]">Ready to test your integration?</p>
            <button
              onClick={() => { setTestOpen(true); setTestResult(null) }}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#004643] hover:text-[#003533] transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Test your webhook →
            </button>
          </div>
        </div>
      ) : (
        /* Learner — locked webhook section */
        <div className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-[#9CA3AF]">Webhook Setup</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5E7EB] text-[#6B7280]">
                  🚀 Course Creators Only
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF] mt-1.5 leading-relaxed">
                Webhook integration is available for course creators who want to automatically
                track their students' progress. As an independent learner, you can connect
                courses manually from your{' '}
                <a href="/dashboard/learn" className="text-[#004643] hover:underline">
                  Learn dashboard
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: Danger Zone ───────────────────────────────────────── */}
      <div className="bg-[#664147]/5 rounded-xl border border-[#664147]/30 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Danger Zone</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Irreversible actions — proceed with care</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#111827]">Reset nudge preferences</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Resets tone, frequency, and weekend settings to defaults. Email identity is unchanged.
            </p>
          </div>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#664147] border border-[#664147]/30 rounded-lg hover:bg-[#664147]/10 transition-colors shrink-0 ml-4"
            >
              Reset to defaults
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-xs text-[#6B7280]">Are you sure?</span>
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {resetLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Yes, reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Test Webhook Modal ───────────────────────────────────────────── */}
      {testOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#111827]">Test Webhook</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  Sends a signed test event to your webhook endpoint and creates a sample student.
                </p>
              </div>
              <button onClick={() => setTestOpen(false)} className="text-[#6B7280] hover:text-[#111827] ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="text-xs font-mono bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3 overflow-x-auto text-[#374151]">
              {EXAMPLE_PAYLOAD}
            </pre>

            {testResult && (
              <div className={cn(
                'rounded-lg px-4 py-3 text-sm',
                testResult.success ? 'bg-[#F0F7EE] text-[#5A8F47]' : 'bg-red-50 text-red-700',
              )}>
                {testResult.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setTestOpen(false)}
                className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Close
              </button>
              <button onClick={runTest} disabled={testLoading} className={saveBtnCls}>
                {testLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send test event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
