'use client'

import { motion } from "framer-motion"

interface AnimatedProgressBarProps {
  value: number    // 0-100
  className?: string
}

export function AnimatedProgressBar({ value, className }: AnimatedProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100)

  // Emerald ≥80% (near-complete), indigo 20-79% (in-progress), gray <20% (new)
  const color =
    clamped >= 80 ? '#10B981' :
    clamped >= 20 ? '#4F46E5' :
                    '#9CA3AF'

  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6] ${className ?? ''}`}>
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      />
    </div>
  )
}
