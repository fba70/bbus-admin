import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"
import {
  getAccessCards,
  getAccessCardsByCardId,
  createAccessCard,
  updateAccessCard,
  deleteAccessCards,
  getAccessCardsByOrganizationId,
} from "@/server/access-cards"

// GET method
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const cardId = searchParams.get("id")
  const organizationId = searchParams.get("organizationId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    let cards
    if (cardId) {
      cards = await getAccessCardsByCardId(userId, cardId)
    } else if (organizationId) {
      cards = await getAccessCardsByOrganizationId(userId, organizationId)
    } else {
      cards = await getAccessCards(userId, undefined)
    }
    return NextResponse.json(cards)
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

  const { userId, ...cardData } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const newCard = await createAccessCard(userId, cardData)
    return NextResponse.json(newCard, { status: 201 })
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

  const { userId, id, ...cardData } = await req.json()

  if (!userId || !id) {
    return NextResponse.json({ error: "Missing userId or id" }, { status: 400 })
  }

  try {
    const updatedCard = await updateAccessCard(userId, id, cardData)
    return NextResponse.json(updatedCard)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE handler
export async function DELETE(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId, ids } = await request.json()
    const result = await deleteAccessCards(userId, ids)
    return Response.json({ message: "Deletion successful", ...result })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
