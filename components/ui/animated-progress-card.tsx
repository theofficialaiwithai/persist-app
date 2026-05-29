import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedProgressCardProps {
  icon: React.ReactNode
  title: string
  progressLabel: string
  progressSubLabel: string
  currentValue: number
  maxValue: number
  className?: string
}

export const AnimatedProgressCard = React.forwardRef<
  HTMLDivElement,
  AnimatedProgressCardProps
>(
  (
    { icon, title, progressLabel, progressSubLabel, currentValue, maxValue, className },
    ref,
  ) => {
    const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0
    const clampedPercentage = Math.min(percentage, 100)

    return (
      <div
        ref={ref}
        className={cn("w-full rounded-xl border p-6 shadow-sm", className)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            {icon}
          </div>
          <p className="font-medium">{title}</p>
        </div>

        <div className="my-5">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={currentValue}
            aria-valuemin={0}
            aria-valuemax={maxValue}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${clampedPercentage}%` }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {progressLabel}
            </p>
            <p className="text-sm opacity-60">{progressSubLabel}</p>
          </div>
          <p className="text-2xl font-bold">
            {currentValue}
            <span className="text-lg font-medium opacity-80"> / {maxValue}</span>
          </p>
        </div>
      </div>
    )
  },
)
AnimatedProgressCard.displayName = "AnimatedProgressCard"
