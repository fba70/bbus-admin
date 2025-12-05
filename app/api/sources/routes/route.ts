import { NextRequest, NextResponse } from "next/server"
import { updateRouteDictionary } from "@/server/orders"
import { getOrganizations } from "@/server/clients"
import { getRoutesDictionary, getRoutes } from "@/server/routes"

interface Route {
  organizationId: string
  routeId: string
  routeName: string
  routeMode: string
  routeDescription: string
  taxId?: string
}

// POST method
export async function POST(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""
  const systemOrganizationId = process.env.DEFAULT_CLIENT_ID || ""
  // const systemRouteId = process.env.DEFAULT_ROUTE_ID || ""

  let requestBody
  try {
    requestBody = await req.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { apiKey, RoutesDictionary } = requestBody

  // console.log("Received routes data:", RoutesDictionary)

  if (!apiKey || (apiKey !== bbusApiKey && apiKey !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  if (!RoutesDictionary || RoutesDictionary.length === 0) {
    return NextResponse.json(
      { error: "Routes dictionary data is missing" },
      { status: 400 }
    )
  }

  // Construct busList object and pass it to updateBusDictionary
  const routesList = RoutesDictionary.map(
    (routDictionary: {
      routeUid1c: string
      counterpartyInn: string
      routeUid: string
    }) => ({
      organizationId: systemOrganizationId,
      routeId: routDictionary.routeUid,
      routeName: routDictionary.routeUid,
      routeMode: "REGISTRATION",
      routeDescription:
        routDictionary.routeUid1c + " - " + routDictionary.counterpartyInn,
      taxId: routDictionary.counterpartyInn,
    })
  )

  // console.log("Constructed routesList:", routesList)

  // Check existing organizations and their taxIds to match with the new routes data
  const organizations = await getOrganizations(systemUserId)
  const parsedOrganizations = organizations.map((org) => {
    const metadata = org.metadata ? JSON.parse(org.metadata) : {}
    return {
      orgId: org.id,
      orgTaxId: metadata.taxId || null, // Extract taxId or set to null if not present
    }
  })

  // console.log("Parsed organizations:", parsedOrganizations)

  // Construct finalUpdatedRoutes by matching taxId with parsedOrganizations.orgTaxId
  let finalUpdatedRoutes: Route[] = []

  try {
    // Construct finalUpdatedRoutes by matching taxId with parsedOrganizations.orgTaxId
    finalUpdatedRoutes = routesList.map((route: Route) => {
      const matchedOrganization = parsedOrganizations.find(
        (org) => org.orgTaxId === route.taxId
      )

      if (!matchedOrganization) {
        throw new Error(
          "No organization found to map to for tax ID(s). Check the clients dictionary first."
        )
      }

      return {
        organizationId: matchedOrganization.orgId, // Use the matched organization's ID
        routeId: route.routeId,
        routeName: route.routeName,
        routeMode: route.routeMode,
        routeDescription: route.routeDescription,
      }
    })

    // console.log("Final updated routes:", finalUpdatedRoutes)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const updatedRoutes = await updateRouteDictionary(systemUserId, routesList)
    return NextResponse.json(updatedRoutes, { status: 200 })
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
  const orderRouteId1c = searchParams.get("orderRouteId1c")

  const userId = process.env.SYSTEM_USER_ID || ""
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY

  if (!key || (key !== bbusApiKey && key !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  try {
    let routes
    if (orderRouteId1c) {
      routes = await getRoutes(userId, undefined, orderRouteId1c)
    } else {
      routes = await getRoutesDictionary(userId)
    }
    return NextResponse.json(routes)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
