import AllUsers from "@/components/all-users"
import MembersTable from "@/components/members-table"
import { getOrganizationBySlug } from "@/server/organizations"
import { getUsers } from "@/server/users"

type Params = Promise<{ slug: string }>

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params

  const organization = await getOrganizationBySlug(slug)
  const users = await getUsers(organization?.id || "")

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">{organization?.name}</h1>
      <h2 className="text-xl font-bold mt-4">Пользователи:</h2>
      <div className="px-6 w-full">
        <MembersTable members={organization?.members || []} />
      </div>

      <h2 className="text-xl font-bold mt-4">Новые пользователи:</h2>
      <AllUsers users={users} organizationId={organization?.id || ""} />
    </div>
  )
}
