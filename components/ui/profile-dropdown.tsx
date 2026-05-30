'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Settings, LogOut, User, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProfileDropdown({ collapsed }: { collapsed?: boolean }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)

  const name = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Creator'
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const initials = name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const menuItems = [
    { label: "Profile",  href: "/dashboard/settings", icon: <User     className="w-4 h-4" /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      {/* Trigger — base-ui renders a <button> natively, so we style the trigger directly */}
      <DropdownMenuTrigger
        className={cn(
          "flex items-center rounded-xl border border-[#E5E7EB] bg-white",
          "hover:bg-[#F7F8FA] hover:border-[#D1D5DB] hover:shadow-sm",
          "transition-all duration-200 focus:outline-none w-full",
          collapsed ? "justify-center p-2" : "gap-3 p-3",
        )}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initials}
        </div>

        {/* Name + email — hidden when collapsed */}
        {!collapsed && (
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-medium text-[#111827] truncate leading-tight">
              {name}
            </div>
            <div className="text-xs text-[#6B7280] truncate leading-tight">
              {email}
            </div>
          </div>
        )}

        {!collapsed && (
          <ChevronRight
            className={cn(
              "w-4 h-4 text-[#9CA3AF] transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-90",
            )}
          />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-60 p-2 bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-2xl shadow-xl"
      >
        {/* User info header */}
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-medium text-[#111827]">{name}</div>
          <div className="text-xs text-[#6B7280]">{email}</div>
        </div>
        <DropdownMenuSeparator className="bg-[#F3F4F6]" />

        <div className="space-y-0.5 my-1">
          {menuItems.map(item => (
            <DropdownMenuItem
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer border border-transparent hover:border-[#E5E7EB] group"
            >
              <span className="text-[#6B7280] group-hover:text-[#111827]">{item.icon}</span>
              <span className="text-sm font-medium text-[#111827]">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: '/' })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 cursor-pointer border border-transparent hover:border-red-200 transition-all group"
        >
          <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
          <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
            Sign Out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
