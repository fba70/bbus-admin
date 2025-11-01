import { ModeSwitcher } from "@/components/mode-switcher"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <header className="absolute top-0 right-0 flex justify-end items-center p-4">
        <ModeSwitcher />
      </header>
      <div className="flex flex-col gap-8 items-center justify-center h-screen px-5 text-center">
        <Image
          src="/Logo_BBUS.png"
          alt="Business Bus"
          width={505}
          height={140}
          className="rounded-lg dark:invert"
        />

        <h1 className="text-4xl font-bold">БИЗНЕС БАС</h1>

        <p className="text-lg">
          Приложение для администратора для управления логистикой перевозок.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
