'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SplitHeadlineProps {
  text:       string
  className?: string
}

/**
 * Splits text into words and reveals each one with a sliding-up entrance,
 * triggered when the element enters the viewport (once: true).
 *
 * Usage:
 *   <SplitHeadline
 *     text="How Persist works"
 *     className="text-4xl font-bold text-[#111827] text-center mt-3 leading-tight"
 *   />
 */
export function SplitHeadline({ text, className }: SplitHeadlineProps) {
  const words = text.split(' ')

  return (
    // overflow-hidden clips the y: '110%' starting position
    <div className={cn('overflow-hidden', className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em] last:mr-0"
          initial={{ y: '110%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: i * 0.08,
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}
