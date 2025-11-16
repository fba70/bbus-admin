import Link from "next/link"

import { SignupForm } from "@/components/forms/signup-form"
import Image from "next/image"

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 self-center font-medium"
        >
          <Image
            src="/Logo_BBUS.png"
            alt="Business Bus"
            width={505}
            height={140}
            className="rounded-lg"
          />
          <span className="text-2xl">БИЗНЕС БАС</span>
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}
