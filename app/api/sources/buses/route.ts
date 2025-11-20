import { NextRequest, NextResponse } from "next/server"
import { updateBusDictionary } from "@/server/orders"
import { getBusesDictionary } from "@/server/buses"

// POST method
export async function POST(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""
  const systemOrganizationId = process.env.DEFAULT_CLIENT_ID || ""
  const systemRouteId = process.env.DEFAULT_ROUTE_ID || ""

  let requestBody
  try {
    requestBody = await req.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { apiKey, StateNumbersDictionary } = requestBody

  // console.log("Received bus data:", StateNumbersDictionary)
  //console.log("Received API key:", apiKey)

  if (!apiKey || (apiKey !== bbusApiKey && apiKey !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  // console.log("API key passed")

  if (!StateNumbersDictionary || StateNumbersDictionary.length === 0) {
    return NextResponse.json(
      { error: "Bus data or car state number is missing" },
      { status: 400 }
    )
  }

  // Construct busList object and pass it to updateBusDictionary
  const busList = StateNumbersDictionary.map(
    (carStateNumber: { StateNumber: string }) => ({
      organizationId: systemOrganizationId,
      routeId: systemRouteId,
      busPlateNumber: carStateNumber.StateNumber,
      busDescription: carStateNumber.StateNumber,
    })
  )

  // console.log("Constructed busList:", busList)

  try {
    const updatedBus = await updateBusDictionary(systemUserId, busList)
    return NextResponse.json(updatedBus, { status: 200 })
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

  const userId = process.env.SYSTEM_USER_ID || ""
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY

  if (!key || (key !== bbusApiKey && key !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  try {
    const buses = await getBusesDictionary(userId)
    return NextResponse.json(buses)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
