'use client'

import confetti from 'canvas-confetti'
import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface CompletionCelebrationProps {
  studentName: string
  courseName: string
  studentId: string
  onDismiss: () => void
}

const COLORS = {
  primary: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
  left:    ['#4F46E5', '#10B981', '#F59E0B'],
  right:   ['#EC4899', '#8B5CF6', '#4F46E5'],
}

export function CompletionCelebration({
  studentName,
  courseName,
  studentId,
  onDismiss,
}: CompletionCelebrationProps) {
  const firstName = studentName.split(' ')[0]

  // Fires two bursts when the canvas element mounts
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const fire = confetti.create(canvas, { resize: true, useWorker: true })

    // First burst — centre
    fire({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: COLORS.primary,
    })

    // Second burst — left + right sides
    setTimeout(() => {
      fire({ particleCount: 80, spread: 100, origin: { y: 0.4, x: 0.2 }, colors: COLORS.left  })
      fire({ particleCount: 80, spread: 100, origin: { y: 0.4, x: 0.8 }, colors: COLORS.right })
    }, 400)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
      >
        {/* Confetti canvas — full screen, non-interactive */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 w-full h-full"
          style={{ zIndex: 51 }}
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-[52] w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Dismiss × */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header — indigo gradient */}
          <div className="bg-gradient-to-br from-[#004643] to-[#003533] px-8 pt-10 pb-8 text-center text-white">
            {/* Trophy */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4"
            >
              <Trophy className="w-10 h-10 text-yellow-300" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-[#B8D9CE] text-xs font-semibold uppercase tracking-widest mb-2">
                Course Complete
              </p>
              <h2 className="text-3xl font-bold mb-1">{firstName} did it! 🎉</h2>
              <p className="text-[#B8D9CE] text-sm">{studentName} just finished a course</p>
            </motion.div>
          </div>

          {/* Course name pill — overlaps header */}
          <div className="px-8 -mt-4 relative z-10">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0F7EE] rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-[#6A9A55]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">
                  Completed Course
                </p>
                <p className="font-semibold text-[#111827] text-sm mt-0.5 truncate">{courseName}</p>
              </div>
              <span className="bg-[#F0F7EE] text-[#5A8F47] border border-[#B8D9CE] text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                100% ✓
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-3">
            <p className="text-center text-[#6B7280] text-sm leading-relaxed">
              This is a big deal. {firstName} stayed consistent and crossed the finish line.
              Consider sending a personal note to celebrate.
            </p>

            <Link
              href={`/dashboard/students/${studentId}`}
              onClick={onDismiss}
              className="flex items-center justify-center gap-2 w-full bg-[#004643] text-white py-3 rounded-xl font-semibold hover:bg-[#003533] transition-colors text-sm"
            >
              View {firstName}&apos;s Profile
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={onDismiss}
              className="w-full border border-[#E5E7EB] text-[#6B7280] py-3 rounded-xl font-medium hover:bg-[#F7F8FA] transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
