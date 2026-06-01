'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// ── Step visuals ──────────────────────────────────────────────────────────────

function VisualWelcome() {
  return (
    <div className="w-full h-44 bg-gradient-to-br from-[#004643] via-[#005550] to-[#003533] rounded-lg flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-[#7FB069]/60" />
      <div className="absolute top-8 right-16 w-1.5 h-1.5 rounded-full bg-[#E4572E]/60" />
      <div className="absolute bottom-6 left-1/3 w-2 h-2 rounded-full bg-white/30" />
      <div className="absolute bottom-10 right-8 w-1 h-1 rounded-full bg-[#7FB069]/80" />
      <span className="text-5xl relative z-10">🎉</span>
      <span className="text-white text-2xl font-bold tracking-tight relative z-10">Persist</span>
    </div>
  )
}

function VisualDetection() {
  const students = [
    { name: 'James O.', pct: 28, days: '14d inactive', color: '#E4572E', bg: 'bg-[#FFF0EB]', dot: 'bg-[#E4572E]' },
    { name: 'Mei Chen',  pct: 52, days: 'Active today',  color: '#7FB069', bg: 'bg-[#F0F7EE]', dot: 'bg-[#7FB069]' },
    { name: 'Laura D.',  pct: 87, days: '8-day streak 🔥', color: '#004643', bg: 'bg-[#E8F4F0]', dot: 'bg-[#004643]' },
  ]
  return (
    <div className="w-full h-44 bg-[#F7F4EE] rounded-lg p-4 flex flex-col justify-center gap-2.5">
      {students.map(s => (
        <div key={s.name} className={cn('flex items-center gap-3 rounded-xl px-3 py-2', s.bg)}>
          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
          <span className="text-xs font-semibold text-[#111827] w-16 flex-shrink-0">{s.name}</span>
          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
          </div>
          <span className="text-[10px] text-[#6B7280] whitespace-nowrap">{s.days}</span>
        </div>
      ))}
    </div>
  )
}

function VisualNudge() {
  return (
    <div className="w-full h-44 bg-white rounded-lg border border-[#E8E4DC] p-4 flex flex-col gap-3">
      {/* Email header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#004643] to-[#003533] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
          AC
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#111827]">Adamma (via Persist)</p>
          <p className="text-[9px] text-[#9CA3AF]">to james@example.com</p>
        </div>
        <span className="text-[9px] text-[#9CA3AF]">9:07 AM</span>
      </div>
      <div className="h-px bg-[#E8E4DC]" />
      {/* Email body preview */}
      <div className="flex-1 space-y-1.5">
        <p className="text-xs font-semibold text-[#111827]">James, Module 4 is waiting for you 🎯</p>
        <p className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-3">
          Hey James, I noticed you've been away for two weeks — and you were making such great progress! You're at 28% and Module 4 is genuinely the most fun part of the course...
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#7FB069] flex items-center justify-center flex-shrink-0">
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path d="M1 3l1.5 1.5L5 1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[9px] font-medium text-[#7FB069]">Written by Claude AI in your voice</p>
      </div>
    </div>
  )
}

function VisualDashboard() {
  return (
    <div className="w-full h-44 bg-[#F7F8FA] rounded-lg p-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Students', value: '12', icon: '👩‍🎓', color: 'bg-[#E8F4F0]' },
          { label: 'Nudges',   value: '8',  icon: '📬', color: 'bg-[#FFF0EB]' },
          { label: 'Score',    value: '74', icon: '💪', color: 'bg-[#F0F7EE]' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-2.5 text-center', s.color)}>
            <span className="text-base">{s.icon}</span>
            <p className="text-sm font-bold text-[#111827] mt-0.5">{s.value}</p>
            <p className="text-[9px] text-[#6B7280]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs flex-shrink-0">⚠️</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#111827]">3 students need attention</p>
          <div className="h-1 w-full bg-[#F3F4F6] rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[#E4572E] rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step content ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    visual:      <VisualWelcome />,
    title:       'Welcome to Persist 🎉',
    description: "You're all set up. Persist is now connected to your course and ready to watch every student's progress in real time.",
  },
  {
    visual:      <VisualDetection />,
    title:       'Knows exactly when to reach out',
    description: 'Persist identifies at-risk students the moment they go quiet — before they disappear. No manual checking required.',
  },
  {
    visual:      <VisualNudge />,
    title:       'AI nudges, written in your voice',
    description: 'Claude reads your tone preferences and writes re-engagement emails that sound exactly like you. Your students will think you wrote every word.',
  },
  {
    visual:      <VisualDashboard />,
    title:       'Your dashboard is live',
    description: "Everything's here — who's at risk, who's on a streak, and which nudges went out. Check back any time.",
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  creatorId: string
}

export function WelcomeDialog({ creatorId }: Props) {
  const storageKey = `persist-welcome-seen-${creatorId}`

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        // Small delay so the dashboard renders first
        const t = setTimeout(() => setOpen(true), 900)
        return () => clearTimeout(t)
      }
    } catch { /* localStorage may be blocked in some browsers */ }
  }, [storageKey])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) dismiss()
  }

  function dismiss() {
    try { localStorage.setItem(storageKey, 'true') } catch { /* ignore */ }
    setOpen(false)
  }

  function handleNext() {
    if (step < STEPS.length) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  const current = STEPS[step - 1]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-0 overflow-hidden sm:max-w-[400px]"
      >
        {/* Visual */}
        <div className="p-2">
          {current.visual}
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#111827]">
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280] leading-relaxed">
              {current.description}
            </DialogDescription>
          </DialogHeader>

          {/* Step dots + actions */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            {/* Step dots */}
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i + 1 === step ? 'bg-[#004643]' : 'bg-[#004643]/20',
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 sm:justify-end">
              {step < STEPS.length ? (
                <>
                  <button
                    onClick={dismiss}
                    className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors rounded-lg hover:bg-[#F3F4F6]"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className="group flex items-center gap-1.5 px-4 py-1.5 bg-[#004643] hover:bg-[#003533] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Next
                    <ArrowRight
                      className="w-4 h-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </>
              ) : (
                <button
                  onClick={dismiss}
                  className="px-5 py-1.5 bg-[#004643] hover:bg-[#003533] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Go to dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
