import { NextRequest, NextResponse } from "next/server"
import {
  getAccessCards,
  getAccessCardsByTaxId,
  loadAccessCards,
} from "@/server/access-cards"

// POST method
export async function POST(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""
  const systemOrganizationId = process.env.DEFAULT_CLIENT_ID || ""

  let requestBody

  try {
    requestBody = await req.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { apiKey, cardsData } = requestBody

  // console.log("Received bus data:", StateNumbersDictionary)
  //console.log("Received API key:", apiKey)

  if (!apiKey || (apiKey !== bbusApiKey && apiKey !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  // console.log("API key passed")

  if (!cardsData || cardsData.length === 0) {
    return NextResponse.json(
      { error: "Bus data or car state number is missing" },
      { status: 400 }
    )
  }

  try {
    const updatedCards = await loadAccessCards(systemUserId, cardsData)
    return NextResponse.json(updatedCards, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET method
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  const counterpartyInn = searchParams.get("counterpartyInn") // New param

  const userId = process.env.SYSTEM_USER_ID || ""
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY

  if (!key || (key !== bbusApiKey && key !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  try {
    let cards
    if (counterpartyInn) {
      // Fetch filtered access cards by taxId
      cards = await getAccessCardsByTaxId(userId, counterpartyInn)
    } else {
      // Fallback to fetching all access cards
      cards = await getAccessCards(userId)
    }
    return NextResponse.json(cards)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
