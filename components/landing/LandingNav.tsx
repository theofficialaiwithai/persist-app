'use client'

import { useState, useEffect } from 'react'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-sm' : ''
      } bg-[#F7F4EE]/90 backdrop-blur-sm border-b border-[#E8E4DC]`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="text-xl font-bold text-[#111827] tracking-tight select-none hover:opacity-80 transition-opacity">
          Persist
        </a>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
            How it works
          </a>
          <a href="#features" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
            Pricing
          </a>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { window.location.href = '/sign-in' }}
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors px-1"
          >
            Sign in
          </button>
          <button
            onClick={() => { window.location.href = '/sign-up' }}
            className="bg-[#111827] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#1f2937] transition-colors"
          >
            Start free →
          </button>
        </div>
      </nav>
    </header>
  )
}
