"use server"

import { db } from "@/db/drizzle"
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
import { eq } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

/*
{
        with: {
          organization: true,
        },
      }
*/

type JourneyWithoutOrganization = Omit<Journey, "route"> & {
  route: Omit<Route, "organization">
}

export async function getJourneysWithFilters(
  busIds: string[],
  routeIds: string[],
  startTime: string,
  endTime: string
): Promise<JourneyWithoutOrganization[]> {
  const allJourneys = await db.query.journey.findMany({
    with: {
      accessCard: true,
      bus: true,
      route: true, // No nested `organization`
      application: true,
    },
  })

  const filteredJourneys = allJourneys.filter((journey) => {
    return (
      (!busIds || busIds.length === 0 || busIds.includes(journey.busId)) &&
      (!routeIds ||
        routeIds.length === 0 ||
        routeIds.includes(journey.routeId)) &&
      (!startTime ||
        new Date(journey.journeyTimeStamp) >= new Date(startTime)) &&
      (!endTime || new Date(journey.journeyTimeStamp) <= new Date(endTime))
    )
  })

  return filteredJourneys
}

export async function getOrganizationsFromOrders(
  userId: string,
  partyTaxId: string
): Promise<Organization[]> {
  // Fetch all organizations
  const records = await db.query.organization.findMany()

  // Parse metadata and find the matching organization
  const record = records.find((org) => {
    const metadata = org.metadata ? JSON.parse(org.metadata) : {}
    return metadata.taxId === partyTaxId
  })

  if (!record) {
    throw new Error(`Organization with partyTaxId ${partyTaxId} not found.`)
  }

  return [record as Organization]
}

export async function getRoutesFromOrders(
  userId: string,
  organizationId: string, // Organization ID is now required
  orderRouteId?: string // Make this parameter optional
): Promise<Route[]> {
  if (!organizationId) {
    throw new Error("Organization ID is required.")
  }

  if (!orderRouteId) {
    // Fetch all routes for the given organization if orderRouteId is not provided
    const records = await db.query.route.findMany({
      where: eq(route.organizationId, organizationId), // Use eq directly
    })

    if (!records || records.length === 0) {
      throw new Error(`No routes found for organizationId ${organizationId}.`)
    }

    return records as Route[]
  }

  // Fetch a specific route by routeId for the given organization
  const record = await db.query.route.findFirst({
    where: (fields) =>
      eq(fields.routeId, orderRouteId) &&
      eq(fields.organizationId, organizationId), // Combine conditions explicitly
  })

  if (!record) {
    throw new Error(
      `Route with routeId ${orderRouteId} not found for organizationId ${organizationId}.`
    )
  }

  return [record as Route]
}

export async function getBusesFromOrders(
  userId: string,
  organizationId: string, // Organization ID is now required
  orderBusPlateNumber?: string // Make this parameter optional
): Promise<Bus[]> {
  if (!organizationId) {
    throw new Error("Organization ID is required.")
  }

  if (!orderBusPlateNumber) {
    // Fetch all buses for the given organization if orderBusPlateNumber is not provided
    const records = await db.query.bus.findMany({
      where: eq(bus.organizationId, organizationId), // Use eq directly
    })

    if (!records || records.length === 0) {
      throw new Error(`No buses found for organizationId ${organizationId}.`)
    }

    return records as Bus[]
  }

  // Fetch a specific bus by busPlateNumber for the given organization
  const record = await db.query.bus.findFirst({
    where: (fields) =>
      eq(fields.busPlateNumber, orderBusPlateNumber) &&
      eq(fields.organizationId, organizationId), // Combine conditions explicitly
  })

  if (!record) {
    throw new Error(
      `Bus with plate number ${orderBusPlateNumber} not found for organizationId ${organizationId}.`
    )
  }

  return [record as Bus]
}

