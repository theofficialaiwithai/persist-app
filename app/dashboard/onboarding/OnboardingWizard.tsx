'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingCard } from '@/components/ui/onboarding-card'
import { OnboardingQuestion } from '@/components/ui/onboarding-question'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Copy, Eye, EyeOff, Loader2, FlaskConical, X, CheckCircle2 } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'teachable',  label: 'Teachable',       emoji: '📚', description: 'The most popular hosted course platform' },
  { value: 'kajabi',     label: 'Kajabi',           emoji: '🚀', description: 'All-in-one platform for creators'        },
  { value: 'thinkific',  label: 'Thinkific',        emoji: '💡', description: 'Flexible course creation'                },
  { value: 'podia',      label: 'Podia',            emoji: '🌟', description: 'Simple and clean'                        },
  { value: 'gumroad',    label: 'Gumroad',          emoji: '🛒', description: 'Sell digital products easily'           },
  { value: 'other',      label: 'Something else',   emoji: '🔧', description: 'Use Zapier to connect anything'         },
]

const TONES = [
  { value: 'encouraging',  label: 'Encouraging',  emoji: '🤗', description: 'Warm, supportive, and motivating'                 },
  { value: 'professional', label: 'Professional', emoji: '💼', description: 'Clear, respectful, and direct'                    },
  { value: 'urgent',       label: 'Urgent',       emoji: '⚡', description: 'Creates gentle urgency without guilt'             },
  { value: 'friendly',     label: 'Friendly',     emoji: '🙂', description: 'Casual, personal, like a friend checking in'     },
]

const FREQUENCIES = [
  { value: '3',  label: 'Every 3 days',    emoji: '🔔', description: 'Active courses, high engagement'     },
  { value: '5',  label: 'Every 5 days',    emoji: '📅', description: 'Recommended for most creators'       },
  { value: '7',  label: 'Once a week',     emoji: '🗓️', description: 'Relaxed, lower-pressure approach'   },
  { value: '14', label: 'Every two weeks', emoji: '🌙', description: 'Minimal, for self-paced courses'     },
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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialSenderName?: string
}

