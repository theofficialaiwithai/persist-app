'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Link2, Loader2, Plus, Trash2, GripVertical, AlertCircle, CheckCircle2, Pencil, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'details' | 'extracting' | 'review' | 'saving' | 'done'

interface LessonDraft {
  id:    string   // local draft id
  title: string
  editing: boolean
}

let nextId = 1
function uid() { return `draft-${nextId++}` }

// ── Component ─────────────────────────────────────────────────────────────────

export function AddCourseModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [step,        setStep       ] = useState<Step>('details')
  const [courseName,  setCourseName ] = useState('')
  const [courseUrl,   setCourseUrl  ] = useState('')
  const [warning,     setWarning    ] = useState('')
  const [draftLessons, setDraftLessons] = useState<LessonDraft[]>([])
  const [editMode,    setEditMode   ] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Extract curriculum from URL ───────────────────────────────────────────
  async function handleExtract() {
    if (!courseName.trim()) return
    if (!courseUrl.trim()) {
      // No URL — go straight to manual entry with empty list
      setDraftLessons([{ id: uid(), title: '', editing: true }])
      setEditMode(true)
      setStep('review')
      return
    }

    setStep('extracting')
    setWarning('')
    try {
      const res  = await fetch('/api/curriculum/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: courseUrl.trim() }),
      })
      const data = await res.json() as { lessons?: string[]; warning?: string; error?: string }

      if (data.warning) setWarning(data.warning)
      const lessons = (data.lessons ?? []).map(t => ({ id: uid(), title: t, editing: false }))
      setDraftLessons(lessons.length > 0 ? lessons : [{ id: uid(), title: '', editing: true }])
      setEditMode(lessons.length === 0)
    } catch {
      setWarning('Something went wrong. Add lessons manually below.')
      setDraftLessons([{ id: uid(), title: '', editing: true }])
      setEditMode(true)
    }
    setStep('review')
  }

  // ── Lesson editing helpers ─────────────────────────────────────────────────
  function updateTitle(id: string, title: string) {
    setDraftLessons(prev => prev.map(l => l.id === id ? { ...l, title } : l))
  }
  function deleteLesson(id: string) {
    setDraftLessons(prev => prev.filter(l => l.id !== id))
  }
  function addLesson() {
    setDraftLessons(prev => [...prev, { id: uid(), title: '', editing: true }])
  }
  function toggleEdit(id: string) {
    setDraftLessons(prev => prev.map(l => l.id === id ? { ...l, editing: !l.editing } : l))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    const titles = draftLessons.map(l => l.title.trim()).filter(Boolean)
    if (titles.length === 0) return

    setStep('saving')
    try {
      const res = await fetch('/api/courses/learner/add', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: courseName.trim(), url: courseUrl.trim() || undefined, lessonTitles: titles }),
      })
      if (!res.ok) throw new Error('Save failed')
      setStep('done')
      setTimeout(() => { router.refresh(); onClose() }, 1200)
    } catch {
      setStep('review') // revert so user can retry
    }
  }

  const validLessons = draftLessons.filter(l => l.title.trim())

  // ── Step indicators ───────────────────────────────────────────────────────
  const steps = ['Course details', 'Review curriculum', 'Done']
  const stepIdx = step === 'details' || step === 'extracting' ? 0
                : step === 'review'  || step === 'saving'     ? 1
                : 2

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(90vh, 700px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-4 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-[#111827]">Add a course</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">Track your progress lesson by lesson</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 px-8 pb-5 flex-shrink-0">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i < stepIdx ? 'text-[#7FB069]' : i === stepIdx ? 'text-[#004643]' : 'text-[#9CA3AF]'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0 ${
                    i < stepIdx  ? 'bg-[#7FB069] border-[#7FB069] text-white'
                    : i === stepIdx ? 'border-[#004643] text-[#004643]'
                    : 'border-[#E5E7EB] text-[#9CA3AF]'
                  }`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px flex-shrink-0 ${i < stepIdx ? 'bg-[#7FB069]' : 'bg-[#E5E7EB]'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="h-px bg-[#F3F4F6] flex-shrink-0" />

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* ── Step 1: Details ─────────────────────────────────────────── */}
            {(step === 'details' || step === 'extracting') && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-[#111827] block mb-2">
                    Course name <span className="text-[#E4572E]">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleExtract()}
                    placeholder="e.g. Build AI Products with Claude"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#111827] block mb-1">
                    Course URL <span className="text-[#9CA3AF] font-normal">(optional — we'll extract the curriculum automatically)</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      value={courseUrl}
                      onChange={e => setCourseUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleExtract()}
                      placeholder="https://udemy.com/course/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/10 transition-all"
                    />
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1.5">
                    Works with Udemy, Teachable, Kajabi, Thinkific, Podia, and most course platforms.
                  </p>
                </div>

                {/* Extracting spinner */}
                {step === 'extracting' && (
                  <div className="flex items-center gap-3 p-4 bg-[#F0F7EE] rounded-xl border border-[#D1EBE5]">
                    <Loader2 className="w-4 h-4 text-[#004643] animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[#004643]">Extracting curriculum…</p>
                      <p className="text-xs text-[#6B9A8A] mt-0.5">Claude is reading the course page</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Review curriculum ──────────────────────────────── */}
            {(step === 'review' || step === 'saving') && (
              <div className="space-y-4">
                {/* Warning / success banner */}
                {warning ? (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700">{warning}</p>
                  </div>
                ) : draftLessons.length > 0 && !editMode ? (
                  <div className="flex items-start gap-2.5 p-3.5 bg-[#F0F7EE] border border-[#D1EBE5] rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#5A8F47] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#3D6B32]">
                      Found <strong>{draftLessons.length} lessons</strong> — review them below and edit anything that looks off.
                    </p>
                  </div>
                ) : null}

                {/* Curriculum list */}
                <div className="space-y-1.5">
                  {draftLessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        editMode ? 'border-[#E5E7EB] bg-[#F9FAFB]' : 'border-transparent'
                      }`}
                    >
                      {editMode && (
                        <GripVertical className="w-4 h-4 text-[#D1D5DB] mt-2.5 flex-shrink-0 cursor-grab" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-[#E8F4F0] text-[#004643] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-1.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editMode ? (
                          <input
                            autoFocus={lesson.editing && lesson.title === ''}
                            value={lesson.title}
                            onChange={e => updateTitle(lesson.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') addLesson()
                              if (e.key === 'Backspace' && lesson.title === '' && draftLessons.length > 1) {
                                e.preventDefault()
                                deleteLesson(lesson.id)
                              }
                            }}
                            placeholder={`Lesson ${i + 1} title`}
                            className="w-full text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#004643] transition-colors"
                          />
                        ) : (
                          <p className="text-sm text-[#111827] leading-snug pt-1.5">{lesson.title}</p>
                        )}
                      </div>
                      {editMode && (
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors mt-1 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add lesson / edit toggle */}
                <div className="flex items-center gap-3 pt-1">
                  {editMode ? (
                    <button
                      onClick={addLesson}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#004643] hover:text-[#003533] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add lesson
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#004643] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit curriculum
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Done ──────────────────────────────────────────────────── */}
            {step === 'done' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-[#F0F7EE] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#7FB069]" />
                </div>
                <p className="text-lg font-bold text-[#111827]">Course added!</p>
                <p className="text-sm text-[#6B7280] mt-1">
                  {validLessons.length} lessons ready to track
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'done' && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-[#F3F4F6] flex-shrink-0 gap-4">
              {step === 'review' || step === 'saving' ? (
                <>
                  <button
                    onClick={() => { setStep('details'); setWarning('') }}
                    className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9CA3AF]">
                      {validLessons.length} lesson{validLessons.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={handleSave}
                      disabled={validLessons.length === 0 || step === 'saving'}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#004643] hover:bg-[#003533] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {step === 'saving' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : (
                        <>Looks good, save course <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtract}
                    disabled={!courseName.trim() || step === 'extracting'}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#004643] hover:bg-[#003533] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {step === 'extracting' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                    ) : courseUrl.trim() ? (
                      <>Extract curriculum <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>Add lessons manually <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
