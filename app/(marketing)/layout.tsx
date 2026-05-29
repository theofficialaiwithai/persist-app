/**
 * Marketing route group layout.
 *
 * Wraps all pages inside app/(marketing)/ (e.g. /about, /features, /blog).
 * Does NOT apply auth — these are public marketing pages.
 *
 * The root landing page (/) lives at app/page.tsx which inherits from
 * app/layout.tsx (ClerkProvider). Future marketing sub-pages can be added
 * here at any path, e.g. app/(marketing)/about/page.tsx → /about.
 */

import { LandingNav } from '@/components/landing/LandingNav'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingNav />
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#111827] text-[#9CA3AF] py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
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
              <span>✦</span>
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
