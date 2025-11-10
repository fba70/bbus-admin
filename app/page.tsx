import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center h-screen px-5 text-center">
      <Image
        src="/Logo_BBUS.png"
        alt="Business Bus"
        width={346}
        height={140}
        className="rounded-lg"
      />

      <h1 className="text-4xl font-bold">БИЗНЕС БАС</h1>

      <p className="text-lg">
        Приложение администратора для управления логистикой перевозок.
      </p>

      <div className="flex gap-6 justify-center mt-8">
        <Link href="/login">
          <Button className="w-[100px]">Sign In</Button>
        </Link>
        <Link href="/signup">
          <Button className="w-[100px]">Sign Up</Button>
        </Link>
      </div>
    </div>
  )
}
