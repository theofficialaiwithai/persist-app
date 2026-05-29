import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsForm } from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const webhookUrl = `${baseUrl}/api/webhook/progress?creatorId=${creator.id}`

  return (
    <div className="p-8 space-y-2">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827]">Settings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage your account and nudge preferences
        </p>
      </div>

      <SettingsForm
        initialData={{
          senderName:           creator.senderName,
          senderEmail:          creator.senderEmail,
          coursePlatform:       creator.coursePlatform,
          nudgeTone:            creator.nudgeTone,
          minDaysBetweenNudges: creator.minDaysBetweenNudges,
          blackoutWeekends:     creator.blackoutWeekends,
        }}
        webhookUrl={webhookUrl}
        webhookSecret={creator.webhookSecret}
      />
    </div>
  )
}
