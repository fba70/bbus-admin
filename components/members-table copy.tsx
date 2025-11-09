import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Member } from "@/db/schema"
import MembersTableAction from "./members-table-action"
import { ChangeRoleForm } from "./forms/change-role-form"

interface MembersTableProps {
  members: Member[]
}

export default function MembersTable({ members }: MembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell className="flex gap-2 items-center justify-end text-right">
              <MembersTableAction memberId={member.id} />
              <ChangeRoleForm memberId={member.id} currentRole={member.role} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
