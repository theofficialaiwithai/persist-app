'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'

export function UserMenu() {
  const { user } = useUser()
  if (!user) return null

  const firstName = user.firstName ?? ''
  const lastName  = user.lastName  ?? ''
  const initials  = (`${firstName[0] ?? ''}${lastName[0] ?? ''}`).toUpperCase() || '?'
  const fullName  = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <div className="flex items-center gap-3">
      {fullName && (
        <span className="hidden sm:block text-sm text-gray-700">{fullName}</span>
      )}
      <div className="bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full w-8 h-8 flex items-center justify-center shrink-0 select-none">
        {initials}
      </div>
      <SignOutButton>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Sign out
        </button>
      </SignOutButton>
    </div>
  )
}
