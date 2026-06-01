export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#004643] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6B7C7B]">Loading your dashboard...</p>
      </div>
    </div>
  )
}
