'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export default function OnboardingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    coursePlatform: '',
    senderName: '',
    senderEmail: '',
    nudgeTone: 'encouraging',
    minDaysBetweenNudges: 5,
    blackoutWeekends: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/creator/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg border border-[#E5E7EB] shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-[#111827]">
          Welcome to Persist
        </CardTitle>
        <CardDescription className="text-[#6B7280]">
          Set up your account to start re-engaging students automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Course Platform */}
          <div className="space-y-2">
            <Label className="text-[#111827] font-medium">Course platform</Label>
            <Select
              value={form.coursePlatform}
              onValueChange={(val) =>
                setForm((f) => ({ ...f, coursePlatform: val ?? '' }))
              }
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Select your platform" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#E5E7EB] shadow-lg z-50">
                <SelectItem value="teachable">Teachable</SelectItem>
                <SelectItem value="kajabi">Kajabi</SelectItem>
                <SelectItem value="thinkific">Thinkific</SelectItem>
                <SelectItem value="podia">Podia</SelectItem>
                <SelectItem value="gumroad">Gumroad</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sender Name */}
          <div className="space-y-2">
            <Label className="text-[#111827] font-medium">
              Your name (appears in emails)
            </Label>
            <Input
              type="text"
              value={form.senderName}
              onChange={(e) =>
                setForm((f) => ({ ...f, senderName: e.target.value }))
              }
              placeholder="Jane Smith"
              className="border-[#E5E7EB]"
              required
            />
          </div>

          {/* Sender Email */}
          <div className="space-y-2">
            <Label className="text-[#111827] font-medium">
              Reply-to email address
            </Label>
            <Input
              type="email"
              value={form.senderEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, senderEmail: e.target.value }))
              }
              placeholder="you@example.com"
              className="border-[#E5E7EB]"
              required
            />
          </div>

          {/* Nudge Tone */}
          <div className="space-y-2">
            <Label className="text-[#111827] font-medium">Nudge tone</Label>
            <Select
              value={form.nudgeTone}
              onValueChange={(val) =>
                setForm((f) => ({ ...f, nudgeTone: val ?? 'encouraging' }))
              }
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#E5E7EB] shadow-lg z-50">
                <SelectItem value="encouraging">Encouraging</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Days Between Nudges */}
          <div className="space-y-2">
            <Label className="text-[#111827] font-medium">
              Minimum days between nudges
            </Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={form.minDaysBetweenNudges}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  minDaysBetweenNudges: parseInt(e.target.value) || 5,
                }))
              }
              className="border-[#E5E7EB] w-28"
            />
          </div>

          {/* Blackout Weekends */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="blackoutWeekends"
              checked={form.blackoutWeekends}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, blackoutWeekends: !!checked }))
              }
            />
            <Label
              htmlFor="blackoutWeekends"
              className="text-[#111827] cursor-pointer font-normal"
            >
              Don&apos;t send nudges on weekends
            </Label>
          </div>

          {error && <p className="text-[#EF4444] text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={loading || !form.coursePlatform}
            className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium"
          >
            {loading ? 'Saving…' : 'Get started →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
