'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddCourseModal } from '@/app/dashboard/learn/AddCourseModal'
import { LessonChecklist, type LessonRow } from '@/app/dashboard/learn/LessonChecklist'

export interface CourseWithLessons {
  id:       string
  name:     string
  lessons:  LessonRow[]
  progress: number
}

interface Props {
  courses: CourseWithLessons[]
}

export function LearnerCoursesPanel({ courses }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {/* Add Course button — always visible */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#111827]">Your Progress</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#004643] hover:bg-[#003533] px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add course
        </button>
      </div>

      {courses.length === 0 ? (
        /* Empty state */
        <div className="py-10 text-center">
          <div className="w-14 h-14 bg-[#E8F4F0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-sm font-semibold text-[#111827] mb-1">
            No courses yet
          </p>
          <p className="text-xs text-[#6B7280] mb-5 max-w-xs mx-auto">
            Add a course and paste the URL — Persist will pull the full curriculum and let you tick off lessons as you go.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004643] hover:bg-[#003533] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first course
          </button>
        </div>
      ) : (
        /* Course list with expandable lesson checklists */
        <div className="divide-y divide-[#E5E7EB]">
          {courses.map(course => (
            <LessonChecklist
              key={course.id}
              courseId={course.id}
              courseName={course.name}
              lessons={course.lessons}
              initialPct={course.progress}
            />
          ))}
        </div>
      )}

      {showModal && <AddCourseModal onClose={() => setShowModal(false)} />}
    </>
  )
}
