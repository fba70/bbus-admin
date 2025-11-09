import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"
import {
  getApplications,
  createApplication,
  updateApplication,
} from "@/server/applications"

// GET method
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const id = searchParams.get("id")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const applications = await getApplications(userId, id || undefined)
    return NextResponse.json(applications)
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

  const { sessionUserId, ...applicationData } = await req.json()

  if (!sessionUserId) {
    return NextResponse.json(
      { error: "Missing sessionUserId" },
      { status: 400 }
    )
  }

  try {
    const newApplication = await createApplication(
      sessionUserId,
      applicationData
    )
    return NextResponse.json(newApplication, { status: 201 })
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

  const { sessionUserId, id, ...applicationData } = await req.json()

  if (!sessionUserId || !id) {
    return NextResponse.json(
      { error: "Missing sessionUserId or id" },
      { status: 400 }
    )
  }

  try {
    const updatedApplication = await updateApplication(
      sessionUserId,
      id,
      applicationData
    )
    return NextResponse.json(updatedApplication)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
