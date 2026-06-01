import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  // If onboarding is already complete (new wizard sets coursePlatform; old wizard set senderEmail)
  if (creator?.coursePlatform || creator?.senderEmail) {
    redirect('/dashboard')
  }

  return (
    <OnboardingWizard initialSenderName={creator?.senderName ?? ''} />
  )
}
