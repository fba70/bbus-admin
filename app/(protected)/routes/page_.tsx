import { getRoutes } from "@/server/routes"
import { getCurrentUser } from "@/server/users"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"

export default async function Reports() {
  const user = await getCurrentUser()
  const routes = await getRoutes(user.user.id)

  console.log("Routes", routes)
  console.log("User", user)

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Маршруты</h1>
    </div>
  )
}
