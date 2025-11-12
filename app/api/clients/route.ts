import { NextResponse, NextRequest } from "next/server"
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
} from "@/server/clients"
import { getServerSession } from "@/lib/get-session"

// GET method
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const id = searchParams.get("routeId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const organizations = id
      ? await getOrganizations(userId, id)
      : await getOrganizations(userId)
    return NextResponse.json(organizations)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST method
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId, ...organizationData } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const newOrganization = await createOrganization(userId, organizationData)
    return NextResponse.json(newOrganization, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH method
export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId, id, ...organizationData } = await req.json()

  if (!userId || !id) {
    return NextResponse.json(
      { error: "Missing userId or routeId" },
      { status: 400 }
    )
  }

  try {
    const updatedOrganization = await updateOrganization(
      userId,
      id,
      organizationData
    )
    return NextResponse.json(updatedOrganization)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
