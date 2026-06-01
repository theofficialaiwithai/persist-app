import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FBFEF9] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#004643]">Persist</h1>
          <p className="text-[#6B7C7B] text-sm mt-1">Student retention, automated</p>
        </div>
        <SignUp forceRedirectUrl="/dashboard/onboarding" />
      </div>
    </div>
  )
}
