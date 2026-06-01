'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Shared enter animation — each child gets an explicit delay for stagger
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
})

interface OnboardingCardProps {
  displayName: string
  onDisplayNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUploadClick: () => void
  onContinueClick: () => void
  isLoading?: boolean
  className?: string
}

export const OnboardingCard = React.forwardRef<HTMLDivElement, OnboardingCardProps>(
  ({ displayName, onDisplayNameChange, onUploadClick, onContinueClick, isLoading, className }, ref) => {
    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          className={cn(
            'w-full max-w-md overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl',
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Hero banner — indigo gradient */}
          <motion.div
            {...fadeUp(0)}
            className="h-48 w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative text-center text-white px-6">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-xl font-bold">Welcome to Persist</h2>
              <p className="text-indigo-200 text-sm mt-1">Your students are about to get a lot more support</p>
            </div>
          </motion.div>

          <div className="flex flex-col space-y-5 p-6 sm:p-8">
            {/* Title */}
            <motion.div {...fadeUp(0.1)} className="space-y-1 text-center">
              <h1 className="text-2xl font-bold text-[#111827]">Let&apos;s set up your account</h1>
              <p className="text-[#6B7280] text-sm">Takes less than 3 minutes.</p>
            </motion.div>

            {/* Photo upload */}
            <motion.div
              {...fadeUp(0.2)}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <UserCircle2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-[#111827] text-sm">Profile photo</p>
                  <p className="text-xs text-[#9CA3AF]">PNG or JPEG, up to 5MB</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onUploadClick} className="flex-shrink-0">
                <Camera className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </motion.div>

            {/* Display name */}
            <motion.div {...fadeUp(0.3)} className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-sm font-medium text-[#111827]">
                Your name{' '}
                <span className="text-[#9CA3AF] font-normal">(appears in nudge emails)</span>
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="e.g. Adamma"
                value={displayName}
                onChange={onDisplayNameChange}
                className="h-11"
              />
            </motion.div>

            {/* Continue */}
            <motion.div {...fadeUp(0.4)}>
              <Button
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                size="lg"
                onClick={onContinueClick}
                disabled={isLoading || !displayName.trim()}
              >
                {isLoading ? 'Saving...' : 'Continue →'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  },
)
OnboardingCard.displayName = 'OnboardingCard'
