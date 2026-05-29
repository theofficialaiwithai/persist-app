'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/students', label: 'Students' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 ml-8">
      {navLinks.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              active
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
