'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="text-xl font-bold text-indigo-600 tracking-tight select-none">
          Persist
        </span>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors px-2 py-1"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Start free →
          </Link>
        </div>
      </nav>
    </header>
  )
}
