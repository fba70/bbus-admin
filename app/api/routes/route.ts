import { NextResponse, NextRequest } from "next/server"
import { getRoutes, createRoute, updateRoute } from "@/server/routes"

// GET method
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const id = searchParams.get("routeId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const routes = id ? await getRoutes(userId, id) : await getRoutes(userId)
    return NextResponse.json(routes)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST method
export async function POST(req: NextRequest) {
  const { userId, ...routeData } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const newRoute = await createRoute(userId, routeData)
    return NextResponse.json(newRoute, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH method
export async function PATCH(req: NextRequest) {
  const { userId, id, ...routeData } = await req.json()

  if (!userId || !id) {
    return NextResponse.json(
      { error: "Missing userId or routeId" },
      { status: 400 }
    )
  }

  try {
    const updatedRoute = await updateRoute(userId, id, routeData)
    return NextResponse.json(updatedRoute)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
