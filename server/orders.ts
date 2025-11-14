"use server"

import { db } from "@/db/drizzle"
import { Route, route, Bus, bus, Organization, organization } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

export async function getOrganizationsFromOrders(
  userId: string,
  partyTaxId: string
): Promise<Organization[]> {
  // Fetch all organizations and filter in JavaScript
  const records = await db.query.organization.findMany()

  // Parse metadata and find the matching organization
  const record = records.find((org) => {
    const metadata = org.metadata ? JSON.parse(org.metadata) : {}
    return metadata.taxId === partyTaxId
  })

  if (!record) {
    throw new Error(`Organization with partyTaxId ${partyTaxId} not found.`)
  }

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "GET",
    timeStamp: new Date(),
    metadata: "Fetched organization with partyTaxId " + partyTaxId,
  }
  await createLog(userId, logData)

  return [record as Organization]
}

export async function getRoutesFromOrders(
  userId: string,
  orderRouteId: string
): Promise<Route[]> {
  // Fetch a specific route by routeId
  const record = await db.query.route.findFirst({
    where: eq(route.routeId, orderRouteId),
  })

  if (!record) {
    throw new Error(`Route with routeId ${orderRouteId} not found.`)
  }

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "GET",
    timeStamp: new Date(),
    metadata: "Fetched route with routeId " + orderRouteId,
  }
  await createLog(userId, logData)

  return [record as Route]
}

export async function getBusesFromOrders(
  userId: string,
  orderBusPlateNumber: string
): Promise<Bus[]> {
  if (!orderBusPlateNumber) {
    throw new Error(`Bus with plate number parameter is mandatory`)
  }

  // Fetch a specific bus by busPlateNumber
  const record = await db.query.bus.findFirst({
    where: eq(bus.busPlateNumber, orderBusPlateNumber),
  })
  if (!record) {
    throw new Error(`Bus with plate number ${orderBusPlateNumber} not found.`)
  }

  const logData: LogInput = {
    userId: userId || "",
    applicationId: null,
    logActionType: "GET",
    timeStamp: new Date(),
    metadata: "Fetched bus with plate number " + orderBusPlateNumber,
  }
  await createLog(userId, logData)

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
