'use client'
import { motion } from 'framer-motion'

const DEFAULT_ITEMS = [
  'AUTOMATIC NUDGES',
  'AI VOICE MATCHING',
  'STUDENT RETENTION',
  'LEARNING STREAKS',
  '2× COMPLETION RATES',
  'RUNS WHILE YOU SLEEP',
]

interface MarqueeBandProps {
  items?:         string[]
  bg?:            string
  borderColor?:   string
  textColor?:     string
  diamond?:       string
  diamondClass?:  string
  direction?:     'left' | 'right'
  duration?:      number
}

export function MarqueeBand({
  items       = DEFAULT_ITEMS,
  bg          = '#E4572E',
  borderColor = '#CC4A23',
  textColor   = 'white',
  diamond     = '✦',
  diamondClass = 'opacity-40',
  direction   = 'left',
  duration    = 20,
}: MarqueeBandProps) {
  // Quadruple the items so the loop is seamless at any viewport width
  const repeated = [...items, ...items, ...items, ...items]
  const xFrom    = direction === 'left' ? '0%'   : '-50%'
  const xTo      = direction === 'left' ? '-50%' : '0%'

  return (
    <div
      className="py-3 overflow-hidden border-y"
      style={{ backgroundColor: bg, borderColor }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [xFrom, xTo] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className="flex-shrink-0 flex items-center gap-8 font-black text-sm uppercase tracking-widest"
            style={{ color: textColor }}
          >
            {item}
            <span className={`text-lg ${diamondClass}`}>{diamond}</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
