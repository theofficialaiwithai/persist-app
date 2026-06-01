'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Send, Sparkles, AlertCircle, RotateCcw } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  studentId:   string
  studentName: string
  onClose:     () => void
}

type Step = 'generating' | 'preview' | 'sending' | 'error'

interface Preview {
  subject:         string
  body:            string
  studentName:     string
  courseName:      string
  progressPct:     number
  hasToneExamples: boolean
}

export function NudgePreviewModal({ studentId, studentName, onClose }: Props) {
  const router = useRouter()

  const [step,      setStep     ] = useState<Step>('generating')
  const [preview,   setPreview  ] = useState<Preview | null>(null)
  const [subject,   setSubject  ] = useState('')
  const [body,      setBody     ] = useState('')
  const [errorMsg,  setErrorMsg ] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Generate preview on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        const res = await fetch('/api/nudge/generate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ studentId }),
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(data.error ?? 'Generation failed')

        setPreview(data)
        setSubject(data.subject)
        setBody(data.body)
        setStep('preview')
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong generating the preview.')
        setStep('error')
      }
    }
    generate()
    return () => { cancelled = true }
  }, [studentId])

  // ── Send handler ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setStep('sending')
    try {
      const res = await fetch('/api/nudge/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, subject: subject.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Email delivery failed — check your Resend API key in Settings.')
        setStep('error')
        return
      }
      showToast.nudgeSent(studentName)
      onClose()
      router.refresh()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error — could not reach the server.')
      setStep('error')
    }
  }

  // ── Retry: re-generate ────────────────────────────────────────────────────
  async function handleRegenerate() {
    setStep('generating')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/nudge/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setPreview(data)
      setSubject(data.subject)
      setBody(data.body)
      setStep('preview')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('error')
    }
  }

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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Preview nudge</h2>
              {preview && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  To: {preview.studentName} · {preview.courseName} · {preview.progressPct}%
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* ── Generating state ── */}
            {step === 'generating' && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 bg-[#E8F4F0] rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#004643] animate-pulse" />
                </div>
                <p className="text-sm font-medium text-[#111827]">Drafting your nudge…</p>
                <p className="text-xs text-[#9CA3AF] text-center max-w-xs">
                  Claude is writing a personalized message based on {studentName}&apos;s progress.
                </p>
              </div>
            )}

            {/* ── Preview / edit state ── */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Tone badge */}
                {preview?.hasToneExamples && (
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#5A8F47] bg-[#F0F7EE] border border-[#B8D9CE] rounded-full px-3 py-1 w-fit">
                    <Sparkles className="w-3 h-3" />
                    Adapted to your writing style
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Subject line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004643]/20 focus:border-[#004643] transition-colors text-[#111827]"
                  />
                </div>

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
                    rows={9}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004643]/20 focus:border-[#004643] transition-colors resize-none text-[#374151] leading-relaxed font-[inherit]"
                  />
                </div>

                {/* Hint */}
                <p className="text-[11px] text-[#9CA3AF]">
                  ✨ AI-generated — edit freely before sending. Changes you make help train future nudges to your style.
                </p>
              </div>
            )}

            {/* ── Sending state ── */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-[#004643] animate-spin" />
                <p className="text-sm font-medium text-[#111827]">Sending nudge…</p>
              </div>
            )}

            {/* ── Error state ── */}
            {step === 'error' && (
              <div className="py-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Send failed</p>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (preview) {
                      setStep('preview')
                      setErrorMsg(null)
                    } else {
                      handleRegenerate()
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#004643] border border-[#004643] rounded-xl hover:bg-[#E8F4F0] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {preview ? 'Back to preview' : 'Try again'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === 'preview') && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#E4572E] hover:bg-[#CC4A23] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Send nudge
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
