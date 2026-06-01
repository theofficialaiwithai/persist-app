import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { creators, courses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CreateSprintForm } from './CreateSprintForm'

export default async function NewSprintPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  })
  if (!creator) redirect('/dashboard/onboarding')

  const creatorCourses = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.creatorId, creator.id))
    .orderBy(courses.name)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Create Learning Sprint</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Set up a time-boxed challenge for your students
        </p>
      </div>
      <CreateSprintForm courses={creatorCourses} creatorName={creator.senderName || creator.name} />
    </div>
  )
}
