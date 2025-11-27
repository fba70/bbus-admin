import { NextRequest, NextResponse } from "next/server"
import {
  getBusesFromOrders,
  getRoutesFromOrders,
  getOrganizationsFromOrders,
  updateBusFromOrders,
  getTimeSlots,
  createOrUpdateTimeSlot,
  deleteTimeSlots,
} from "@/server/orders"
import { TimeSlot } from "@/db/schema"

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
  const {
    routeUid1c,
    carStateNumber,
    counterpartyInn,
    orderUid1c,
    startDate,
    endDate,
  } = orderData

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
  // console.log("Parsed endDate:", parsedEndDate)

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

    // console.log("Found organization:", organization)

    // Step 2: Find the route record using getRoutes
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

    // Step 3: Find the bus record using getBuses and carStateNumber
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

    // Step 4: Create time slots for the route
    const timeSlotsData = {
      routeId: route.id,
      route1cId: route.routeId,
      startTimestamp: parsedStartDate,
      endTimestamp: parsedEndDate,
      orderId: orderUid1c,
      busId: bus.id,
    }

    const timeSlots = await createOrUpdateTimeSlot(orderUid1c, timeSlotsData)

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

// GET orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId") || undefined
    const timeSlotId = searchParams.get("id") || undefined

    if (timeSlotId) {
      // Get specific timeSlot by ID
      const timeSlots = await getTimeSlots("system", routeId, timeSlotId)
      if (timeSlots.length === 0) {
        return NextResponse.json(
          { error: "TimeSlot not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(timeSlots)
    } else {
      // Get all timeSlots, optionally filtered by routeId
      const timeSlots = await getTimeSlots("system", routeId || undefined)
      return NextResponse.json(timeSlots)
    }
  } catch (error) {
    console.error("Error fetching timeSlots:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE method
export async function DELETE(request: NextRequest) {
  try {
    const { ids }: { ids: string[] } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or missing IDs array" },
        { status: 400 }
      )
    }

    // Call the server function
    await deleteTimeSlots(ids)

    return NextResponse.json(
      { message: `Deleted ${ids.length} timeSlot(s)` },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting timeSlots:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH method
export async function PATCH(request: NextRequest) {
  try {
    const {
      timeSlotData,
    }: { timeSlotData: Omit<TimeSlot, "id" | "createdAt" | "updatedAt"> } =
      await request.json()

    if (!timeSlotData || !timeSlotData.orderId) {
      return NextResponse.json(
        { error: "Invalid timeSlot data or missing orderId" },
        { status: 400 }
      )
    }

    // Call the server function to create or update
    const result = await createOrUpdateTimeSlot(
      timeSlotData.orderId,
      timeSlotData
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error updating timeSlot:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
