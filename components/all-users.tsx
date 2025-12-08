"use client"

import { User } from "@/db/schema"
import { Button } from "./ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { addMember } from "@/server/members"
// import { authClient } from "@/lib/auth-client"

interface AllUsersProps {
  users: User[]
  organizationId: string
  onUserAdded?: () => void
}

export default function AllUsers({
  users,
  organizationId,
  onUserAdded,
}: AllUsersProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const router = useRouter()

  const handleInviteMember = async (user: User) => {
    try {
      setIsLoading(true)
      setLoadingUserId(user.id)
      await addMember(organizationId, user.id, "driver")

      setIsLoading(false)
      toast.success("User added to the organization successfully")
      if (onUserAdded) onUserAdded()
      router.refresh()
    } catch (error) {
      toast.error("Failed to add user to the organization")
      console.error(error)
    } finally {
      setIsLoading(false)
      setLoadingUserId(null)
    }
  }

  return (
    <div>
      {users.length === 0 && !isLoading && (
        <p className="text-center mt-2">
          Нет новых пользователей для добавления в организацию.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div key={user.id}>
            <Button
              onClick={() => handleInviteMember(user)}
              disabled={loadingUserId === user.id}
              className="w-[500px]"
            >
              {loadingUserId === user.id ? (
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

/*
const { error } = await authClient.organization.inviteMember({
        email: user.email,
        role: "member",
        organizationId: organizationId,
      })
*/
