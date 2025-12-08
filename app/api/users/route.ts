import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"
import { getUsers } from "@/server/users"
import { deleteUserFromDB } from "@/server/delete-user"

// GET All Users within the Organization method
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get("organizationId")
  const id = searchParams.get("id")

  if (!organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 }
    )
  }

  try {
    const users = await getUsers(organizationId)
    return NextResponse.json(users)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE User method
export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const result = await deleteUserFromDB(userId)
    if (result.success) {
      return NextResponse.json({ message: "User deleted successfully" })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
