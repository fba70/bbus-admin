"use server"

import { db } from "@/db/drizzle"
import { AccessCard, accessCard } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

// GET action
export async function getAccessCards(
  userId: string,
  id?: string
): Promise<AccessCard[]> {
  if (id) {
    // Fetch a specific access card by access card ID
    const record = await db.query.accessCard.findFirst({
      where: eq(accessCard.id, id),
      with: {
        organization: true, // Include organization data
      },
    })

    if (!record) {
      throw new Error(`Access card with ID ${id} not found.`)
    }

    /*
    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched access card with ID " + id,
    }
    await createLog(userId, logData)
    */

    // console.log("Fetched access card by ID:", record)
    return [record as AccessCard]
  } else {
    // Fetch all access cards
    const allAccessCards = await db.query.accessCard.findMany({
      with: {
        organization: true, // Include organization data
      },
    })

    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all access cards",
    }
    await createLog(userId, logData)

    // console.log("Fetched all access cards:", allAccessCards)
    return allAccessCards as AccessCard[]
  }
}

// POST action
export async function createAccessCard(
  userId: string,
  cardData: Omit<AccessCard, "id" | "createdAt" | "updatedAt">
): Promise<AccessCard> {
  const newAccesscard = {
    ...cardData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(accessCard).values(newAccesscard)

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: "Created access card with ID " + newAccesscard.id,
  }
  await createLog(userId, logData)

  return newAccesscard
}

// PATCH action
export async function updateAccessCard(
  userId: string,
  id: string,
  cardData: Partial<Omit<AccessCard, "id" | "createdAt" | "updatedAt">>
): Promise<AccessCard> {
  const [existingAccessCard] = await db
    .select()
    .from(accessCard)
    .where(eq(accessCard.id, id))
  if (!existingAccessCard) {
    throw new Error(`Access card with ID ${id} not found.`)
  }

  const updatedAccessCard = {
    ...existingAccessCard,
    ...cardData,
    updatedAt: new Date(),
  }

  await db
    .update(accessCard)
    .set(updatedAccessCard)
    .where(eq(accessCard.id, id))

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "UPDATE",
    timeStamp: new Date(),
    metadata: "Updated access card with ID " + id,
  }
  await createLog(userId, logData)

  return updatedAccessCard as AccessCard
}
