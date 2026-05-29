import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100', className)}>
      <div
        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
