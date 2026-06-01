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

  // Completion signal: senderName is set by the wizard on save.
  // We cannot use senderEmail (may still be '' after webhook upsert in conflict path)
  // or coursePlatform (defaults to 'other' in the schema, so always truthy).
  if (creator?.senderName) {
    redirect('/dashboard')
  }

  // creator may be null here if the Clerk webhook hasn't fired yet — that's fine.
  // OnboardingWizard handles null/undefined gracefully and creates the row on save.
  return <OnboardingWizard existingName={creator?.name ?? creator?.senderName ?? ''} />
}
