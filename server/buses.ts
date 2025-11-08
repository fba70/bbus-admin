"use server"

import { db } from "@/db/drizzle"
import { Bus, bus } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET action
export async function getBuses(userId: string, id?: string): Promise<Bus[]> {
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

    // console.log("Fetched bus by ID:", record)
    return [record as Bus]
  } else {
    // Fetch all buses with relations
    const allBuses = await db.query.bus.findMany({
      with: {
        organization: true, // Include organization data
        route: true, // Include route data
      },
    })
    // console.log("Fetched all buses:", allBuses)
    return allBuses as Bus[]
  }
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
  return updatedBus as Bus
}
