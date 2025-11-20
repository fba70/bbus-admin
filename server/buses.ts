"use server"

import { db } from "@/db/drizzle"
import { Bus, bus } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

// GET action
export async function getBuses(
  userId: string,
  id?: string,
  orderBusPlateNumber?: string
): Promise<Bus[]> {
  if (id) {
    // Fetch a specific bus by bus ID
    const record = await db.query.bus.findFirst({
      where: eq(bus.id, id),
      with: {
        organization: true, // Include organization data
        route: true, // Include route data
      },
    })
    if (!record) {
      throw new Error(`Bus with ID ${id} not found.`)
    }

    /*
    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched bus with ID " + id,
    }
    await createLog(userId, logData)
    */

    return [record as Bus]
  } else if (orderBusPlateNumber) {
    // Fetch a specific bus by busPlateNumber
    const record = await db.query.bus.findFirst({
      where: eq(bus.busPlateNumber, orderBusPlateNumber),
    })
    if (!record) {
      throw new Error(`Bus with plate number ${orderBusPlateNumber} not found.`)
    }

    /*
    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched bus with plate number " + orderBusPlateNumber,
    }
    await createLog(userId, logData)
    */

    return [record as Bus]
  } else {
    // Fetch all buses with relations
    const allBuses = await db.query.bus.findMany({
      with: {
        organization: true, // Include organization data
        route: true, // Include route data
      },
    })

    /*
    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all buses",
    }
    await createLog(userId, logData)
    */

    return allBuses as Bus[]
  }
}

// GET action for the whole dictionary
export async function getBusesDictionary(userId: string): Promise<Bus[]> {
  // Fetch all buses with relations
  const allBuses = await db.query.bus.findMany({
    with: {
      route: true, // Include route data
    },
  })

  /*
    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all buses",
    }
    await createLog(userId, logData)
    */

  return allBuses as Bus[]
}

// POST action
export async function createBus(
  userId: string,
  busData: Omit<Bus, "id" | "createdAt" | "updatedAt">
): Promise<Bus> {
  const newBus = {
    ...busData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(bus).values(newBus)

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: "Created bus with ID " + newBus.id,
  }
  await createLog(userId, logData)

  return newBus
}

// PATCH action
export async function updateBus(
  userId: string,
  id: string,
  busData: Partial<Omit<Bus, "id" | "createdAt" | "updatedAt">>
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
    userId: userId,
    applicationId: null,
    logActionType: "UPDATE",
    timeStamp: new Date(),
    metadata: "Updated bus with ID " + id,
  }
  await createLog(userId, logData)

  return updatedBus as Bus
}
