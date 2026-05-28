import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
      <SignIn />
    </div>
  )
}
