"use server"

import { db } from "@/db/drizzle"
import { Journey, journey } from "@/db/schema"
import { eq } from "drizzle-orm"
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
        route: true,
        application: true,
      },
    })
    if (!record) {
      throw new Error(`Journey with ID ${id} not found.`)
    }

    const logData: LogInput = {
      userId: sessionUserId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched journeys with ID " + id,
    }
    await createLog(sessionUserId, logData)

    // console.log("Fetched route by ID:", record)
    return [record as Journey]
  } else {
    // Fetch all routes
    const allJourneys = await db.query.journey.findMany({
      with: {
        accessCard: true,
        bus: true,
        route: true,
        application: true,
      },
    })

    const logData: LogInput = {
      userId: sessionUserId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all journeys",
    }
    await createLog(sessionUserId, logData)

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
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(journey).values(newJourney)

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
