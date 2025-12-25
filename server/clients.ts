"use server"

import { db } from "@/db/drizzle"
import { Organization, organization } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { createLog, LogInput } from "./logs"

// GET action
export async function getOrganizations(
  userId: string,
  id?: string
): Promise<Organization[]> {
  if (id) {
    // Fetch a specific organization by orgId
    const [record] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id))
    if (!record) {
      throw new Error(`Organization with ID ${id} not found.`)
    }

    return [record as Organization]
  } else {
    // Fetch all organizations
    const allOrganizations = await db.select().from(organization)

    const logData: LogInput = {
      userId: userId,
      applicationId: null,
      logActionType: "GET",
      timeStamp: new Date(),
      metadata: "Fetched all organizations",
    }
    await createLog(userId, logData)
    // console.log("Fetched all organizations:", allOrganization)
    return allOrganizations as Organization[]
  }
}

export async function getOrganizationsExt(
  userId: string,
  id?: string,
  taxId?: string
): Promise<Organization[]> {
  if (id) {
    // Fetch a specific organization by orgId
    const [record] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id))
    if (!record) {
      throw new Error(`Organization with ID ${id} not found.`)
    }
    return [record as Organization]
  } else {
    // Fetch all organizations, optionally filter by taxId in metadata
    const allOrganizations = await db
      .select()
      .from(organization)
      .where(
        taxId
          ? sql`${organization.metadata}::jsonb->>'taxId' = ${taxId}`
          : undefined
      )

    return allOrganizations as Organization[]
  }
}

// POST action
export async function createOrganization(
  userId: string,
  organizationData: Omit<Organization, "id" | "createdAt" | "updatedAt">
): Promise<Organization> {
  const newOrganization = {
    ...organizationData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(organization).values(newOrganization)

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "CREATE",
    timeStamp: new Date(),
    metadata: "Created organization with ID " + newOrganization.id,
  }
  await createLog(userId, logData)

  return newOrganization
}

// PATCH action
export async function updateOrganization(
  userId: string,
  id: string,
  organizationData: Partial<
    Omit<Organization, "id" | "createdAt" | "updatedAt">
  >
): Promise<Organization> {
  const [existingOrganization] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, id))
  if (!existingOrganization) {
    throw new Error(`Organization with ID ${id} not found.`)
  }

  const updatedOrganization = {
    ...existingOrganization,
    ...organizationData,
    updatedAt: new Date(),
  }

  await db
    .update(organization)
    .set(updatedOrganization)
    .where(eq(organization.id, id))

  const logData: LogInput = {
    userId: userId,
    applicationId: null,
    logActionType: "UPDATE",
    timeStamp: new Date(),
    metadata: "Updated organization with ID " + id,
  }
  await createLog(userId, logData)

  return updatedOrganization as Organization
}
