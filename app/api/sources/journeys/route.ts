import { NextRequest, NextResponse } from "next/server"
import {
  getBusesFromOrders,
  getRoutesFromOrders,
  getOrganizationsFromOrders,
  getJourneysWithFilters,
} from "@/server/orders"
import { Route, Bus, Journey } from "@/db/schema"
import { parseDate } from "@/lib/utils"

interface JourneyParams {
  carStateNumber: string[]
  routeUid: string[]
  counterpartyInn: string
  startDate: string
  endDate: string
}

type JourneyWithoutOrganization = Omit<Journey, "route"> & {
  route: Omit<Route, "organization">
}

// GET method
export async function POST(req: NextRequest) {
  const bbusApiKey = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""

  const body = await req.json()

  console.log("Received payload:", body)

  const { apiKey, journeyParams } = body
  const { carStateNumber, counterpartyInn, routeUid, startDate, endDate } =
    journeyParams as JourneyParams

  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }
  if (apiKey !== bbusApiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 })
  }

  const startISO = startDate
    ? parseDate(startDate + " 00.00.00")?.toISOString() || ""
    : ""
  const endISO = endDate
    ? parseDate(endDate + " 23.59.59")?.toISOString() || ""
    : ""

  console.log("Journey Params:", journeyParams)

  try {
    // Step 1. Find the organization based on partyTaxId data
    const organizations = await getOrganizationsFromOrders(
      systemUserId,
      counterpartyInn
    )

    if (organizations.length === 0) {
      throw new Error(
        `Organization with partyTaxId ${counterpartyInn} not found.`
      )
    }
    const organization = organizations[0]

    console.log("Found organization:", organization)

    // Step 2: Find the route record using getRoutes
    const routes: Route[] = []
    for (const id of routeUid) {
      const routeResults = await getRoutesFromOrders(
        systemUserId,
        organization.id,
        id
      )
      if (routeResults.length === 0) {
        throw new Error(`Route with routeId ${id} not found.`)
      }
      routes.push(...routeResults)
    }

    console.log("Found route:", routes)

    // Step 3: Find the bus record using getBuses
    const buses: Bus[] = []
    for (const plateNumber of carStateNumber) {
      const busResults = await getBusesFromOrders(
        systemUserId,
        organization.id,
        plateNumber
      )
      if (busResults.length === 0) {
        throw new Error(`Bus with plate number ${plateNumber} not found.`)
      }
      buses.push(...busResults)
    }

    console.log("Found bus:", buses)

    // Create arrays of busIds and routeIds
    const busIds = buses.map((bus) => bus.id)
    const routeIds = routes.map((route) => route.id)

    // Call getJourneysWithFilters with the required parameters
    const journeys: JourneyWithoutOrganization[] = await getJourneysWithFilters(
      busIds,
      routeIds,
      startISO,
      endISO
    )

    console.log("Found journeys:", journeys)

    return NextResponse.json(journeys)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