export function OnboardingWizard({ initialSenderName }: Props) {
  const router = useRouter()

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)

  // Step 1
  const [displayName,    setDisplayName   ] = useState(initialSenderName ?? '')
  const [photoDialogOpen,setPhotoDialogOpen] = useState(false)
  const [photoUrl,       setPhotoUrl      ] = useState('')
  const [photoSaving,    setPhotoSaving   ] = useState(false)

  // Steps 2-4
  const [platform,  setPlatform ] = useState('')
  const [tone,      setTone     ] = useState('')
  const [frequency, setFrequency] = useState('')
  const [saving,    setSaving   ] = useState(false)

  // Step 5
  const [webhookUrl,    setWebhookUrl   ] = useState<string | null>(null)
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null)
  const [showSecret,    setShowSecret   ] = useState(false)
  const [testOpen,      setTestOpen     ] = useState(false)
  const [testLoading,   setTestLoading  ] = useState(false)
  const [testResult,    setTestResult   ] = useState<{ success: boolean; message: string } | null>(null)

  // ── canContinue ─────────────────────────────────────────────────────────────
  const canContinue =
    step === 1 ? !!displayName.trim()           :
    step === 2 ? !!platform                     :
    step === 3 ? !!tone                         :
    step === 4 ? (!!frequency && !saving)       :
    /* step 5 */ true

  // ── handleContinue ──────────────────────────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!canContinue) return

    if (step < 4) {
      setStep(s => s + 1)
      return
    }

    if (step === 4) {
      setSaving(true)
      try {
        const res = await fetch('/api/creator/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderName:           displayName.trim(),
            coursePlatform:       platform,
            nudgeTone:            tone,
            minDaysBetweenNudges: parseInt(frequency),
          }),
        })
        if (!res.ok) throw new Error('Failed to save')
        const data = await res.json()
        setWebhookUrl(data.webhookUrl)
        setWebhookSecret(data.webhookSecret)
        setStep(5)
      } catch {
        showToast.error('Failed to save preferences. Please try again.')
      } finally {
        setSaving(false)
      }
      return
    }

    // Step 5 → go to dashboard
    router.push('/dashboard')
    router.refresh()
  }, [canContinue, step, displayName, platform, tone, frequency, router])

  // ── Enter key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canContinue) handleContinue()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canContinue, handleContinue])

  // ── Photo upload ─────────────────────────────────────────────────────────────
  const handlePhotoUpload = async () => {
    if (!photoUrl.trim()) return
    setPhotoSaving(true)
    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: photoUrl.trim() }),
      })
      if (!res.ok) throw new Error()
      showToast.saved('Profile photo updated')
      setPhotoDialogOpen(false)
      setPhotoUrl('')
    } catch {
      showToast.error('Failed to update photo')
    } finally {
      setPhotoSaving(false)
    }
  }

  // ── Webhook helpers ──────────────────────────────────────────────────────────
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast.copied(`${label} copied`)
    } catch {
      showToast.error('Failed to copy — please copy manually')
    }
  }

  const runTest = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res  = await fetch('/api/webhook/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.result?.success !== false) {
        setTestResult({ success: true,  message: 'Webhook test succeeded! A sample student has been created.' })
      } else {
        setTestResult({ success: false, message: data.result?.error ?? 'Webhook test failed' })
      }
    } catch {
      setTestResult({ success: false, message: 'Network error — please check your connection.' })
    } finally {
      setTestLoading(false)
    }
  }

  // ── Step 1: Welcome card ─────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <OnboardingCard
          displayName={displayName}
          onDisplayNameChange={e => setDisplayName(e.target.value)}
          onUploadClick={() => setPhotoDialogOpen(true)}
          onContinueClick={handleContinue}
          isLoading={false}
        />

        {/* Photo upload dialog */}
        <AnimatePresence>
          {photoDialogOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setPhotoDialogOpen(false)}
              />
              <motion.div
                className="relative bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-6 w-full max-w-sm space-y-4"
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1,    y:  0 }}
                exit={{    opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#111827]">Profile photo URL</h3>
                  <button
                    onClick={() => setPhotoDialogOpen(false)}
                    className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-[#6B7280]">Paste a public image URL (PNG or JPEG).</p>

                <input
                  type="url"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  autoFocus
                  className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex gap-3 justify-end pt-1">
                  <button
                    onClick={() => setPhotoDialogOpen(false)}
                    className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhotoUpload}
                    disabled={!photoUrl.trim() || photoSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {photoSaving ? 'Saving...' : 'Save photo'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Step 2: Platform ─────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <OnboardingQuestion
        question="What platform are your students on?"
        options={PLATFORMS}
        selected={platform}
        onSelect={setPlatform}
        onContinue={handleContinue}
        step={1}
        totalSteps={4}
      />
    )
  }

  // ── Step 3: Tone ─────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <OnboardingQuestion
        question="How should Persist sound when nudging students?"
        subtitle="Pick the tone that sounds most like you."
        options={TONES}
        selected={tone}
        onSelect={setTone}
        onContinue={handleContinue}
        step={2}
        totalSteps={4}
      />
    )
  }

  // ── Step 4: Frequency ─────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="relative">
        {/* Saving overlay */}
        <AnimatePresence>
          {saving && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                <p className="text-sm text-[#6B7280] font-medium">Setting up your account…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <OnboardingQuestion
          question="How often can Persist nudge each student?"
          subtitle="We won't nudge more often than this."
          options={FREQUENCIES}
          selected={frequency}
          onSelect={setFrequency}
          onContinue={handleContinue}
          step={3}
          totalSteps={4}
        />
      </div>
    )
  }

  // ── Step 5: Webhook setup (full-screen style) ─────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar — 100% */}
      <div className="w-full h-1.5 bg-[#F3F4F6]">
        <div className="h-full bg-indigo-600 rounded-full w-full" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-12">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mb-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827]">You&apos;re almost in!</h1>
            <p className="text-[#6B7280] text-sm max-w-sm mx-auto">
              Connect your course platform so Persist can track student progress automatically.
            </p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#111827]">Webhook URL</label>
            <p className="text-xs text-[#6B7280]">
              Paste this URL into Zapier, Make, or your course platform&apos;s webhook settings.
              Send a POST request whenever a student completes a lesson.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={webhookUrl ?? ''}
                className="flex-1 h-10 rounded-lg border border-[#E5E7EB] px-3 text-xs font-mono text-[#374151] bg-[#F9FAFB] focus:outline-none"
              />
              <button
                onClick={() => copy(webhookUrl ?? '', 'Webhook URL')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy URL
              </button>
            </div>
          </div>

          {/* Signing secret */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#111827]">Signing secret</label>
            <div className="flex gap-2">
              <input
                readOnly
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret ?? ''}
                className="flex-1 h-10 rounded-lg border border-[#E5E7EB] px-3 text-xs font-mono text-[#374151] bg-[#F9FAFB] focus:outline-none"
              />
              <button
                onClick={() => setShowSecret(s => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSecret ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={() => copy(webhookSecret ?? '', 'Signing secret')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F7F8FA] transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Include this as the{' '}
              <code className="font-mono bg-[#F7F8FA] px-1 rounded">x-persist-signature</code>{' '}
              header (HMAC-SHA256 of the raw body).
            </p>
          </div>

          {/* Expected payload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#111827]">Expected payload shape</label>
            <pre className="text-xs font-mono bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-4 overflow-x-auto text-[#374151] leading-relaxed">
              {EXAMPLE_PAYLOAD}
            </pre>
          </div>

          {/* Test webhook */}
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-[#6B7280]">Ready to test your integration?</p>
            <button
              onClick={() => { setTestOpen(true); setTestResult(null) }}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Test your webhook →
            </button>
          </div>

          {/* Skip hint */}
          <p className="text-xs text-center text-[#9CA3AF]">
            You can always set this up later in <strong className="font-medium">Settings → Webhook Setup</strong>
          </p>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-[#F3F4F6] px-8 py-6 flex items-center justify-end gap-4">
        <span className="text-sm text-[#9CA3AF] hidden sm:block">or press Enter</span>
        <button
          onClick={handleContinue}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition-all"
        >
          Go to dashboard →
        </button>
      </div>

      {/* Test Webhook Modal */}
      <AnimatePresence>
        {testOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTestOpen(false)} />
            <motion.div
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1    }}
              exit={{    opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#111827]">Test Webhook</h3>
                  <p className="text-sm text-[#6B7280] mt-0.5">
                    Sends a signed test event and creates a sample student.
                  </p>
                </div>
                <button
                  onClick={() => setTestOpen(false)}
                  className="text-[#6B7280] hover:text-[#111827] ml-4 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <pre className="text-xs font-mono bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3 overflow-x-auto text-[#374151]">
                {EXAMPLE_PAYLOAD}
              </pre>

              {testResult && (
                <div
                  className={cn(
                    'rounded-lg px-4 py-3 text-sm',
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700',
                  )}
                >
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {testLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send test event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
