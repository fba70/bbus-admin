"use client"

import React from "react"
import { useState, useEffect } from "react"
import AllUsers from "@/components/all-users"
import MembersTable from "@/components/members-table"
import { getOrganizationBySlug } from "@/server/organizations"
import { getAllNonMemberUsers } from "@/server/users"
import { unauthorized } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = React.use(params)

  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [organization, setOrganization] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])

  const { data: user, isPending } = authClient.useSession()

  if (!user && !isPending) {
    unauthorized()
  }

  useEffect(() => {
    async function fetchData() {
      const org = await getOrganizationBySlug(slug)
      setOrganization(org)
      const users = await getAllNonMemberUsers()
      setAllUsers(users)
    }
    fetchData()
  }, [slug, membersRefreshKey])

  const handleUserAdded = () => {
    setMembersRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-start">
      <h1 className="text-2xl font-bold my-4">{organization?.name}</h1>
      <h2 className="text-xl font-bold mt-4">Пользователи:</h2>
      <div className="px-6 w-full">
        <MembersTable slug={slug} key={membersRefreshKey} />
      </div>
      <h2 className="text-xl font-bold mt-6 mb-4">Новые пользователи:</h2>
      <div className="px-6 w-full">
        <AllUsers
          users={allUsers}
          organizationId={organization?.id || ""}
          onUserAdded={handleUserAdded}
        />
      </div>
    </div>
  )
}

// <MembersTable members={organization?.members || []} />

/*
<div className="px-6 w-full">
        <AddUsersToOrganization
          users={newUsers}
          organizationId={organization?.id || ""}
        />
      </div>
*/

// const users = await getUsers(organization?.id || "")
// const newUsers = await getUsersNotInOrganization(organization?.id || "")
