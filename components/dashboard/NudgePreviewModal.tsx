'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Loader2, Send, Sparkles, AlertCircle, RotateCcw, Mail, MessageSquare,
} from 'lucide-react'
import { showToast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props {
  studentId:   string
  studentName: string
  onClose:     () => void
}

type Mode = 'email' | 'message'
type Step = 'idle' | 'generating' | 'preview' | 'sending' | 'error'

interface Preview {
  subject?:        string
  body:            string
  studentName:     string
  courseName:      string
  progressPct:     number
  hasToneExamples: boolean
}

// Per-mode draft cache so switching tabs doesn't re-call Claude
type DraftCache = Partial<Record<Mode, Preview>>

const EMOJIS = ['😍', '❤️', '🔥', '⚡', '👍'] as const

export function NudgePreviewModal({ studentId, studentName, onClose }: Props) {
  const router = useRouter()

  const [mode,     setMode    ] = useState<Mode>('email')
  const [step,     setStep    ] = useState<Step>('idle')
  const [preview,  setPreview ] = useState<Preview | null>(null)
  const [subject,  setSubject ] = useState('')
  const [body,     setBody    ] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Refs — don't trigger re-renders
  const cache    = useRef<DraftCache>({})          // generated drafts per mode
  const abortRef = useRef<AbortController | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Core generation function ─────────────────────────────────────────────────
  const generate = useCallback(async (targetMode: Mode, bust = false) => {
    // Use cache unless busting (Regenerate button)
    if (!bust && cache.current[targetMode]) {
      const cached = cache.current[targetMode]!
      setPreview(cached)
      setSubject(cached.subject ?? '')
      setBody(cached.body)
      setStep('preview')
      return
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setStep('generating')
    setErrorMsg(null)

    try {
      const res  = await fetch('/api/nudge/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, mode: targetMode }),
        signal:  abort.signal,
      })
      if (abort.signal.aborted) return

      const data = await res.json()
      if (abort.signal.aborted) return

      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      cache.current[targetMode] = data
      setPreview(data)
      setSubject(data.subject ?? '')
      setBody(data.body)
      setStep('preview')
    } catch (err: unknown) {
      if (abort.signal.aborted) return
      const msg = err instanceof Error ? err.message : 'Something went wrong generating the preview.'
      setErrorMsg(msg)
      setStep('error')
    }
  }, [studentId])

  // Kick off generation immediately on first render (idle → generating)
  const didInit = useRef(false)
  if (!didInit.current) {
    didInit.current = true
    // Schedule after mount — avoids calling setState during render
    setTimeout(() => generate('email'), 0)
  }

  // ── Mode switch ──────────────────────────────────────────────────────────────
  function switchMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    generate(next)
  }

  // ── Regenerate (busts cache for current mode) ────────────────────────────────
  function handleRegenerate() {
    generate(mode, true)
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!body.trim()) return
    setStep('sending')
    try {
      const res = await fetch('/api/nudge/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          studentId,
          subject: mode === 'email' ? subject.trim() : 'Message',
          body:    body.trim(),
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? (mode === 'email'
          ? 'Email delivery failed — check your Resend API key in Settings.'
          : 'Failed to send message.'))
        setStep('error')
        return
      }
      showToast.nudgeSent(studentName)
      onClose()
      router.refresh()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error.')
      setStep('error')
    }
  }

  // Cleanup abort on unmount
  // (Can't use useEffect for the abort since we're not using useEffect for generation)
  // Instead, onClose handles the unmount path naturally.

  const firstName = studentName.split(' ')[0]

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === overlayRef.current) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Send nudge</h2>
              {preview && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  To: {preview.studentName} · {preview.courseName} · {preview.progressPct}%
                </p>
              )}
            </div>
            <button
              onClick={() => { abortRef.current?.abort(); onClose() }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Mode toggle ── */}
          <div className="px-6 pt-4">
            <div className="flex rounded-xl border border-[#E5E7EB] p-1 gap-1 bg-[#F7F8FA]">
              {([
                { value: 'email'   as const, label: 'Email',   Icon: Mail          },
                { value: 'message' as const, label: 'Message', Icon: MessageSquare },
              ]).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => switchMode(value)}
                  disabled={step === 'sending'}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-medium transition-all',
                    mode === value
                      ? 'bg-white shadow-sm text-[#111827]'
                      : 'text-[#6B7280] hover:text-[#111827]',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5">

            {/* Generating */}
            {(step === 'idle' || step === 'generating') && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-[#004643] animate-spin" />
                <p className="text-sm font-medium text-[#111827]">
                  {mode === 'email' ? 'Drafting email…' : 'Writing message…'}
                </p>
                <p className="text-xs text-[#9CA3AF] text-center max-w-xs">
                  Claude is writing a personalised {mode === 'email' ? 'email' : 'message'} for {firstName}.
                </p>
              </div>
            )}

            {/* Preview / edit */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Tone badge */}
                {preview?.hasToneExamples && (
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#5A8F47] bg-[#F0F7EE] border border-[#B8D9CE] rounded-full px-3 py-1 w-fit">
                    <Sparkles className="w-3 h-3" />
                    Adapted to your writing style
                  </div>
                )}

                {/* Email: subject line */}
                {mode === 'email' && (
                  <div>
                    <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Subject line</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004643]/20 focus:border-[#004643] transition-colors text-[#111827]"
                    />
                  </div>
                )}

                {/* Message: student preview chip */}
                {mode === 'message' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                    <div className="w-7 h-7 rounded-full bg-[#E8F4F0] text-[#004643] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111827]">{studentName}</p>
                      <p className="text-[10px] text-[#9CA3AF]">will see this in their messages</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      {EMOJIS.map(e => <span key={e} className="text-sm opacity-25">{e}</span>)}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Message</label>
                    <button
                      onClick={handleRegenerate}
                      className="flex items-center gap-1 text-[10px] font-medium text-[#004643] hover:text-[#003533] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={mode === 'email' ? 9 : 5}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004643]/20 focus:border-[#004643] transition-colors resize-none text-[#374151] leading-relaxed font-[inherit]"
                  />
                </div>

                <p className="text-[11px] text-[#9CA3AF]">
                  {mode === 'email'
                    ? '✨ AI-generated — edit freely. Your edits train future nudges to your style.'
                    : '💬 Appears in the student\'s in-app messages with emoji reactions.'}
                </p>
              </div>
            )}

            {/* Sending */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-[#004643] animate-spin" />
                <p className="text-sm font-medium text-[#111827]">
                  {mode === 'email' ? 'Sending email…' : 'Sending message…'}
                </p>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="py-4 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      {mode === 'email' ? 'Send failed' : 'Message not sent'}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (preview) { setStep('preview'); setErrorMsg(null) }
                    else handleRegenerate()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#004643] border border-[#004643] rounded-xl hover:bg-[#E8F4F0] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {preview ? 'Back to preview' : 'Try again'}
                </button>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {step === 'preview' && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA]">
              <button
                onClick={() => { abortRef.current?.abort(); onClose() }}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!body.trim() || (mode === 'email' && !subject.trim())}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#E4572E] hover:bg-[#CC4A23] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {mode === 'email' ? 'Send email' : 'Send message'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
