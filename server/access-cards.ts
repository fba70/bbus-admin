"use server"

import { db } from "@/db/drizzle"
import { AccessCard, accessCard } from "@/db/schema"
import { getOrganizations } from "@/server/clients"
import { eq, and, inArray } from "drizzle-orm"
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

    // console.log("Fetched access card by ID:", record)
    return [record as AccessCard]
  } else {
    // Fetch all access cards
    // console.log("Fetching all access cards...")
    const allAccessCards = await db.query.accessCard.findMany({
      with: {
        organization: true, // Include organization data
      },
      limit: 500,
    })

    console.log("Fetched cards:", allAccessCards)
    return allAccessCards as AccessCard[]
  }
}

// GET action
export async function getAccessCardsByCardId(
  userId: string,
  cardId: string
): Promise<AccessCard[]> {
  // Fetch a specific access card by access card ID
  const record = await db.query.accessCard.findFirst({
    where: eq(accessCard.cardId, cardId),
  })

  if (!record) {
    throw new Error(`Access card with ID ${cardId} not found.`)
  }

  // console.log("Fetched access card by ID:", record)
  return [record as AccessCard]
}

// GET action - Fetch access cards by counterpartyInn (taxId)
export async function getAccessCardsByTaxId(
  userId: string,
  counterpartyInn: string,
  cardId?: string
): Promise<AccessCard[]> {
  // Step 1: Fetch all organizations directly
  const allOrganizations = await db.query.organization.findMany()

  // Step 2: Find organization with taxId equal to counterpartyInn
  const organization = allOrganizations.find((org) => {
    const metadata = org.metadata ? JSON.parse(org.metadata) : {}
    return metadata.taxId === counterpartyInn
  })

  if (!organization) {
    console.warn(`Organization with taxId ${counterpartyInn} not found.`)
    return [] // Return empty array if no organization found
  }

  // Step 3: Fetch access cards belonging to the organization
  let accessCards

  if (cardId) {
    accessCards = await db.query.accessCard.findMany({
      where: and(
        eq(accessCard.organizationId, organization.id),
        eq(accessCard.cardId, cardId)
      ),
    })
  } else {
    accessCards = await db.query.accessCard.findMany({
      where: eq(accessCard.organizationId, organization.id),
    })
  }

  return accessCards as AccessCard[]
}

