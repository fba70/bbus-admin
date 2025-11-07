"use server"

import { db } from "@/db/drizzle"
import { Route, route } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET action
export async function getRoutes(userId: string, id?: string): Promise<Route[]> {
  if (id) {
    // Fetch a specific route by routeId
    const [record] = await db.select().from(route).where(eq(route.routeId, id))
    if (!record) {
      throw new Error(`Route with ID ${id} not found.`)
    }

    // console.log("Fetched route by ID:", record)
    return [record as Route]
  } else {
    // Fetch all routes
    const allRoutes = await db.select().from(route)
    // console.log("Fetched all routes:", allRoutes)
    return allRoutes as Route[]
  }
}

// POST action
export async function createRoute(
  userId: string,
  routeData: Omit<Route, "id" | "createdAt" | "updatedAt">
): Promise<Route> {
  const newRoute = {
    ...routeData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(route).values(newRoute)
  return newRoute
}

// PATCH action
export async function updateRoute(
  userId: string,
  id: string,
  routeData: Partial<Omit<Route, "id" | "createdAt" | "updatedAt">>
): Promise<Route> {
  const [existingRoute] = await db.select().from(route).where(eq(route.id, id))
  if (!existingRoute) {
    throw new Error(`Route with ID ${id} not found.`)
  }

  const updatedRoute = {
    ...existingRoute,
    ...routeData,
    updatedAt: new Date(),
  }

  await db.update(route).set(updatedRoute).where(eq(route.id, id))
  return updatedRoute as Route
}
