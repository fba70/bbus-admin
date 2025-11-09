import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"
import { getJourneys, createJourney, updateJourney } from "@/server/journeys"

// GET method
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionUserId = searchParams.get("sessionUserId")
  const id = searchParams.get("id")

  if (!sessionUserId) {
    return NextResponse.json(
      { error: "Missing sessionUserId" },
      { status: 400 }
    )
  }

  try {
    const journeys = await getJourneys(sessionUserId, id || undefined)
    return NextResponse.json(journeys)
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

  const { sessionUserId, ...journeyData } = await req.json()

  if (!sessionUserId) {
    return NextResponse.json(
      { error: "Missing sessionUserId" },
      { status: 400 }
    )
  }

  try {
    const newJourney = await createJourney(sessionUserId, journeyData)
    return NextResponse.json(newJourney, { status: 201 })
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

  const { sessionUserId, id, ...journeyData } = await req.json()

  if (!sessionUserId || !id) {
    return NextResponse.json(
      { error: "Missing sessionUserId or id" },
      { status: 400 }
    )
  }

  try {
    const updatedJourney = await updateJourney(sessionUserId, id, journeyData)
    return NextResponse.json(updatedJourney)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
