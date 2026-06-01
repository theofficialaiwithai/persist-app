'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'

export interface LessonRow {
  id:        string
  title:     string
  position:  number
  completed: boolean
}

interface Props {
  courseId:    string
  courseName:  string
  lessons:     LessonRow[]
  initialPct:  number
}

export function LessonChecklist({ courseId, courseName, lessons: initialLessons, initialPct }: Props) {
  const [lessons,   setLessons  ] = useState(initialLessons)
  const [expanded,  setExpanded ] = useState(false)
  const [toggling,  setToggling ] = useState<Set<string>>(new Set())
  const [pct,       setPct      ] = useState(initialPct)

  const total    = lessons.length
  const done     = lessons.filter(l => l.completed).length
  const progress = total > 0 ? Math.round((done / total) * 100) : pct

  async function handleToggle(lessonId: string) {
    if (toggling.has(lessonId)) return

    // Optimistic update
    setToggling(prev => new Set([...prev, lessonId]))
    const wasCompleted = lessons.find(l => l.id === lessonId)?.completed ?? false
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l))

    try {
      const res = await fetch(`/api/lessons/${lessonId}/toggle`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { progressPct: number }
        setPct(data.progressPct)
      } else {
        // Revert on error
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: wasCompleted } : l))
      }
    } catch {
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, completed: wasCompleted } : l))
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(lessonId); return next })
    }
  }

  // Next uncompleted lesson
  const nextLesson = [...lessons].sort((a, b) => a.position - b.position).find(l => !l.completed)

  return (
    <div className="py-4 first:pt-0 last:pb-0 border-b border-[#E5E7EB] last:border-0">
      {/* Course header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-[#E8F4F0] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-[#004643] text-sm font-bold">
              {courseName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#111827] truncate">{courseName}</p>
            {nextLesson && !expanded && (
              <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                Up next: {nextLesson.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-bold text-[#004643]">{progress}%</span>
          <span className="text-xs text-[#9CA3AF] hidden sm:block">{done}/{total}</span>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#004643] hover:bg-[#F0F7EE] transition-colors"
            title={expanded ? 'Collapse' : 'Show lessons'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <AnimatedProgressBar value={progress} />

      {/* Lesson list (expanded) */}
      {expanded && total > 0 && (
        <div className="mt-3 space-y-0.5">
          {[...lessons]
            .sort((a, b) => a.position - b.position)
            .map(lesson => {
              const isToggling = toggling.has(lesson.id)
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleToggle(lesson.id)}
                  disabled={isToggling}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group ${
                    lesson.completed
                      ? 'hover:bg-[#F0F7EE]'
                      : 'hover:bg-[#F7F8FA]'
                  } ${isToggling ? 'opacity-60' : ''}`}
                >
                  {lesson.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#7FB069] flex-shrink-0 transition-transform group-hover:scale-110" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#D1D5DB] flex-shrink-0 group-hover:text-[#004643] transition-colors" />
                  )}
                  <span className={`text-sm leading-snug flex-1 text-left ${
                    lesson.completed
                      ? 'text-[#9CA3AF] line-through'
                      : 'text-[#374151] group-hover:text-[#111827]'
                  }`}>
                    {lesson.title}
                  </span>
                  {isToggling && (
                    <span className="w-3 h-3 rounded-full border-2 border-[#004643] border-t-transparent animate-spin flex-shrink-0" />
                  )}
                </button>
              )
            })}

          {done === total && total > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 mt-1">
              <CheckCircle2 className="w-4 h-4 text-[#7FB069]" />
              <p className="text-sm font-semibold text-[#5A8F47]">
                🎉 Course complete!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
