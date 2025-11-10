"use server"

import { db } from "@/db/drizzle"
import { Log, log } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET action
export async function getLogs(userId: string, id?: string): Promise<Log[]> {
  if (id) {
    // Fetch a specific access card by access card ID
    const [record] = await db.select().from(log).where(eq(log.id, id))
    if (!record) {
      throw new Error(`Log with ID ${id} not found.`)
    }

    // console.log("Fetched log by ID:", record)
    return [record as Log]
  } else {
    // Fetch all logs
    const allLogs = await db.select().from(log)
    // console.log("Fetched all logs:", allLogs)
    return allLogs as Log[]
  }
}

// POST action
export async function createLog(
  userId: string,
  logData: Omit<Log, "id" | "createdAt" | "user" | "application">
): Promise<Omit<Log, "user" | "application">> {
  const newLog = {
    ...logData,
    id: crypto.randomUUID(), // Generate a unique ID
    createdAt: new Date(),
  }

  await db.insert(log).values(newLog)
  return newLog
}

export type LogInput = Omit<Log, "id" | "createdAt" | "user" | "application">
