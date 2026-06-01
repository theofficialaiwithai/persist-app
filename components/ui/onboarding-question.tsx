'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  emoji: string
  description?: string
}

interface OnboardingQuestionProps {
  question: string
  subtitle?: string
  options: Option[]
  selected: string | string[]
  multiSelect?: boolean
  onSelect: (value: string) => void
  onContinue: () => void
  step: number
  totalSteps: number
}

export function OnboardingQuestion({
  question,
  subtitle,
  options,
  selected,
  multiSelect,
  onSelect,
  onContinue,
  step,
  totalSteps,
}: OnboardingQuestionProps) {
  const isSelected = (val: string) =>
    multiSelect ? (selected as string[]).includes(val) : selected === val

  const canContinue = multiSelect
    ? (selected as string[]).length > 0
    : !!selected

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#F3F4F6]">
        <motion.div
          className="h-full bg-[#E4572E] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <h1 className="text-2xl font-bold text-[#111827] text-center mb-2">{question}</h1>
          {subtitle && (
            <p className="text-[#6B7280] text-center text-sm mb-8">{subtitle}</p>
          )}

          <div className="space-y-3 mt-6">
            {options.map((opt) => (
              <motion.button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200',
                  isSelected(opt.value)
                    ? 'border-[#004643] bg-[#004643]/5'
                    : 'border-[#E5E7EB] bg-white hover:border-[#004643]/30 hover:bg-[#F9FAFB]',
                )}
              >
                <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium',
                      isSelected(opt.value) ? 'text-[#004643]' : 'text-[#111827]',
                    )}
                  >
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{opt.description}</p>
                  )}
                </div>
                {isSelected(opt.value) && (
                  <div className="w-6 h-6 rounded-full bg-[#E4572E] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom action */}
      <div className="flex items-center justify-end px-8 py-6 border-t border-[#F3F4F6]">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#9CA3AF] hidden sm:block">or press Enter</span>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              'px-6 py-3 rounded-xl font-semibold text-sm transition-all',
              canContinue
                ? 'bg-[#E4572E] text-white hover:bg-[#CC4A23] shadow-lg shadow-[#E4572E]/25'
                : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed',
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
