"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { editMember } from "@/server/members"
import { Role } from "@/db/schema"

interface ChangeRoleFormProps {
  memberId: string
  currentRole: Role
}

export const ChangeRoleForm: React.FC<ChangeRoleFormProps> = ({
  memberId,
  currentRole,
}) => {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await editMember(memberId, selectedRole)
      if (response.success) {
        toast.success("Role updated successfully.")
        setOpen(false)
      } else {
        toast.error(response.error || "Failed to update role.")
      }
    } catch (error) {
      toast.error("An error occurred while updating the role.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Изменить роль</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as Role)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
