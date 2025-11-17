import { NextRequest, NextResponse } from "next/server"
import {
  getBusesFromOrders,
  getRoutesFromOrders,
  getOrganizationsFromOrders,
  getJourneysWithFilters,
} from "@/server/orders"
import {
  Route,
  route,
  Bus,
  bus,
  Organization,
  organization,
  Journey,
  journey,
} from "@/db/schema"

interface JourneyParams {
  carStateNumber: string[]
  routeUid: string[]
  counterpartyInn: string
  startTime: string
  endTime: string
}

// GET method
export async function GET(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""

  const { apiKey, journeyParams } = await req.json()
  const { carStateNumber, counterpartyInn, routeUid, startTime, endTime } =
    journeyParams as JourneyParams

  if (!apiKey || apiKey !== bbusApiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  try {
    // Step 1: Find the route record using getRoutes
    const routes: Route[] = []
    for (const id of routeUid) {
      const routeResults = await getRoutesFromOrders(systemUserId, id)
      if (routeResults.length === 0) {
        throw new Error(`Route with routeId ${id} not found.`)
      }
      routes.push(...routeResults)
    }

    // console.log("Found route:", route)

    // Step 2: Find the bus record using getBuses
    const buses: Bus[] = []
    for (const plateNumber of carStateNumber) {
      const busResults = await getBusesFromOrders(systemUserId, plateNumber)
      if (busResults.length === 0) {
        throw new Error(`Bus with plate number ${plateNumber} not found.`)
      }
      buses.push(...busResults)
    }

    // console.log("Found bus:", bus)

    // Step 3. Find the organization based on partyTaxId data
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

    // console.log("Found organization:", organization)

    // Create arrays of busIds and routeIds
    const busIds = buses.map((bus) => bus.id)
    const routeIds = routes.map((route) => route.id)

    // Call getJourneysWithFilters with the required parameters
    const journeys: Journey[] = await getJourneysWithFilters(
      busIds,
      routeIds,
      startTime,
      endTime
    )

    return NextResponse.json(journeys)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
