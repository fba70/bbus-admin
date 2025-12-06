"use server"

import { db } from "@/db/drizzle"
import { organization, bus, route, accessCard, journey } from "@/db/schema"
import { count } from "drizzle-orm"

export type Stats = {
  organizations: number
  buses: number
  routes: number
  accessCards: number
  journeys: number
}

export async function getStats(): Promise<Stats> {
  // Use aggregate counts via drizzle's `count()` helper.
  const orgRes = await db.select({ count: count() }).from(organization)
  const busRes = await db.select({ count: count() }).from(bus)
  const routeRes = await db.select({ count: count() }).from(route)
  const cardRes = await db.select({ count: count() }).from(accessCard)
  const journeyRes = await db.select({ count: count() }).from(journey)

  const organizations = Number(orgRes[0]?.count ?? 0)
  const buses = Number(busRes[0]?.count ?? 0)
  const routes = Number(routeRes[0]?.count ?? 0)
  const accessCards = Number(cardRes[0]?.count ?? 0)
  const journeys = Number(journeyRes[0]?.count ?? 0)

  return { organizations, buses, routes, accessCards, journeys }
}
