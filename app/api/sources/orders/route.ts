import { NextRequest, NextResponse } from "next/server"
import {
  getBusesFromOrders,
  getRoutesFromOrders,
  getOrganizationsFromOrders,
  updateBusFromOrders,
  getTimeSlots,
  createTimeSlots,
} from "@/server/orders"

function parseDateString(dateString: string): Date {
  const [datePart, timePart] = dateString.split(" ")
  const [day, month, year] = datePart.split(".")
  const [hours, minutes, seconds] = timePart.split(".")

  // Create and return a JavaScript Date object
  return new Date(
    Number(year),
    Number(month) - 1, // Months are 0-indexed in JavaScript
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  )
}

// POST method
export async function POST(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""

  const { apiKey, orderData } = await req.json()
  const { routeUid1c, carStateNumber, counterpartyInn, startDate, endDate } =
    orderData

  if (!apiKey || (apiKey !== bbusApiKey && apiKey !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  const parsedStartDate = parseDateString(startDate)
  const parsedEndDate = parseDateString(endDate)

  // console.log("Received order data:", orderData)
  // console.log("routeUid1c:", routeUid1c)
  // console.log("carStateNumber:", carStateNumber)
  // console.log("counterpartyInn:", counterpartyInn)
  // console.log("Parsed startDate:", parsedStartDate)
  //console.log("Parsed endDate:", parsedEndDate)

  try {
    // Step 0. Find the organization based on partyTaxId data
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

    // Step 1: Find the route record using getRoutes
    const routes = await getRoutesFromOrders({
      userId: systemUserId,
      organizationId: organization.id,
      orderRouteId: routeUid1c,
    })

    if (routes.length === 0) {
      throw new Error(`Route with routeId ${orderData.routeUid1c} not found.`)
    }

    const route = routes[0]

    // console.log("Found route:", route)

    if (organization.id != route.organizationId) {
      throw new Error(
        "Organizations do not match between existing route organization and order organization. Routes dictionary might be outdated. "
      )
    }

    // Step 3: Find the bus record using getBuses
    const buses = await getBusesFromOrders(
      systemUserId,
      organization.id,
      carStateNumber
    )
    if (buses.length === 0) {
      throw new Error(
        `Bus with plate number ${orderData.carStateNumber} not found.`
      )
    }
    const bus = buses[0]

    // console.log("Found bus:", bus)

    // Step 2: Create time slots for the route
    const timeSlotsData = {
      routeId: route.id,
      startTimestamp: parsedStartDate,
      endTimestamp: parsedEndDate,
    }

    const timeSlots = await createTimeSlots(systemUserId, timeSlotsData)

    // console.log("Created time slots:", timeSlots)

    // Step 5: Patch the bus record using updateBus
    const updatedBusData = {
      routeId: route.id,
      organizationId: organization.id,
    }

    const updatedBus = await updateBusFromOrders(
      systemUserId,
      bus.id,
      updatedBusData
    )

    // console.log("Updated bus:", updatedBus)

    return NextResponse.json(updatedBus, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
