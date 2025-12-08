"use server"

import { db } from "@/db/drizzle"
import { user, account, session, member } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function deleteUserFromDB(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. delete account record where account.userId = userId
    await db.delete(account).where(eq(account.userId, userId))

    // 2. delete session records where session.userId = userId
    await db.delete(session).where(eq(session.userId, userId))

    // 3. delete member records where member.userId = userId
    await db.delete(member).where(eq(member.userId, userId))

    // 4. delete user record where user.id = userId
    await db.delete(user).where(eq(user.id, userId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unknown error occurred",
    }
  }
}