export async function updateBusFromOrders(
  userId: string,
  id: string,
  busData: Partial<Omit<Bus, "id" | "createdAt">>
): Promise<Bus> {
  const [existingBus] = await db.select().from(bus).where(eq(bus.id, id))

  if (!existingBus) {
    throw new Error(`Bus with ID ${id} not found.`)
  }

  const updatedBus = {
    ...existingBus,
    ...busData,
    updatedAt: new Date(),
  }

  await db.update(bus).set(updatedBus).where(eq(bus.id, id))

  const logData: LogInput = {
    userId: userId || "",
    applicationId: null,
    logActionType: "UPDATE",
    timeStamp: new Date(),
    metadata: "Updated bus with ID " + id,
  }
  await createLog(userId, logData)

  return updatedBus as Bus
}

export async function updateBusDictionary(
  userId: string,
  busData: Partial<Omit<Bus, "id" | "createdAt" | "updatedAt">>[]
): Promise<Bus[]> {
  // Step 1: Fetch all existing buses
  const existingBuses = await db.select().from(bus)

  // Step 2: Match with busData by busPlateNumber and find new records
  const existingBusPlateNumbers = new Set(
    existingBuses.map((b) => b.busPlateNumber).filter(Boolean)
  )

  const newBuses = busData.filter((b) => {
    if (!b.busPlateNumber) {
      console.warn("Invalid bus data:", b)
      return false
    }
    return !existingBusPlateNumbers.has(b.busPlateNumber)
  })

  if (newBuses.length === 0) {
    console.log("No new buses to add.")
    return []
  }

  // Step 3: Add all new records to the bus table
  const busesToInsert = newBuses.map((b) => ({
    ...b,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  const validBusesToInsert = busesToInsert
    .filter((bus) => bus.organizationId && bus.routeId && bus.busPlateNumber) // Ensure required fields are present
    .map((bus) => ({
      id: bus.id,
      createdAt: bus.createdAt,
      updatedAt: bus.updatedAt,
      organizationId: bus.organizationId as string,
      routeId: bus.routeId as string,
      busPlateNumber: bus.busPlateNumber as string,
      busDescription: bus.busDescription || null,
    }))

  await db.insert(bus).values(validBusesToInsert)

  const logData: LogInput = {
    userId: userId || "",
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: `Added ${newBuses.length} new buses to the dictionary`,
  }
  await createLog(userId, logData)

  return busesToInsert as Bus[]
}

export async function updateRouteDictionary(
  userId: string,
  routeData: Partial<Omit<Route, "id" | "createdAt" | "updatedAt">>[]
): Promise<Route[]> {
  // Step 1: Fetch all existing routes
  const existingRoutes = await db.select().from(route)

  // Step 2: Match with routeData by routeId and find new records
  const existingRouteIds = new Set(
    existingRoutes.map((r) => r.routeId).filter(Boolean)
  )

  const newRoutes = routeData.filter((r) => {
    if (!r.routeId) {
      console.warn("Invalid route data:", r)
      return false
    }
    return !existingRouteIds.has(r.routeId)
  })

  if (newRoutes.length === 0) {
    console.log("No new routes to add.")
    return []
  }

  // Step 3: Add all new records to the route table
  const routesToInsert = newRoutes.map((r) => ({
    ...r,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    routeName: r.routeName || "Unknown Route", // Default value
    routeMode: r.routeMode || "REGISTRATION", // Default value
  }))

  const validRoutesToInsert = routesToInsert
    .filter((route) => route.organizationId) // Ensure required fields are present
    .map((route) => ({
      id: route.id,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      organizationId: route.organizationId as string,
      routeId: route.routeId as string,
      routeName: route.routeName,
      routeMode: route.routeMode,
      routeDescription: route.routeDescription || null,
    }))

  await db.insert(route).values(validRoutesToInsert)

  const logData: LogInput = {
    userId: userId || "",
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: `Added ${newRoutes.length} new routes to the dictionary`,
  }
  await createLog(userId, logData)

  return validRoutesToInsert as Route[]
}
