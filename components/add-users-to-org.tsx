"use client"

import { User } from "@/db/schema"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getAllNonMemberUsers } from "@/server/users"
import { addMember } from "@/server/members"

interface AllUsersProps {
  organizationId: string
  users: User[]
}

export default function AddUsersToOrganization({
  organizationId,
  users,
}: AllUsersProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  let filteredUsers = [] as User[]

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllNonMemberUsers()
      setAllUsers(allUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Ошибка загрузки пользователей")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  console.log("All Users:", allUsers)

  useEffect(() => {
    fetchUsers()

    filteredUsers = allUsers.filter(
      (user) => !users.some((existingUser) => existingUser.id === user.id)
    )
  }, [])

  const handleAddMember = async (user: User) => {
    try {
      setIsLoading(true)

      await addMember(organizationId, user.id, "driver")
      toast.success("Пользователь успешно добавлен в организацию")
      router.refresh()
    } catch (error) {
      toast.error("Ошибка при добавлении пользователя в организацию")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // console.log("Filtered Users:", filteredUsers)

  return (
    <div>
      {isLoadingUsers && <p>Загрузка пользователей...</p>}
      {filteredUsers.length === 0 && !isLoadingUsers && (
        <p className="text-center mt-2">
          Нет новых пользователей для добавления в организацию.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {filteredUsers.map((user) => (
          <div key={user.id}>
            <Button onClick={() => handleAddMember(user)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                `Добавить пользователя " ${user.name} " в организацию`
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
