'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Eye, EyeOff, Loader2, X, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SettingsFormProps {
  initialData: {
    senderName:           string
    senderEmail:          string
    coursePlatform:       string
    nudgeTone:            string
    minDaysBetweenNudges: number
    blackoutWeekends:     boolean
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
  { value: 'encouraging', label: 'Encouraging', description: 'Warm and positive — celebrates every win, big or small'   },
  { value: 'professional', label: 'Professional', description: 'Clear and direct — focused on outcomes and value'          },
  { value: 'urgent',       label: 'Urgent',       description: 'Time-sensitive — motivates action with a gentle nudge'    },
  { value: 'friendly',     label: 'Friendly',     description: 'Conversational and casual — like a friend checking in'    },
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
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
  'disabled:bg-[#F7F8FA] disabled:text-[#6B7280] disabled:cursor-not-allowed'

const labelCls = 'block text-sm font-medium text-[#111827] mb-1'
const hintCls  = 'mt-1 text-xs text-[#6B7280]'

const saveBtnCls =
  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white ' +
  'bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsForm({ initialData, webhookUrl, webhookSecret }: SettingsFormProps) {
  // ── Section 1: Email Identity ──────────────────────────────────────────────
  const [senderName,    setSenderName   ] = useState(initialData.senderName)
  const [senderEmail,   setSenderEmail  ] = useState(initialData.senderEmail)
  const [coursePlatform,setCoursePlatform]=useState(initialData.coursePlatform)
  const [identitySaving,setIdentitySaving]=useState(false)

  // ── Section 2: Nudge Preferences ──────────────────────────────────────────
  const [nudgeTone,           setNudgeTone          ] = useState(initialData.nudgeTone)
  const [minDaysBetweenNudges,setMinDaysBetweenNudges]=useState(initialData.minDaysBetweenNudges)
  const [blackoutWeekends,    setBlackoutWeekends   ] = useState(initialData.blackoutWeekends)
  const [prefsSaving,         setPrefsSaving        ] = useState(false)

  // ── Section 3: Webhook ─────────────────────────────────────────────────────
  const [showSecret,   setShowSecret  ] = useState(false)
  const [testOpen,     setTestOpen    ] = useState(false)
  const [testLoading,  setTestLoading ] = useState(false)
  const [testResult,   setTestResult  ] = useState<{ success: boolean; message: string } | null>(null)

  // ── Section 4: Danger zone ─────────────────────────────────────────────────
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch {
      toast.error('Failed to copy — please copy manually')
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
      toast.success('Email identity saved')
    } catch {
      toast.error('Failed to save — please try again')
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
        body:    JSON.stringify({ nudgeTone, minDaysBetweenNudges: Number(minDaysBetweenNudges), blackoutWeekends }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Nudge preferences saved')
    } catch {
      toast.error('Failed to save — please try again')
    } finally {
      setPrefsSaving(false)
    }
  }

  const runTest = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/webhook/test', { method: 'POST' })
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
      setResetConfirm(false)
      toast.success('Settings reset to defaults')
    } catch {
      toast.error('Reset failed — please try again')
    } finally {
      setResetLoading(false)
    }
  }

  const toneDescription = TONES.find(t => t.value === nudgeTone)?.description ?? ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Section 1: Email Identity ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Email Identity</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">How you appear in nudge emails sent to students</p>
        </div>

        <div>
          <label className={labelCls}>Sender name</label>
          <input
            type="text"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder="Jane Smith"
            className={inputCls}
          />
          <p className={hintCls}>Your name as it appears in nudge emails</p>
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
          <p className={hintCls}>Students who reply will reach this address</p>
        </div>

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

        <div className="flex justify-end pt-2">
          <button onClick={saveIdentity} disabled={identitySaving} className={saveBtnCls}>
            {identitySaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

      {/* ── Section 2: Nudge Preferences ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Nudge Preferences</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Control how and when nudges are sent</p>
        </div>

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
          {toneDescription && (
            <p className={hintCls}>{toneDescription}</p>
          )}
        </div>

        <div>
          <label className={labelCls}>Minimum days between nudges</label>
          <input
            type="number"
            min={1}
            max={30}
            value={minDaysBetweenNudges}
            onChange={e => setMinDaysBetweenNudges(Number(e.target.value))}
            className={cn(inputCls, 'w-24')}
          />
          <p className={hintCls}>
            Persist won't send more than one nudge per student within this window
          </p>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="blackout"
            type="checkbox"
            checked={blackoutWeekends}
            onChange={e => setBlackoutWeekends(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#E5E7EB] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Webhook Setup</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Paste this URL into Zapier, Make, or your course platform's webhook settings.
            Send a POST request whenever a student completes a lesson.
          </p>
        </div>

        {/* Webhook URL */}
        <div>
          <label className={labelCls}>Webhook URL</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={webhookUrl}
              className={cn(inputCls, 'flex-1 font-mono text-xs')}
            />
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
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Test your webhook →
          </button>
        </div>
      </div>

      {/* ── Section 4: Danger Zone ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-4"
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
                testResult.success
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
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
              <button
                onClick={runTest}
                disabled={testLoading}
                className={saveBtnCls}
              >
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
