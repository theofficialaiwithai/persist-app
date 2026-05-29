'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings } from 'lucide-react'

const navLinks = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students',  icon: Users           },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings        },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-[rgba(79,70,229,0.1)] text-[#4F46E5] font-medium'
                : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111827]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