// GET action - Fetch access cards by counterpartyInn (taxId)
export async function getAccessCardsByOrganizationId(
  userId: string,
  organizationId: string
): Promise<AccessCard[]> {
  let accessCards

  if (organizationId) {
    accessCards = await db.query.accessCard.findMany({
      where: eq(accessCard.organizationId, organizationId),
    })
  } else {
    accessCards = await db.query.accessCard.findMany({
      where: eq(accessCard.organizationId, organizationId),
    })
  }

  return accessCards as AccessCard[]
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

// POST action
export async function loadAccessCards(
  userId: string,
  sourceData: Array<{
    counterpartyInn: string
    passNumber: string
    fullName: string
    passStatus?: string
    passType?: string
  }>
): Promise<AccessCard[]> {
  const importedCards: AccessCard[] = []

  const allOrganizations = await getOrganizations(userId) // Assumes getOrganizations can fetch all when no inn is provided; adjust if needed

  for (const item of sourceData) {
    // Step 1: Find organization by counterpartyInn (taxId) from the fetched list
    const organization = allOrganizations.find((org) => {
      const metadata = org.metadata ? JSON.parse(org.metadata) : {}
      return metadata.taxId === item.counterpartyInn
    })

    if (!organization) {
      console.warn(
        `Нет клиента с ИНН: ${item.counterpartyInn}. Пропускаем импорт карты с номером: ${item.passNumber}`
      )
      continue
    }

    const organizationId = organization.id

    // Step 2: Map and normalize fields
    const cardId = item.passNumber // Direct map
    const nameOnCard = item.fullName || null // Direct map, allow empty
    const cardStatus = item.passStatus
      ? (item.passStatus.toUpperCase() as "ACTIVE" | "INACTIVE" | "SUSPENDED")
      : "ACTIVE"
    const cardType = item.passType
      ? (item.passType.toUpperCase() as "NFC" | "RFID" | "QR_CODE")
      : "NFC"

    // Step 3: Check for existing card with same cardId and organizationId
    const existingCards = await db
      .select()
      .from(accessCard)
      .where(
        and(
          eq(accessCard.cardId, cardId),
          eq(accessCard.organizationId, organizationId)
        )
      )
      .limit(1)

    const existingCard = existingCards[0]

    if (existingCard) {
      console.warn(
        `Карта с номером ${cardId} уже существует для организации ${organizationId}. Пропускаем импорт.`
      )
      continue // Skip to next item
    }

    // Step 4: Create the card object
    const newCard: Omit<AccessCard, "organization"> = {
      id: crypto.randomUUID(),
      cardId,
      nameOnCard,
      cardType,
      cardStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId,
    }

    // Step 5: Insert into DB
    await db.insert(accessCard).values(newCard)

    // Step 6: Log the import
    const logData: LogInput = {
      userId,
      applicationId: null,
      logActionType: "CREATE",
      timeStamp: new Date(),
      metadata: `Imported access card with cardId: ${cardId}`,
    }
    await createLog(userId, logData)

    importedCards.push(newCard as AccessCard)
  }

  return importedCards
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

// DELETE action (bulk delete by IDs)
export async function deleteAccessCards(
  userId: string,
  ids: string[]
): Promise<{ deletedCount: number; notFoundIds: string[] }> {
  if (!ids || ids.length === 0) {
    throw new Error("No IDs provided for deletion.")
  }

  // Step 1: Check which IDs exist in the database
  const existingRecords = await db
    .select({ id: accessCard.id })
    .from(accessCard)
    .where(inArray(accessCard.id, ids))

  const existingIds = existingRecords.map((record) => record.id)
  const notFoundIds = ids.filter((id) => !existingIds.includes(id))

  if (existingIds.length === 0) {
    throw new Error("No access cards found with the provided IDs.")
  }

  // Step 2: Delete the existing records
  await db.delete(accessCard).where(inArray(accessCard.id, existingIds))

  // Step 3: Log the deletion
  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "UPDATE", // Assuming you have "DELETE" in your logActionType enum; adjust if needed
    timeStamp: new Date(),
    metadata: `Deleted ${existingIds.length} access card(s) with IDs: ${existingIds.join(", ")}`,
  }
  await createLog(userId, logData)

  // Step 4: Return summary
  return {
    deletedCount: existingIds.length,
    notFoundIds,
  }
}

// DELETE action (bulk delete by IDs)
export async function deleteAccessCardsByCardId(
  userId: string,
  cardIds: string[]
): Promise<{ deletedCount: number; notFoundIds: string[] }> {
  if (!cardIds || cardIds.length === 0) {
    throw new Error("No cardIds provided for deletion.")
  }

  // Step 1: Check which cardIds exist in the database
  const existingRecords = await db
    .select({ cardId: accessCard.cardId })
    .from(accessCard)
    .where(inArray(accessCard.cardId, cardIds))

  const existingCardIds = existingRecords.map((record) => record.cardId)
  const notFoundIds = cardIds.filter((id) => !existingCardIds.includes(id))

  if (existingCardIds.length === 0) {
    throw new Error("No access cards found with the provided cardIds.")
  }

  // Step 2: Delete the existing records by cardId
  await db.delete(accessCard).where(inArray(accessCard.cardId, existingCardIds))

  // Step 3: Log the deletion
  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "UPDATE", // Or "DELETE" if you have it
    timeStamp: new Date(),
    metadata: `Deleted ${existingCardIds.length} access card(s) with cardIds: ${existingCardIds.join(", ")}`,
  }
  await createLog(userId, logData)

  // Step 4: Return summary
  return {
    deletedCount: existingCardIds.length,
    notFoundIds,
  }
}
