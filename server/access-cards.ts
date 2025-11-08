"use server"

import { db } from "@/db/drizzle"
import { AccessCard, accessCard } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET action
export async function getAccessCards(
  userId: string,
  id?: string
): Promise<AccessCard[]> {
  if (id) {
    // Fetch a specific access card by access card ID
    const [record] = await db
      .select()
      .from(accessCard)
      .where(eq(accessCard.id, id))
    if (!record) {
      throw new Error(`Access card with ID ${id} not found.`)
    }

    // console.log("Fetched access card by ID:", record)
    return [record as AccessCard]
  } else {
    // Fetch all access cards
    const allAccessCards = await db.select().from(accessCard)
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
  return updatedAccessCard as AccessCard
}
