'use client'
import React from 'react'
import { motion } from 'framer-motion'

// ── Decorative SVG arrows ────────────────────────────────────────────────────

const ArrowCoralLeft = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full text-[#E4572E] stroke-current overflow-visible"
    fill="none"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
)

const ArrowCoralRight = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full text-[#E4572E] stroke-current overflow-visible"
    fill="none"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
)

// ── Spinning circular CTA badge ──────────────────────────────────────────────

const CircularBadge = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="relative w-28 h-28 md:w-36 md:h-36 bg-[#E4572E] rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 transition-transform cursor-pointer border-[3px] border-white/20"
  >
    {/* Spinning text ring */}
    <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          id="circlePath"
          d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
          fill="none"
        />
        <text fill="white" fontSize="10" fontWeight="900" letterSpacing="3">
          <textPath href="#circlePath" startOffset="0%">
            START FOR FREE • START FOR FREE •
          </textPath>
        </text>
      </svg>
    </div>
    {/* Arrow icon */}
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className="w-8 h-8 text-white stroke-current"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7M17 7H7M17 7V17" />
      </svg>
    </div>
  </div>
)

// ── Student cards ────────────────────────────────────────────────────────────

function AtRiskCard() {
  return (
    <div className="w-52 md:w-60 bg-white/20 backdrop-blur-md border border-white/40 rounded-[2rem] p-5 shadow-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#7FB069] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          JO
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-tight">James Okonkwo</p>
          <p className="text-[10px] text-white/70">Build AI Products</p>
        </div>
      </div>
      <div className="bg-white/10 rounded-xl p-2.5">
        <div className="flex justify-between text-[10px] text-white/80 mb-1.5">
          <span>Progress</span>
          <span className="text-[#E4572E] font-bold">28% · 14d inactive</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-[28%] bg-[#E4572E] rounded-full" />
        </div>
      </div>
      <div className="mt-3 bg-[#E4572E] rounded-xl px-3 py-1.5 text-center">
        <p className="text-white text-[10px] font-bold">📬 Nudge sent automatically</p>
      </div>
    </div>
  )
}

function StreakCard() {
  return (
    <div className="w-52 md:w-60 bg-white/20 backdrop-blur-md border border-white/40 rounded-[2rem] p-5 shadow-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#004643] border-2 border-[#7FB069] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          DM
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-tight">Daniel Martin</p>
          <p className="text-[10px] text-white/70">🔥 12 day streak</p>
        </div>
      </div>
      <div className="bg-white/10 rounded-xl p-2.5">
        <div className="flex justify-between text-[10px] text-white/80 mb-1.5">
          <span>Course completion</span>
          <span className="text-[#7FB069] font-bold">100% ✓</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-full bg-[#7FB069] rounded-full" />
        </div>
      </div>
      <div className="mt-3 bg-[#7FB069] rounded-xl px-3 py-1.5 text-center">
        <p className="text-white text-[10px] font-bold">🏆 Course completed!</p>
      </div>
    </div>
  )
}

// ── Main hero component ──────────────────────────────────────────────────────

export function PersistHero() {
  const shadow3 = '3px 3px 0 #003533, 6px 6px 0 #003533'
  const shadowR = '3px 3px 0 #8A2A10'

  return (
    // FIX 1 — inline style guarantees #004643 regardless of any parent bg class
    <div
      className="relative flex flex-col font-sans selection:bg-[#E4572E] selection:text-white overflow-hidden w-full"
      style={{ backgroundColor: '#004643', minHeight: '100vh' }}
    >
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Decorative arrows — absolute to the full hero (desktop only) */}
      <div className="absolute bottom-[23%] left-4 md:left-16 w-16 h-16 md:w-24 md:h-24 z-20 hidden lg:block pointer-events-none">
        <ArrowCoralLeft />
      </div>
      <div className="absolute top-[22%] right-4 md:right-16 w-16 h-16 md:w-24 md:h-24 z-20 hidden lg:block pointer-events-none">
        <ArrowCoralRight />
      </div>

      {/* Spinning badge — bottom-right of dark section (desktop only) */}
      <div className="absolute bottom-[22%] right-4 md:right-20 z-40 hidden lg:block">
        <CircularBadge onClick={() => { window.location.href = '/sign-up' }} />
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-[#FBFEF9] text-[#004643] font-black text-sm px-4 py-1.5 rounded-2xl rounded-bl-sm shadow-sm relative">
            Persist
            <div
              className="absolute -bottom-1.5 left-0 w-3 h-3 bg-[#FBFEF9]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
          </div>
          <div className="bg-[#E4572E] text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            AI
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-2">
          {[
            ['How it works', '#how-it-works'],
            ['Features',     '#features'],
            ['Pricing',      '#pricing'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="px-4 py-1.5 rounded-full border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { window.location.href = '/sign-in' }}
            className="px-4 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => { window.location.href = '/sign-up' }}
            className="px-5 py-2 rounded-full border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Get started →
          </button>
        </div>
      </nav>

      {/* ── HERO MAIN ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center pt-6 pb-16 md:pt-10 md:pb-28 px-4">

        {/* FIX 3 — Three-column flex: [left card] [text] [right card] */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-4 w-full max-w-6xl mx-auto">

          {/* Left floating card (desktop only) */}
          <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ rotate: -8 }}
            >
              <AtRiskCard />
            </motion.div>
          </div>

          {/* Center: stacked typography + subtitle */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">

            {/* FIX 2 — Inline style clamp for guaranteed massive text */}
            <div className="w-full flex flex-col items-center space-y-1">

              {/* YOUR — left-aligned */}
              <div className="w-full flex justify-start">
                <h1
                  className="font-black uppercase text-[#7FB069] m-0 p-0 leading-[0.85] tracking-tighter"
                  style={{
                    fontFamily:  '"Arial Black", Impact, sans-serif',
                    fontSize:    'clamp(2.5rem, 9vw, 120px)',
                    textShadow:  shadow3,
                  }}
                >
                  YOUR
                </h1>
              </div>

              {/* STUDENTS — centred */}
              <div className="w-full flex justify-center">
                <h1
                  className="font-black uppercase text-white m-0 p-0 leading-[0.85] tracking-tighter"
                  style={{
                    fontFamily: '"Arial Black", Impact, sans-serif',
                    fontSize:   'clamp(3rem, 11vw, 160px)',
                    textShadow: shadow3,
                  }}
                >
                  STUDENTS
                </h1>
              </div>

              {/* WON'T QUIT. — right-aligned */}
              <div className="w-full flex justify-end">
                <h1
                  className="font-black uppercase text-[#E4572E] m-0 p-0 leading-[0.85] tracking-tighter"
                  style={{
                    fontFamily: '"Arial Black", Impact, sans-serif',
                    fontSize:   'clamp(2rem, 8vw, 110px)',
                    textShadow: shadowR,
                  }}
                >
                  WON&apos;T QUIT.
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-white/70 text-base md:text-lg max-w-lg text-center mt-8 leading-relaxed">
              One in ten students finishes an online course. Persist doubles that.<br />
              <span className="text-white/90">For learners:</span> a community that won&apos;t let you quit.{' '}
              <span className="text-white/90">For creators:</span> AI that re-engages students automatically.
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-sm text-white/50">
              <span>✓ No credit card required</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ 5-minute setup</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ Teachable, Kajabi &amp; more</span>
            </div>

            {/* Demo credentials box */}
            <div className="mt-8 p-4 bg-white/5 backdrop-blur rounded-2xl border border-white/20 inline-block w-full max-w-sm">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-3 font-semibold text-center">
                Or explore with demo credentials
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <div className="bg-white/10 rounded-xl px-4 py-2 text-sm">
                  <span className="text-white/50 text-xs block">Email</span>
                  <p className="text-white font-mono font-medium">demo@persist.app</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-2 text-sm">
                  <span className="text-white/50 text-xs block">Password</span>
                  <p className="text-white font-mono font-medium">PersistDemo2026!</p>
                </div>
                <button
                  onClick={() => { window.location.href = '/sign-in' }}
                  className="bg-[#E4572E] hover:bg-[#CC4A23] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Try demo →
                </button>
              </div>
            </div>

            {/* Mobile-only CTA (the circular badge is desktop-only) */}
            <button
              onClick={() => { window.location.href = '/sign-up' }}
              className="lg:hidden mt-5 px-8 py-3.5 bg-[#E4572E] text-white font-bold rounded-full text-sm hover:bg-[#cc3f1a] transition-colors shadow-lg"
            >
              Start for free →
            </button>
          </div>

          {/* Right floating card (desktop only) */}
          <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{ rotate: 8 }}
            >
              <StreakCard />
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── BOTTOM FEATURE STRIP — white rounded top ─────────────────── */}
      <section className="bg-[#FBFEF9] text-[#1A2E2D] rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-6 py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Watch Every Student */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-64 border border-[#E2EDEC]">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-[#1A2E2D]">
              WATCH EVERY<br />STUDENT
            </h3>
            <p className="text-xs text-[#6B7C7B] font-semibold mb-auto">
              AI monitors progress across all your courses 24/7
            </p>
            <div className="flex items-center bg-[#004643] rounded-2xl p-3 text-white shadow-lg w-full">
              <div className="w-8 h-8 bg-[#7FB069] rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                SP
              </div>
              <div className="text-left flex-1">
                <p className="text-[10px] font-bold leading-none">Sofia Petrov</p>
                <p className="text-[8px] text-white/70 leading-none mt-1">Notion for Creators · 87%</p>
              </div>
              <span className="text-[10px] text-[#E4572E] font-bold bg-[#E4572E]/20 px-2 py-1 rounded-lg">
                At Risk
              </span>
            </div>
          </div>

          {/* Nudge in Your Voice */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-64 border border-[#E2EDEC]">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-[#1A2E2D]">
              NUDGE IN<br />YOUR VOICE
            </h3>
            <p className="text-xs text-[#6B7C7B] font-semibold mb-auto">
              Claude reads your emails and writes like you
            </p>
            <div className="flex flex-col bg-[#FBFEF9] rounded-2xl p-3 w-full border border-[#E2EDEC]">
              <p className="text-[10px] text-[#6B7C7B] text-left mb-1">AI nudge preview</p>
              <p className="text-xs text-[#1A2E2D] text-left leading-relaxed italic">
                &ldquo;Hey Sofia — Module 8 is waiting. You&apos;re so close to the finish line...&rdquo;
              </p>
              <div className="self-end mt-2 bg-[#E4572E] text-white text-[9px] font-bold px-3 py-1 rounded-full">
                Sent at 7am ✓
              </div>
            </div>
          </div>

          {/* Completion Rates Rise */}
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-64 border border-[#E2EDEC]">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-[#1A2E2D]">
              COMPLETION<br />RATES RISE
            </h3>
            <p className="text-xs text-[#6B7C7B] font-semibold mb-auto">
              Creators see 2× higher completion in one cohort
            </p>
            <div className="flex flex-col items-center bg-[#7FB069] rounded-[2rem] px-6 py-4 text-white shadow-lg w-full max-w-[200px] relative">
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1 text-white/80">
                Avg. completion rate
              </p>
              <p className="text-2xl font-black">61%</p>
              <p className="text-[9px] text-white/70">up from 23%</p>
              <div className="absolute -bottom-2 left-8 w-5 h-5 bg-[#7FB069] rotate-45" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
