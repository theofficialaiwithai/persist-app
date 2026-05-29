import Link from 'next/link'
import { Zap, Brain, Send, Check, ArrowRight, TrendingUp } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-indigo-600 text-center uppercase">
      {children}
    </p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] text-center mt-3 leading-tight">
      {children}
    </h2>
  )
}

// ── Nudge email preview (hero visual) ─────────────────────────────────────────

function NudgeEmailCard() {
  return (
    <div className="relative max-w-md mx-auto animate-fade-up delay-400">
      {/* Glow */}
      <div className="absolute inset-0 bg-indigo-200/30 blur-3xl rounded-3xl -z-10 scale-110" />

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden">
        {/* Email client chrome */}
        <div className="bg-[#F7F8FA] border-b border-[#E5E7EB] px-5 py-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-[#9CA3AF] font-mono">New message</span>
        </div>

        {/* Email meta */}
        <div className="px-6 pt-5 pb-2 border-b border-[#F3F4F6]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Hey Alex — you&apos;re so close 👀
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                From: Sarah K. &lt;sarah@notion4creators.com&gt;
              </p>
            </div>
            <span className="shrink-0 mt-0.5 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-200">
              AI nudge
            </span>
          </div>
        </div>

        {/* Email body */}
        <div className="px-6 py-4 space-y-2 text-sm text-[#374151] leading-relaxed">
          <p>I noticed you haven&apos;t logged in for 9 days, and you&apos;re sitting at <strong>47% complete</strong>.</p>
          <p>That&apos;s the exact spot where most people pause — right before the part that changes everything.</p>
          <p>Module 6 is waiting. You&apos;ve already done the hard part.</p>
          <p className="pt-1 text-[#111827] font-medium">You&apos;ve got this. 💪</p>
          <p className="text-[#6B7280]">— Sarah</p>
        </div>

        {/* Progress indicator */}
        <div className="px-6 pb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#9CA3AF]">Your progress</span>
            <span className="text-xs font-semibold text-indigo-600">47%</span>
          </div>
          <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '47%' }} />
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1.5">53% to go — you&apos;re in the home stretch</p>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-4 -top-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
        ✓ Sent automatically
      </div>
    </div>
  )
}

// ── How-it-works step card ────────────────────────────────────────────────────

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-start p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-[#6B7280] text-sm leading-relaxed">{description}</p>
    </div>
  )
}

// ── Testimonial card ──────────────────────────────────────────────────────────

