'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// ── Add Course Button + Modal ────────────────────────────────────────────────

export function AddCourseButton() {
  const router     = useRouter()
  const [open,       setOpen      ] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [externalId, setExternalId] = useState('')
  const [isLoading,  setIsLoading ] = useState(false)

  const handleAddCourse = async () => {
    if (!courseName.trim() || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/courses/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseName, externalId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add course')
      }
      showToast.saved('Course added!')
      setOpen(false)
      setCourseName('')
      setExternalId('')
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to add course')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-[#004643] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#003533] transition-colors">
        <Plus className="w-4 h-4" />
        Add a new course
      </DialogTrigger>

      <DialogContent className="rounded-2xl max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle>Add a course to track</DialogTitle>
          <DialogDescription>
            Persist will monitor student progress on this course automatically once your
            webhook is connected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Course name */}
          <div>
            <label className="text-sm font-medium text-[#111827]">Course name</label>
            <Input
              placeholder="e.g. Build AI Products with Claude"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              className="mt-1.5"
              onKeyDown={e => e.key === 'Enter' && handleAddCourse()}
            />
          </div>

          {/* External ID */}
          <div>
            <label className="text-sm font-medium text-[#111827]">
              External course ID{' '}
              <span className="text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. course_123 from your platform"
              value={externalId}
              onChange={e => setExternalId(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Used to match webhook events to this course.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#004643] hover:bg-[#003533] text-white"
            onClick={handleAddCourse}
            disabled={!courseName.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Discover Course Button ────────────────────────────────────────────────────

export function DiscoverCourseButton() {
  return (
    <a
      href="https://skillpath-hazel.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 border border-[#E5E7EB] text-[#111827] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
    >
      <Sparkles className="w-4 h-4 text-[#004643]" />
      Discover your next course
    </a>
  )
}
