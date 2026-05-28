import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators } from '@/db/schema'
import { eq } from 'drizzle-orm'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })

  if (creator?.senderEmail) {
    redirect('/dashboard')
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <OnboardingForm />
    </div>
  )
}
