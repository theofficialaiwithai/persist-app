import { Zap, Brain, Mail, Check } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'

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

// ── Hero: email card mockup ───────────────────────────────────────────────────

function HeroEmailCard() {
  return (
    <div className="mt-16 max-w-lg mx-auto animate-fade-up delay-400">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E4DC] p-6">

        {/* Chrome bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-xs text-[#9CA3AF] ml-2">New message</span>
        </div>

        {/* Subject + sender line */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="font-semibold text-[#111827]">
            Hey Alex — you&apos;re so close 👀
          </p>
          <span className="shrink-0 bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full border border-indigo-100">
            AI nudge
          </span>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-4">
          From: Sarah K. &lt;sarah@notion4creators.com&gt;
        </p>

        {/* Body */}
        <div className="text-sm text-[#374151] leading-relaxed space-y-3">
          <p>
            I noticed you haven&apos;t logged in for 9 days, and you&apos;re sitting at{' '}
            <strong className="text-[#111827]">47% complete</strong>.
          </p>
          <p>
            That&apos;s the exact spot where most people pause — right before the part
            that changes everything.
          </p>
          <p>Module 6 is waiting. You&apos;ve already done the hard part.</p>
          <p className="font-medium text-[#111827]">You&apos;ve got this. 💪</p>
          <p className="text-[#6B7280]">— Sarah</p>
        </div>

        {/* Progress footer */}
        <div className="bg-[#F7F4EE] rounded-lg px-4 py-3 mt-5">
          <div className="flex justify-between items-center text-xs text-[#9CA3AF] mb-2">
            <span>Your progress</span>
            <span className="font-semibold text-indigo-600">47%</span>
          </div>
          <div className="h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '47%' }} />
          </div>
        </div>
      </div>

      {/* Floating sent badge */}
      <div className="absolute -mt-3 ml-[calc(100%-5.5rem)] -translate-y-full">
        {/* handled below via relative wrapper */}
      </div>
    </div>
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <LandingNav />

      {/* ──────────────────────────────────────────────────────── HERO ── */}
      <section className="relative pt-28 pb-20 px-6 text-center overflow-hidden bg-[#F7F4EE]">
        {/* Organic blobs */}
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-indigo-200 blur-3xl opacity-30 pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full bg-emerald-200 blur-3xl opacity-30 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Pill */}
          <div className="flex justify-center animate-fade-up">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-4 py-1.5 text-sm font-medium inline-block">
              AI-powered student retention
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl font-bold tracking-tight text-[#111827] max-w-3xl mx-auto leading-[1.05] mt-6 animate-fade-up delay-100">
            Your students{' '}
            <span className="text-indigo-600">won&apos;t quit.</span>
            <br />
            Not on your watch.
          </h1>

          {/* Sub */}
          <p className="text-xl text-[#6B7280] max-w-2xl mx-auto mt-5 leading-relaxed animate-fade-up delay-200">
            Persist watches every student&apos;s progress. When someone goes quiet at the 45% mark —
            the exact moment most people give up — it sends a personalized AI nudge{' '}
            <span className="text-[#111827] font-medium">in your voice</span>. While you sleep.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 animate-fade-up delay-300">
            <a
              href="/sign-up"
              className="bg-[#111827] text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-[#1f2937] transition-colors inline-block"
            >
              Start for free →
            </a>
            <a
              href="#how-it-works"
              className="border-2 border-[#E8E4DC] px-7 py-3.5 rounded-xl text-base font-medium text-[#111827] hover:border-[#111827] transition-colors inline-block"
            >
              See how it works
            </a>
          </div>

          {/* Trust signals */}
          <p className="mt-5 text-sm text-[#9CA3AF] animate-fade-in delay-400">
            <span className="text-emerald-600">✓</span> No credit card required
            &nbsp;&middot;&nbsp;
            <span className="text-emerald-600">✓</span> 5-minute setup
            &nbsp;&middot;&nbsp;
            <span className="text-emerald-600">✓</span> Works with Teachable, Kajabi &amp; Thinkific
          </p>

          {/* Email card */}
          <HeroEmailCard />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── PROBLEM ── */}
      <section id="problem" className="bg-white py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The problem</SectionLabel>
          <SectionHeading className="max-w-2xl mx-auto">
            Most students don&apos;t finish.
            <br />
            You already knew that.
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-14">
            <div className="bg-[#F7F4EE] rounded-2xl p-8 text-center border border-[#E8E4DC] hover:shadow-md transition-shadow duration-200">
              <p className="text-6xl font-bold text-red-500 leading-none">97<span className="text-4xl">%</span></p>
              <p className="text-[#6B7280] text-sm mt-3 leading-relaxed">
                of online course students never finish what they paid for
              </p>
            </div>
            <div className="bg-[#F7F4EE] rounded-2xl p-8 text-center border border-[#E8E4DC] hover:shadow-md transition-shadow duration-200">
              <p className="text-6xl font-bold text-amber-500 leading-none">45<span className="text-4xl">%</span></p>
              <p className="text-[#6B7280] text-sm mt-3 leading-relaxed">
                is where most students go quiet — halfway through, right before the good stuff
              </p>
            </div>
            <div className="bg-[#F7F4EE] rounded-2xl p-8 text-center border border-[#E8E4DC] hover:shadow-md transition-shadow duration-200">
              <p className="text-6xl font-bold text-emerald-500 leading-none">2<span className="text-4xl">×</span></p>
              <p className="text-[#6B7280] text-sm mt-3 leading-relaxed">
                higher completion rates when students receive timely, personal encouragement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[#F7F4EE] py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading>How Persist works</SectionHeading>

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

      {/* ────────────────────────────────────────────────── PRICING ── */}
      <section id="pricing" className="bg-white py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading>Simple pricing. No surprises.</SectionHeading>
          <p className="text-center text-[#6B7280] mt-4 max-w-md mx-auto">
            Pay for what you use. Cancel anytime. 14-day free trial included.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 items-start">

            {/* Core */}
            <div className="bg-[#F7F4EE] rounded-2xl p-8 border border-[#E8E4DC] hover:border-[#C8C4BC] transition-colors duration-200">
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide">Core</p>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-5xl font-bold text-[#111827]">$20</span>
                <span className="text-[#6B7280] mb-2">/month</span>
              </div>
              <p className="text-sm text-[#6B7280] mt-2 mb-8">
                Perfect for solo creators just getting started
              </p>
              <ul className="space-y-3">
                <PricingFeature>Up to 50 active students</PricingFeature>
                <PricingFeature>AI nudge emails in your voice</PricingFeature>
                <PricingFeature>Inactivity detection &amp; alerts</PricingFeature>
                <PricingFeature>Learning streak tracking 🔥</PricingFeature>
                <PricingFeature>Webhook integration (any platform)</PricingFeature>
              </ul>
              <a
                href="/sign-up"
                className="mt-8 block text-center py-3 rounded-xl border-2 border-[#111827] text-[#111827] font-semibold text-sm hover:bg-[#111827] hover:text-white transition-all duration-200"
              >
                Get started →
              </a>
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
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-white/50 mb-2">/month</span>
              </div>
              <p className="text-sm text-white/50 mt-2 mb-8">
                For growing creators with larger audiences
              </p>
              <ul className="space-y-3">
                <PricingFeature light>Everything in Core</PricingFeature>
                <PricingFeature light>Up to 500 active students</PricingFeature>
                <PricingFeature light>Daily learning recap emails</PricingFeature>
                <PricingFeature light>Advanced nudge tone controls</PricingFeature>
                <PricingFeature light>Priority email support</PricingFeature>
              </ul>
              <a
                href="/sign-up"
                className="mt-8 block text-center py-3 rounded-xl bg-white text-[#111827] font-semibold text-sm hover:bg-[#F7F4EE] transition-colors"
              >
                Get started →
              </a>
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
          <a
            href="/sign-up"
            className="mt-8 inline-block bg-white text-[#111827] px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#F7F4EE] transition-colors"
          >
            Start for free →
          </a>
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
    </div>
  )
}
