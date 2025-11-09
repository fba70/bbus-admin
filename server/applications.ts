"use server"

import { db } from "@/db/drizzle"
import { Application, application } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET action
export async function getApplications(
  userId: string,
  id?: string
): Promise<Application[]> {
  if (id) {
    // Fetch a specific bus by bus ID
    const record = await db.query.application.findFirst({
      where: eq(application.id, id),
      with: {
        user: true, // Include user data
      },
    })
    if (!record) {
      throw new Error(`Application with ID ${id} not found.`)
    }

    // console.log("Fetched bus by ID:", record)
    return [record as Application]
  } else {
    // Fetch all applications with relations
    const allApplications = await db.query.application.findMany({
      with: {
        user: true, // Include user data
      },
    })
    // console.log("Fetched all applications:", allApplications)
    return allApplications as Application[]
  }
}

// POST action
export async function createApplication(
  sessionUserId: string,
  applicationData: Omit<Application, "id" | "createdAt" | "updatedAt">
): Promise<Application> {
  const newApplication = {
    ...applicationData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(application).values(newApplication)
  return newApplication
}

// PATCH action
export async function updateApplication(
  sessionUserId: string,
  id: string,
  applicationData: Partial<Omit<Application, "id" | "createdAt" | "updatedAt">>
): Promise<Application> {
  const [existingApplication] = await db
    .select()
    .from(application)
    .where(eq(application.id, id))
  if (!existingApplication) {
    throw new Error(`Application with ID ${id} not found.`)
  }

  const updatedApplication = {
    ...existingApplication,
    ...applicationData,
    updatedAt: new Date(),
  }

  await db
    .update(application)
    .set(updatedApplication)
    .where(eq(application.id, id))
  return updatedApplication as Application
}
