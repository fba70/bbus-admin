"use client"

import { removeMember } from "@/server/members"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, UserMinus } from "lucide-react"

export default function RemoveFromOrganization({
  memberId,
  onUserUpdated,
}: {
  memberId: string
  onUserUpdated?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true)
      const { success, error } = await removeMember(memberId)

      if (!success) {
        toast.error(error || "Failed to remove member")
        return
      }

      setIsLoading(false)
      toast.success("Member removed from organization")
      onUserUpdated?.()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove member from organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center justify-end">
      <Button
        onClick={handleRemoveMember}
        variant="default"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserMinus />
        )}
      </Button>
    </div>
  )
}
