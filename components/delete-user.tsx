"use client"

import { deleteUserFromDB } from "@/server/delete-user"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Trash } from "lucide-react"

export default function DeleteUser({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true)
      const { success, error } = await deleteUserFromDB(userId)

      if (!success) {
        toast.error(error || "Failed to remove user")
        return
      }

      setIsLoading(false)
      toast.success("User removed from database")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove user from database")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center justify-end">
      <Button
        onClick={handleRemoveMember}
        variant="destructive"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash />}
      </Button>
    </div>
  )
}
