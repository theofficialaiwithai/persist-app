'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { Loader2, BookOpen, Zap } from 'lucide-react'

interface Course { id: string; name: string }

interface Props {
  courses: Course[]
  creatorName: string
}

const inputCls =
  'w-full h-10 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#111827] ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
  'placeholder:text-[#9CA3AF] bg-white'

const labelCls = 'block text-sm font-medium text-[#111827] mb-1.5'
const hintCls  = 'mt-1 text-xs text-[#9CA3AF]'

// Returns today + N days as 'YYYY-MM-DD'
function dateOffset(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function CreateSprintForm({ courses, creatorName }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [sprintType, setSprintType] = useState<'course' | 'skill'>('course')
  const [title,        setTitle       ] = useState('')
  const [description,  setDescription ] = useState('')
  const [courseId,     setCourseId    ] = useState(courses[0]?.id ?? '')
  const [skillFocus,   setSkillFocus  ] = useState('')
  const [startDate,    setStartDate   ] = useState(dateOffset(7))
  const [endDate,      setEndDate     ] = useState(dateOffset(21))
  const [joinDeadline, setJoinDeadline] = useState(dateOffset(5))
  const [maxMembers,   setMaxMembers  ] = useState('20')
  const [errors,       setErrors      ] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim())                  e.title        = 'Title is required'
    if (sprintType === 'skill' && !skillFocus.trim()) e.skillFocus = 'Skill focus is required'
    if (!startDate)                     e.startDate    = 'Start date is required'
    if (!endDate)                       e.endDate      = 'End date is required'
    if (!joinDeadline)                  e.joinDeadline = 'Join deadline is required'
    if (endDate && startDate && endDate <= startDate)
      e.endDate = 'End date must be after start date'
    if (joinDeadline && startDate && joinDeadline >= startDate)
      e.joinDeadline = 'Join deadline must be before start date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/sprints/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:        title.trim(),
          description:  description.trim() || null,
          courseId:     sprintType === 'course' ? courseId : null,
          skillFocus:   sprintType === 'skill'  ? skillFocus.trim() : null,
          startDate,
          endDate,
          joinDeadline,
          maxMembers:   Number(maxMembers) || 20,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create sprint')
      showToast.saved('Sprint created!')
      router.push(`/dashboard/sprints/${data.sprint.id}`)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  // Auto-update join deadline when start date changes
  function handleStartDateChange(val: string) {
    setStartDate(val)
    if (val) {
      const d = new Date(val)
      d.setDate(d.getDate() - 2)
      setJoinDeadline(d.toISOString().slice(0, 10))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">

        {/* Title */}
        <div>
          <label className={labelCls}>Sprint title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What are students sprinting toward?"
            className={cn(inputCls, errors.title && 'border-red-400 ring-1 ring-red-400')}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Type toggle */}
        <div>
          <label className={labelCls}>Sprint type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSprintType('course')}
              className={cn(
                'flex-1 flex items-center gap-2 justify-center py-2.5 rounded-xl border text-sm font-medium transition-colors',
                sprintType === 'course'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:border-indigo-200',
              )}
            >
              <BookOpen className="w-4 h-4" /> Course Sprint
            </button>
            <button
              type="button"
              onClick={() => setSprintType('skill')}
              className={cn(
                'flex-1 flex items-center gap-2 justify-center py-2.5 rounded-xl border text-sm font-medium transition-colors',
                sprintType === 'skill'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:border-indigo-200',
              )}
            >
              <Zap className="w-4 h-4" /> Skill Sprint
            </button>
          </div>
        </div>

        {/* Course or skill input */}
        {sprintType === 'course' ? (
          <div>
            <label className={labelCls}>Course</label>
            {courses.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No courses yet — add one first.</p>
            ) : (
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className={inputCls}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div>
            <label className={labelCls}>Skill focus</label>
            <input
              type="text"
              value={skillFocus}
              onChange={e => setSkillFocus(e.target.value)}
              placeholder="e.g. Prompt Engineering, AI Marketing, Notion Setup…"
              className={cn(inputCls, errors.skillFocus && 'border-red-400')}
            />
            {errors.skillFocus && <p className="mt-1 text-xs text-red-500">{errors.skillFocus}</p>}
          </div>
        )}

        {/* Description */}
        <div>
          <label className={labelCls}>Description <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will students accomplish? What's the goal?"
            rows={3}
            className={cn(inputCls, 'h-auto py-2.5 resize-none')}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#111827]">Dates & capacity</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className={cn(inputCls, errors.startDate && 'border-red-400')}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
          </div>
          <div>
            <label className={labelCls}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className={cn(inputCls, errors.endDate && 'border-red-400')}
            />
            {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Join deadline</label>
          <input
            type="date"
            value={joinDeadline}
            onChange={e => setJoinDeadline(e.target.value)}
            className={cn(inputCls, errors.joinDeadline && 'border-red-400')}
          />
          <p className={hintCls}>Students must join before this date. Auto-set to 2 days before start.</p>
          {errors.joinDeadline && <p className="mt-1 text-xs text-red-500">{errors.joinDeadline}</p>}
        </div>

        <div>
          <label className={labelCls}>Max members</label>
          <input
            type="number"
            min={2}
            max={500}
            value={maxMembers}
            onChange={e => setMaxMembers(e.target.value)}
            className={cn(inputCls, 'w-32')}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Creating…' : 'Create Sprint'}
        </button>
      </div>
    </form>
  )
}
