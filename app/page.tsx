'use client'

import { motion } from 'framer-motion'
import { Zap, Brain, Mail, Check } from 'lucide-react'
import { PersistHero }    from '@/components/ui/persist-hero'
import { MarqueeBand }    from '@/components/ui/marquee-band'
import { SplitHeadline }  from '@/components/ui/split-headline'

// ── Small reusable pieces ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-widest text-indigo-600 text-center uppercase">
      {children}
    </p>
  )
}

function SectionHeading({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={`text-4xl font-bold text-[#111827] text-center mt-3 leading-tight ${className}`}>
      {children}
    </h2>
  )
}

// ── Feature: progress zone mockup ─────────────────────────────────────────────

function ProgressZoneMockup() {
  return (
    <div className="bg-[#F7F4EE] rounded-2xl p-8 border border-[#E8E4DC]">
      <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-6">
        Student progress zones
      </p>

      {/* Safe zone */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#6B7280]">Safe zone</span>
          <span className="text-[#9CA3AF] font-medium">18%</span>
        </div>
        <div className="h-2.5 bg-[#E8E4DC] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: '18%' }} />
        </div>
      </div>

      {/* At risk — highlighted */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-amber-700 font-semibold">⚠️ High-risk zone</span>
          <span className="text-amber-600 font-semibold">45%</span>
        </div>
        <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 text-white" />
          </span>
          <p className="text-xs text-amber-700 font-medium">Nudge sent automatically</p>
        </div>
      </div>

      {/* Almost done */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#6B7280]">🔥 Almost done!</span>
          <span className="text-[#9CA3AF] font-medium">87%</span>
        </div>
        <div className="h-2.5 bg-[#E8E4DC] rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '87%' }} />
        </div>
      </div>
    </div>
  )
}

// ── Feature: voice profile mockup ─────────────────────────────────────────────

function VoiceProfileMockup() {
  const tags = ['conversational', 'warm', 'direct', 'story-driven']

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E8E4DC] shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">
          YO
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111827]">Your writing style</p>
          <p className="text-xs text-[#9CA3AF]">Matched from your email history</p>
        </div>
      </div>

      <div className="h-px bg-[#E8E4DC] my-5" />

      <p className="text-xs font-bold tracking-widest text-[#9CA3AF] uppercase mb-3">
        Detected traits
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full text-sm font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="bg-[#F7F4EE] rounded-xl p-4">
        <p className="text-xs text-[#9CA3AF] mb-2 font-medium">Your typical sign-off</p>
        <p className="text-sm text-[#374151] italic leading-relaxed">
          &ldquo;You&apos;ve got this. I&apos;m rooting for you. ✊&rdquo;
        </p>
        <p className="text-xs text-indigo-600 font-medium mt-2">— written in your voice by Persist</p>
      </div>
    </div>
  )
}

// ── Testimonial card ──────────────────────────────────────────────────────────

function TestimonialCard({
  quote,
  name,
  role,
  initials,
}: {
  quote: string
  name: string
  role: string
  initials: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DC] p-8 flex flex-col gap-5">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      <p className="text-[#374151] italic text-base leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-[#F3F4F6]">
        <div className="w-10 h-10 rounded-full bg-[#F7F4EE] text-[#6B7280] font-bold text-sm flex items-center justify-center shrink-0 border border-[#E8E4DC]">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111827]">{name}</p>
          <p className="text-xs text-[#6B7280]">{role}</p>
        </div>
      </div>
    </div>
  )
}

// ── Pricing feature list item ─────────────────────────────────────────────────

