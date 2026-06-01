'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { Insight, InsightsResponse } from '@/app/api/insights/generate/route'

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function cacheKey(creatorId: string) {
  return `persist-insights-${creatorId}`
}

function readCache(creatorId: string): InsightsResponse | null {
  try {
    const raw = localStorage.getItem(cacheKey(creatorId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as InsightsResponse & { cachedAt: number }
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(creatorId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(creatorId: string, data: InsightsResponse) {
  try {
    localStorage.setItem(cacheKey(creatorId), JSON.stringify({ ...data, cachedAt: Date.now() }))
  } catch { /* quota — ignore */ }
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  risk: {
    badge:  '⚠️ Risk',
    bg:     'bg-[#664147]/10',
    border: 'border-[#664147]/20',
    color:  '#664147',
    badgeCls: 'bg-[#664147]/10 text-[#664147] border-[#664147]/25',
  },
  opportunity: {
    badge:  '💡 Opportunity',
    bg:     'bg-[#004643]/10',
    border: 'border-[#004643]/20',
    color:  '#004643',
    badgeCls: 'bg-[#004643]/10 text-[#004643] border-[#004643]/25',
  },
  win: {
    badge:  '🏆 Win',
    bg:     'bg-[#7FB069]/10',
    border: 'border-[#7FB069]/20',
    color:  '#7FB069',
    badgeCls: 'bg-[#7FB069]/10 text-[#5A8F47] border-[#7FB069]/25',
  },
} as const

// ── Skeleton ──────────────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-[#E5E7EB] rounded-full" />
      <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
      <div className="h-3 w-20 bg-[#E5E7EB] rounded-full" />
      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full bg-[#E5E7EB] rounded" />
        <div className="h-3 w-4/5 bg-[#E5E7EB] rounded" />
      </div>
      <div className="h-3 w-3/4 bg-[#E5E7EB] rounded" />
    </div>
  )
}

// ── Single insight card ───────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.opportunity

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className={`rounded-xl border p-4 flex flex-col gap-2 ${cfg.bg} ${cfg.border}`}
    >
      {/* Badge */}
      <span className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeCls}`}>
        {cfg.badge}
      </span>

      {/* Metric */}
      <div>
        <p className="text-3xl font-bold leading-none" style={{ color: cfg.color }}>
          {insight.metric}
        </p>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mt-0.5">
          {insight.metricLabel}
        </p>
      </div>

      {/* Insight text */}
      <p className="text-sm font-medium text-[#1A2E2D] leading-snug flex-1">
        {insight.insight}
      </p>

      {/* Action */}
      <p className="text-xs text-[#6B7C7B] italic leading-snug">
        → {insight.action}
      </p>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface InsightsCardProps {
  /** Passed from the server so we can namespace the localStorage cache per creator */
  creatorId: string
}

export function InsightsCard({ creatorId }: InsightsCardProps) {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetchInsights = useCallback(async (bypassCache = false) => {
    setLoading(true)
    setError(null)

    if (!bypassCache) {
      const cached = readCache(creatorId)
      if (cached) {
        setInsights(cached.insights)
        setGeneratedAt(cached.generatedAt)
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/insights/generate', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate insights')
      const data: InsightsResponse = await res.json()
      writeCache(creatorId, data)
      setInsights(data.insights)
      setGeneratedAt(data.generatedAt)
    } catch (err) {
      setError('Could not generate insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [creatorId])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  // Relative time label
  function sinceLabel(iso: string | null) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ago`
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <h2 className="text-base font-semibold text-[#111827]">AI Insights</h2>
          {loading && (
            <span className="text-xs text-[#9CA3AF] animate-pulse">Claude is analyzing your data…</span>
          )}
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#6B7C7B] hover:text-[#004643] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Refresh insights"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <p className="text-2xl mb-2">⚠️</p>
              <p className="text-sm text-[#6B7C7B]">{error}</p>
              <button
                onClick={() => fetchInsights(true)}
                className="mt-3 text-xs font-medium text-[#E4572E] hover:text-[#CC4A23] transition-colors"
              >
                Try again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {(insights ?? []).map((ins, i) => (
                <InsightCard key={i} insight={ins} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <span className="text-[10px] text-[#9CA3AF]">Powered by Claude AI</span>
        {generatedAt && !loading && (
          <span className="text-[10px] text-[#9CA3AF]">Generated {sinceLabel(generatedAt)}</span>
        )}
      </div>
    </div>
  )
}
