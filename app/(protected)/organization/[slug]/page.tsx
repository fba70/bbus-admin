import AllUsers from "@/components/all-users"
import AddUsersToOrganization from "@/components/add-users-to-org"
import MembersTable from "@/components/members-table"
import { getOrganizationBySlug } from "@/server/organizations"
import { getUsers } from "@/server/users"

type Params = Promise<{ slug: string }>

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params

  const organization = await getOrganizationBySlug(slug)
  const users = await getUsers(organization?.id || "")

  return (
    <div className="flex flex-col gap-2 items-center justify-start">
      <h1 className="text-2xl font-bold my-4">{organization?.name}</h1>
      <h2 className="text-xl font-bold mt-4">Пользователи:</h2>
      <div className="px-6 w-full">
        <MembersTable slug={slug} />
      </div>

      <h2 className="text-xl font-bold mt-6">Новые пользователи:</h2>
      <div className="px-6 w-full">
        <AddUsersToOrganization
          users={users}
          organizationId={organization?.id || ""}
        />
      </div>
    </div>
  )
}

// <MembersTable members={organization?.members || []} />