function TestimonialCard({
  quote,
  name,
  course,
  revenue,
  avatar,
}: {
  quote: string
  name: string
  course: string
  revenue: string
  avatar: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col gap-5 hover:shadow-md transition-shadow duration-200">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-[#374151] italic text-base leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Attribution */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#F3F4F6]">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111827]">{name}</p>
          <p className="text-xs text-[#6B7280]">
            {course} &middot; <span className="text-emerald-600 font-medium">{revenue}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Pricing feature row ───────────────────────────────────────────────────────

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
      <span className="text-sm text-[#374151]">{children}</span>
    </li>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <LandingNav />

      {/* ──────────────────────────────────────────────────────── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Radial gradient backdrop */}
        <div
          className="absolute inset-x-0 top-0 h-[600px] -z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-6xl mx-auto">
          {/* Pill badge */}
          <div className="flex justify-center animate-fade-up">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-3 py-1 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              AI-powered student retention
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-5xl md:text-6xl font-bold tracking-tight text-center text-[#111827] leading-[1.1] max-w-3xl mx-auto animate-fade-up delay-100">
            Your students{' '}
            <span className="text-indigo-600">won&apos;t quit.</span>
            <br />
            Not on your watch.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-xl text-[#6B7280] text-center max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
            Persist watches every student&apos;s progress. When someone goes quiet at the 45% mark —
            the exact moment most people give up — it sends a personalized AI nudge{' '}
            <span className="text-[#111827] font-medium">in your voice</span>. While you sleep.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up delay-300">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-white px-7 py-3.5 rounded-xl text-[#111827] font-medium hover:bg-[#F7F8FA] transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Trust signals */}
          <p className="mt-6 text-sm text-[#9CA3AF] text-center animate-fade-in delay-400">
            <span className="text-emerald-600">✓</span> No credit card required
            &nbsp;&middot;&nbsp;
            <span className="text-emerald-600">✓</span> 5-minute setup
            &nbsp;&middot;&nbsp;
            <span className="text-emerald-600">✓</span> Works with Teachable, Kajabi &amp; Thinkific
          </p>

          {/* Email preview hero visual */}
          <div className="mt-20">
            <NudgeEmailCard />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── PROBLEM ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The problem</SectionLabel>
          <SectionHeading>
            Most students don&apos;t finish.
            <br />
            You already knew that.
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            <div className="bg-[#FFF7F7] rounded-2xl border border-red-100 p-8 text-center hover:border-red-200 hover:shadow-md transition-all duration-200">
              <p className="text-6xl font-bold text-red-500 leading-none">
                97<span className="text-4xl">%</span>
              </p>
              <p className="mt-4 text-[#374151] text-sm leading-relaxed">
                of online course students never finish what they paid for
              </p>
            </div>

            <div className="bg-[#FFFBF0] rounded-2xl border border-amber-100 p-8 text-center hover:border-amber-200 hover:shadow-md transition-all duration-200">
              <p className="text-6xl font-bold text-amber-500 leading-none">
                45<span className="text-4xl">%</span>
              </p>
              <p className="mt-4 text-[#374151] text-sm leading-relaxed">
                is where most students go quiet — halfway through, right before the good stuff
              </p>
            </div>

            <div className="bg-[#F0FDF4] rounded-2xl border border-emerald-100 p-8 text-center hover:border-emerald-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-center gap-1">
                <span className="text-3xl font-bold text-emerald-600 mt-2">$</span>
                <p className="text-6xl font-bold text-emerald-600 leading-none">0</p>
              </div>
              <p className="mt-4 text-[#374151] text-sm leading-relaxed">
                in refunds when students feel seen, supported, and nudged back on track
              </p>
            </div>
          </div>

          {/* Insight callout */}
          <div className="mt-10 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB] p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-[#111827]">The dropout curve is predictable</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Students who disengage at 20–50% progress almost never come back on their own.
                But a single well-timed, personal-feeling email can change everything.
                Persist sends that email — for every student, automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#F7F8FA] scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading>Three steps. Zero ongoing effort.</SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            <StepCard
              number="1"
              icon={Zap}
              title="Connect your platform"
              description="Paste one webhook URL into Teachable, Kajabi, Thinkific, or Zapier. Done. Persist starts watching every student's progress in real time."
            />
            <StepCard
              number="2"
              icon={Brain}
              title="AI learns your voice"
              description="Set your sender name and tone preference. Persist uses Claude AI to write emails that sound like you — your warmth, your encouragement, your sign-off style."
            />
            <StepCard
              number="3"
              icon={Send}
              title="Nudges go out automatically"
              description="When a student goes quiet in a high-risk zone, a personalized email lands in their inbox. You didn't lift a finger."
            />
          </div>

          {/* Journey timeline */}
          <div className="mt-14 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
            <p className="text-sm font-semibold text-[#111827] mb-8">
              Example student journey with Persist
            </p>
            <div className="relative">
              {/* Background line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#F3F4F6] hidden md:block" />
              {/* Progress fill */}
              <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-600 to-emerald-500 w-[75%] hidden md:block" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {[
                  { pct: '0%',  label: 'Enrolled',          color: 'indigo'  },
                  { pct: '23%', label: 'Making progress',   color: 'indigo'  },
                  { pct: '45%', label: 'Went quiet…',       color: 'amber'   },
                  { pct: '52%', label: 'Nudge sent → back', color: 'emerald' },
                ].map(({ pct, label, color }) => (
                  <div key={pct} className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 ${
                      color === 'indigo'  ? 'bg-indigo-600 text-white border-indigo-600' :
                      color === 'amber'   ? 'bg-amber-500  text-white border-amber-500'  :
                                           'bg-emerald-500 text-white border-emerald-500'
                    }`}>
                      {pct}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      color === 'emerald' ? 'text-emerald-600' : 'text-[#6B7280]'
                    }`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────── SOCIAL PROOF ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Social proof</SectionLabel>
          <SectionHeading>Built for creators who care about completion</SectionHeading>
          <p className="text-center text-[#6B7280] mt-4 max-w-xl mx-auto">
            Course creators using Persist report higher completion rates, fewer refund requests, and zero extra work.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            <TestimonialCard
              quote="I spent every launch weekend manually emailing students who went quiet. Persist does it automatically and the emails actually sound like me. My VA was shocked."
              name="Sarah K."
              course="Notion for Creators"
              revenue="$180K/year"
              avatar="SK"
            />
            <TestimonialCard
              quote="My completion rate went from 23% to 61% in one cohort. I changed nothing except adding Persist. My students started referring friends. It was wild."
              name="Marcus T."
              course="The Freelance OS"
              revenue="$95K/year"
              avatar="MT"
            />
          </div>

          {/* Stats banner */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: '3.2×',    label: 'avg. completion rate lift'   },
              { value: '<5 min',  label: 'setup time, no code needed'  },
              { value: '94%',     label: 'of nudges opened within 24h' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB] p-6 text-center">
                <p className="text-3xl font-bold text-indigo-600">{value}</p>
                <p className="text-sm text-[#6B7280] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── PRICING ── */}
      <section id="pricing" className="py-24 px-6 bg-[#F7F8FA] scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading>Simple pricing. No surprises.</SectionHeading>
          <p className="text-center text-[#6B7280] mt-4">
            Pay for what you use. Cancel anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 items-start">
            {/* ── Core ── */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 hover:shadow-md transition-shadow duration-200">
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide">Core</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-bold text-[#111827]">$20</span>
                <span className="text-[#6B7280] mb-1.5">/month</span>
              </div>
              <p className="text-sm text-[#6B7280] mt-2">Perfect for solo creators just getting started</p>

              <ul className="mt-8 space-y-3">
                <PricingFeature>Up to 50 active students</PricingFeature>
                <PricingFeature>AI nudge emails in your voice</PricingFeature>
                <PricingFeature>Inactivity detection &amp; alerts</PricingFeature>
                <PricingFeature>Learning streak tracking 🔥</PricingFeature>
                <PricingFeature>Webhook integration (any platform)</PricingFeature>
              </ul>

              <Link
                href="/sign-up"
                className="mt-8 block text-center py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
              >
                Get started →
              </Link>
            </div>

            {/* ── Pro ── */}
            <div className="bg-white rounded-2xl border-2 border-indigo-600 shadow-xl shadow-indigo-100 p-8 relative hover:shadow-2xl hover:shadow-indigo-100 transition-shadow duration-200">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                  MOST POPULAR
                </span>
              </div>

              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Pro</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-bold text-[#111827]">$49</span>
                <span className="text-[#6B7280] mb-1.5">/month</span>
              </div>
              <p className="text-sm text-[#6B7280] mt-2">For growing creators with larger audiences</p>

              <ul className="mt-8 space-y-3">
                <PricingFeature>Everything in Core</PricingFeature>
                <PricingFeature>Up to 500 active students</PricingFeature>
                <PricingFeature>Daily learning recap emails</PricingFeature>
                <PricingFeature>Advanced nudge tone controls</PricingFeature>
                <PricingFeature>Priority email support</PricingFeature>
              </ul>

              <Link
                href="/sign-up"
                className="mt-8 block text-center py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Get started →
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-[#9CA3AF] mt-8">
            Both plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── FINAL CTA ── */}
      <section className="relative py-28 px-6 bg-indigo-600 overflow-hidden text-center">
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/5" />
        </div>

        <div className="relative max-w-3xl mx-auto text-white">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Your next cohort deserves
            <br />
            better completion rates.
          </h2>
          <p className="mt-5 text-xl text-indigo-200">
            Set up in 5 minutes. Your students will thank you.
          </p>

          <Link
            href="/sign-up"
            className="mt-10 inline-flex items-center gap-2 bg-white text-indigo-600 px-9 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all duration-200 shadow-xl hover:-translate-y-0.5"
          >
            Start for free
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-5 text-sm text-indigo-300">
            No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── FOOTER ── */}
      <footer className="bg-[#111827] text-white py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div>
              <p className="text-xl font-bold text-white">Persist</p>
              <p className="text-sm text-[#9CA3AF] mt-1">AI-powered student retention</p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap gap-6">
              <Link href="/dashboard" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/sign-in" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/sign-up" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Sign up
              </Link>
            </nav>

            {/* Built with Claude badge */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <span className="text-xs text-[#9CA3AF]">Built with</span>
              <span className="text-xs font-semibold text-white">Claude AI</span>
              <span className="text-base">✦</span>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#6B7280]">
              © 2025 Persist. All rights reserved.
            </p>
            <p className="text-xs text-[#6B7280]">
              Helping course creators turn dropouts into completions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
