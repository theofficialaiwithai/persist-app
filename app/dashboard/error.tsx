'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-[#1A2E2D] mb-2">Something went wrong</h2>
      <p className="text-[#6B7C7B] text-sm mb-6 max-w-sm">
        {error.message || 'An unexpected error occurred. The team has been notified.'}
      </p>
      <button
        onClick={reset}
        className="bg-[#004643] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#003533] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