function PricingFeature({
  children,
  light = false,
}: {
  children: React.ReactNode
  light?: boolean
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${light ? 'text-emerald-400' : 'text-emerald-500'}`} />
      <span className={`text-sm ${light ? 'text-white/80' : 'text-[#374151]'}`}>{children}</span>
    </li>
  )
}

// ── Smooth scroll helper ──────────────────────────────────────────────────────

function smoothScrollTo(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return
  const targetPosition = element.getBoundingClientRect().top + window.scrollY - 80
  const startPosition = window.scrollY
  const distance = targetPosition - startPosition
  const duration = 1200 // ms — tweak for speed
  let startTime: number | null = null

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    // Cubic ease-in-out
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    window.scrollTo(0, startPosition + distance * ease)
    if (timeElapsed < duration) requestAnimationFrame(animation)
  }

  requestAnimationFrame(animation)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <PersistHero />

      {/* Marquee band 1 — coral, left-to-right */}
      <MarqueeBand />

      {/* ─────────────────────────────────────────────────── PROBLEM ── */}
      <section id="problem" className="bg-white py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The problem</SectionLabel>
          <SplitHeadline
            text="Most students don't finish. You already knew that."
            className="text-4xl font-bold text-[#111827] text-center mt-3 leading-tight max-w-2xl mx-auto"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-14">
            {[
              { value: '58M', unit: '+', color: 'text-red-500',     label: 'online course creators worldwide, all facing the same completion crisis'       },
              { value: '3',   unit: '–15%', color: 'text-amber-500',   label: 'average completion rate for online courses — the industry-wide dirty secret' },
              { value: '2',   unit: '×', color: 'text-emerald-500', label: 'higher completion with timely, personal nudges — proven across cohorts'         },
            ].map(({ value, unit, color, label }, i) => (
              <motion.div
                key={value}
                className="bg-[#F7F4EE] rounded-2xl p-8 text-center border border-[#E8E4DC]"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: [0.8, 1.05, 1], opacity: [0, 1, 1] }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
              >
                <p className={`text-6xl font-bold leading-none ${color}`}>
                  {value}<span className="text-4xl">{unit}</span>
                </p>
                <p className="text-[#6B7280] text-sm mt-3 leading-relaxed">{label}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-[#9CA3AF] mt-4">
            Sources: MIT OpenCourseWare, Research.com, Coursera Impact Report 2024
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────── WHO IS PERSIST FOR? ── */}
      <section className="py-20 bg-[#004643] text-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#7FB069] text-xs font-bold tracking-widest uppercase text-center mb-3">
            TWO PATHS. ONE MISSION.
          </p>
          <h2 className="text-4xl font-bold text-center mb-12">
            Persist works for everyone who&apos;s tired of quitting
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learner card */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="text-xl font-bold text-white mb-2">Independent Learners</h3>
              <p className="text-white/70 text-sm mb-6">
                You bought a course, started strong, then life got in the way. Persist gives you
                a community, streaks, and accountability sprints to actually finish.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  'Track your progress across courses',
                  'Join learning sprints with others',
                  'Get daily AI learning recaps',
                  'Build streaks. Celebrate completions.',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-white/80">
                    <span className="text-[#7FB069] shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { window.location.href = '/sign-up' }}
                className="mt-6 w-full bg-[#7FB069] hover:bg-[#6A9A55] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Start learning →
              </button>
            </div>

            {/* Creator card */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-xl font-bold text-white mb-2">Course Creators</h3>
              <p className="text-white/70 text-sm mb-6">
                Your students are dropping off at 45%. Persist connects to your course platform
                and sends personalized AI nudges in your voice — automatically, while you sleep.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  ['Connect via Zapier in 5 minutes',   '#E4572E'],
                  ['AI nudges written in your voice',    '#E4572E'],
                  ['Cron job runs every 4 hours',        '#E4572E'],
                  ['2× average completion rates',        '#E4572E'],
                ].map(([item, color]) => (
                  <li key={item} className="flex items-center gap-2 text-white/80">
                    <span className="shrink-0" style={{ color }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { window.location.href = '/sign-up' }}
                className="mt-6 w-full bg-[#E4572E] hover:bg-[#CC4A23] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Retain your students →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[#F7F4EE] py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>How it works</SectionLabel>
          <SplitHeadline
            text="How Persist works"
            className="text-4xl font-bold text-[#111827] text-center mt-3 leading-tight"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-14">
            {[
              {
                num: '01',
                Icon: Zap,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                title: 'Connect your platform',
                text: "Paste one webhook URL into Teachable, Kajabi, Thinkific, or Zapier. Done. Persist starts watching every student's progress in real time.",
              },
              {
                num: '02',
                Icon: Brain,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                title: 'AI learns your voice',
                text: 'Set your sender name and tone. Persist uses Claude AI to write emails that sound like you — your warmth, your encouragement, your sign-off style.',
              },
              {
                num: '03',
                Icon: Mail,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                title: 'Nudges go out automatically',
                text: "When a student goes quiet in a high-risk zone, a personalized email lands in their inbox. You didn't lift a finger.",
              },
            ].map(({ num, Icon, color, bg, title, text }) => (
              <div
                key={num}
                className="bg-white rounded-2xl p-8 shadow-sm border border-[#E8E4DC] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <p className="text-3xl font-bold text-indigo-100 mb-4">{num}</p>
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── FEATURES ── */}
      <section id="features" className="bg-white py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-24">

          {/* Row 1 — text left, mockup right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
                Smart detection
              </p>
              <h3 className="text-3xl font-bold text-[#111827] leading-tight">
                Knows exactly when to reach out
              </h3>
              <p className="text-[#6B7280] mt-4 leading-relaxed">
                Persist identifies the exact high-risk zones in your course — the 20–50% range where
                dropout rates spike. When a student goes quiet there, it acts immediately.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Configurable inactivity thresholds',
                  'Blackout weekends to avoid intrusive timing',
                  'Never sends two nudges too close together',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <ProgressZoneMockup />
          </div>

          {/* Row 2 — mockup left, text right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <VoiceProfileMockup />
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
                Voice matching
              </p>
              <h3 className="text-3xl font-bold text-[#111827] leading-tight">
                Emails that sound like you wrote them
              </h3>
              <p className="text-[#6B7280] mt-4 leading-relaxed">
                Students can tell the difference between a generic blast and a message that actually
                came from their instructor. Persist uses Claude AI to analyze your tone and write
                in your voice.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Encouraging, professional, or conversational tones',
                  "Personalized with the student's name and progress",
                  'Your sign-off style, preserved faithfully',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee band 2 — dark green, right-to-left (platform names) */}
      <MarqueeBand
        items={['TEACHABLE', 'KAJABI', 'THINKIFIC', 'PODIA', 'GUMROAD', 'ZAPIER', 'RESEND', 'CLAUDE AI', 'VERCEL']}
        bg="#004643"
        borderColor="#003533"
        textColor="#7FB069"
        diamond="◆"
        diamondClass="opacity-40"
        direction="right"
        duration={25}
      />

      {/* ────────────────────────────────────────────── TESTIMONIALS ── */}
      <section className="bg-[#F7F4EE] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Loved by creators</SectionLabel>
          <SectionHeading>
            Trusted by course creators
            <br />
            who care about completion
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            <TestimonialCard
              quote="I spent every launch weekend manually emailing students who went quiet. Persist does it automatically and the emails actually sound like me. My VA was shocked."
              name="Sarah K."
              role="Notion for Creators · $180K/year"
              initials="SK"
            />
            <TestimonialCard
              quote="My completion rate went from 23% to 61% in one cohort. I changed nothing except adding Persist. My students started referring friends. It was wild."
              name="Marcus T."
              role="The Freelance OS · $95K/year"
              initials="MT"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { value: '3.2×',   label: 'avg. completion rate lift'   },
              { value: '<5 min', label: 'setup time, no code needed'  },
              { value: '94%',    label: 'of nudges opened within 24h' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#E8E4DC] p-6 text-center">
                <p className="text-3xl font-bold text-[#111827]">{value}</p>
                <p className="text-sm text-[#6B7280] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────── AUTOMATION TIMELINE ── */}
      <section className="py-20 bg-[#FBFEF9]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#E4572E] text-xs font-bold tracking-widest uppercase text-center mb-3">
            THE AUTOMATION
          </p>
          <h2 className="text-4xl font-bold text-[#1A2E2D] text-center mb-4">
            Set it up once. It runs forever.
          </h2>
          <p className="text-[#6B7C7B] text-center mb-12 max-w-xl mx-auto">
            After a 5-minute Zapier setup, Persist runs on its own. Here&apos;s what happens
            without you lifting a finger:
          </p>

          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#E2EDEC]" />

            {[
              { time: 'Student completes a lesson', icon: '📚', color: '#7FB069', desc: "Zapier sends a progress event to Persist. Your student's completion percentage updates in real time." },
              { time: 'Every 4 hours',              icon: '⏰', color: '#E4572E', desc: "Persist's cron job scans all students. Anyone in a high-risk dropout zone (20–35%, 45–65%, 80–95%) who's been quiet gets flagged." },
              { time: 'Nudge is generated',         icon: '🤖', color: '#004643', desc: 'Claude reads your past emails and writes a personalized re-engagement message in your exact voice. Under 150 words. Warm, not pushy.' },
              { time: '7am next morning',           icon: '📬', color: '#7FB069', desc: 'Resend delivers the nudge from your email address. Your student sees your name in their inbox. You were asleep when it sent.' },
              { time: 'You wake up',                icon: '☀️', color: '#E4572E', desc: "Dashboard shows 3 nudges sent overnight. One student just resumed their course. You didn't do anything." },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-6 mb-8 relative pl-14"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
              >
                {/* Circle icon */}
                <div
                  className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white border-2 z-10"
                  style={{ borderColor: item.color }}
                >
                  {item.icon}
                </div>
                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl border border-[#E2EDEC] p-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>
                    {item.time}
                  </p>
                  <p className="text-sm text-[#1A2E2D] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── PRICING ── */}
      <section id="pricing" className="bg-white py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <SplitHeadline
            text="Simple pricing. No surprises."
            className="text-4xl font-bold text-[#111827] text-center mt-3 leading-tight"
          />
          <p className="text-center text-[#6B7280] mt-4 max-w-md mx-auto">
            Pay for what you use. Cancel anytime. 14-day free trial included.
          </p>
          {/* Scroll hint — desktop only, disappears once user interacts */}
          <motion.div
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="hidden md:flex items-center justify-center gap-1 mt-2 text-xs text-[#9CA3AF]"
          >
            Scroll to compare →
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 items-start">

            {/* Core */}
            <div className="bg-[#F7F4EE] rounded-2xl p-8 border border-[#E8E4DC] hover:border-[#C8C4BC] transition-colors duration-200">
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide">Core</p>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-5xl font-bold text-[#111827]">$29</span>
                <span className="text-[#6B7280] mb-2">/month</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Less than one hour of agency time</p>
              <p className="text-sm text-[#6B7280] mt-2 mb-8">
                Up to 50 students · Perfect for solo creators
              </p>
              <ul className="space-y-3">
                <PricingFeature>Up to 50 active students</PricingFeature>
                <PricingFeature>AI nudge emails in your voice</PricingFeature>
                <PricingFeature>Inactivity detection &amp; alerts</PricingFeature>
                <PricingFeature>Learning streak tracking 🔥</PricingFeature>
                <PricingFeature>Webhook integration (any platform)</PricingFeature>
              </ul>
              <button
                onClick={() => { window.location.href = '/sign-up' }}
                className="mt-8 w-full py-3 rounded-xl border-2 border-[#111827] text-[#111827] font-semibold text-sm hover:bg-[#111827] hover:text-white transition-all duration-200"
              >
                Get started →
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#111827] rounded-2xl p-8 relative">
              {/* Popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>

              <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">Pro</p>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-5xl font-bold text-white">$59</span>
                <span className="text-white/50 mb-2">/month</span>
              </div>
              <p className="text-xs text-emerald-400 font-medium mt-1">Less than one copywriter day</p>
              <p className="text-sm text-white/50 mt-2 mb-8">
                Up to 500 students · For growing creators
              </p>
              <ul className="space-y-3">
                <PricingFeature light>Everything in Core</PricingFeature>
                <PricingFeature light>Up to 500 active students</PricingFeature>
                <PricingFeature light>Daily learning recap emails</PricingFeature>
                <PricingFeature light>Advanced nudge tone controls</PricingFeature>
                <PricingFeature light>Priority email support</PricingFeature>
              </ul>
              <button
                onClick={() => { window.location.href = '/sign-up' }}
                className="mt-8 w-full py-3 rounded-xl bg-white text-[#111827] font-semibold text-sm hover:bg-[#F7F4EE] transition-colors"
              >
                Get started →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── FINAL CTA ── */}
      <section className="relative bg-[#111827] py-24 px-6 text-center overflow-hidden">
        {/* Subtle blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-indigo-900/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Your next cohort deserves better.
          </h2>
          <p className="text-xl text-[#9CA3AF] mt-3">Set up in 5 minutes.</p>
          <button
            onClick={() => { window.location.href = '/sign-up' }}
            className="mt-8 bg-white text-[#111827] px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#F7F4EE] transition-colors"
          >
            Start for free →
          </button>
          <p className="mt-4 text-sm text-[#6B7280]">
            No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── FOOTER ── */}
      <footer className="bg-[#111827] text-[#9CA3AF] py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-xl font-bold text-white">Persist</p>
              <p className="text-sm mt-1">AI-powered student retention</p>
            </div>
            <nav className="flex flex-wrap gap-6">
              <a href="/dashboard" className="text-sm hover:text-white transition-colors">Dashboard</a>
              <a href="/sign-in"   className="text-sm hover:text-white transition-colors">Sign in</a>
              <a href="/sign-up"   className="text-sm hover:text-white transition-colors">Sign up</a>
            </nav>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <span className="text-xs">Built with</span>
              <span className="text-xs font-semibold text-white">Claude AI</span>
              <span className="text-sm">✦</span>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#6B7280]">© 2025 Persist. All rights reserved.</p>
            <p className="text-xs text-[#6B7280]">Helping course creators turn dropouts into completions.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
