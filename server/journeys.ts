"use server"

import { db } from "@/db/drizzle"
import {
  Journey,
  journey,
  AccessCard,
  accessCard,
  Route,
  route,
} from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

// GET action
export async function getJourneys(
  sessionUserId: string,
  id?: string
): Promise<Journey[]> {
  if (id) {
    // Fetch a specific journey by journeyId
    const record = await db.query.journey.findFirst({
      where: eq(journey.id, id),
      with: {
        accessCard: true,
        bus: true,
        route: {
          with: {
            organization: true, // Include organization data within the route
          },
        },
        application: true,
      },
    })
    if (!record) {
      throw new Error(`Journey with ID ${id} not found.`)
    }

    /*
    const logData: LogInput = {
      userId: sessionUserId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched journeys with ID " + id,
    }
    await createLog(sessionUserId, logData)
    */

    // console.log("Fetched route by ID:", record)
    return [record as Journey]
  } else {
    // Fetch all routes
    const allJourneys = await db.query.journey.findMany({
      with: {
        accessCard: true,
        bus: true,
        route: {
          with: {
            organization: true, // Include organization data within the route
          },
        },
        application: true,
      },
      orderBy: desc(journey.createdAt),
    })

    /*
    const logData: LogInput = {
      userId: sessionUserId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all journeys",
    }
    await createLog(sessionUserId, logData)
    */

    // console.log("Fetched all routes:", allRoutes)
    return allJourneys as Journey[]
  }
}

// POST action
export async function createJourney(
  sessionUserId: string,
  journeyData: Omit<Journey, "id" | "createdAt" | "updatedAt">
): Promise<Journey> {
  const newJourney = {
    ...journeyData,
    journeyTimeStamp: new Date(journeyData.journeyTimeStamp), // Convert to Date object
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(journey).values(newJourney)

  const journeyRoute = await db.query.route.findFirst({
    where: eq(route.id, newJourney.routeId),
  })

  if (!journeyRoute) {
    throw new Error(`Route with ID ${newJourney.routeId} not found.`)
  }

  // App check if the user card is in the cards dictionary, if not it adds newCard data to the journey
  // If new card comes we add it to the dictionary with INACTIVE status
  if (journeyData.newCardId || journeyData.newCardType) {
    const newAccesscard: typeof accessCard.$inferInsert = {
      id: crypto.randomUUID(), // Generate a unique ID
      cardId: journeyData.newCardId!,
      nameOnCard: "",
      cardType: journeyData.newCardType!,
      cardStatus: "INACTIVE",
      organizationId: journeyRoute.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(accessCard).values(newAccesscard)

    // Update the journey record with the new accessCardId
    await db
      .update(journey)
      .set({ accessCardId: newAccesscard.id })
      .where(eq(journey.id, newJourney.id))
  }

  const logData: LogInput = {
    userId: sessionUserId,
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: "Created journey with ID " + newJourney.id,
  }
  await createLog(sessionUserId, logData)

  return newJourney
}

// PATCH action
export async function updateJourney(
  sessionUserId: string,
  id: string,
  journeyData: Partial<Omit<Journey, "id" | "createdAt" | "updatedAt">>
): Promise<Journey> {
  const [existingJourney] = await db
    .select()
    .from(journey)
    .where(eq(journey.id, id))
  if (!existingJourney) {
    throw new Error(`Journey with ID ${id} not found.`)
  }

  const updatedJourney = {
    ...existingJourney,
    ...journeyData,
    updatedAt: new Date(),
  }

  await db.update(journey).set(updatedJourney).where(eq(journey.id, id))

  const logData: LogInput = {
    userId: sessionUserId,
    applicationId: null,
    logActionType: "UPDATE",
    timeStamp: new Date(),
    metadata: "Updated journey with ID " + id,
  }
  await createLog(sessionUserId, logData)

  return updatedJourney as Journey
}
