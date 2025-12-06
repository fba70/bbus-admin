"use server"

import { db } from "@/db/drizzle"
import { member, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq, inArray, not } from "drizzle-orm"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })

  if (!currentUser) {
    redirect("/login")
  }

  return {
    ...session,
    currentUser,
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    })

    return {
      success: true,
      message: "Signed in successfully.",
    }
  } catch (error) {
    const e = error as Error

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    }
  }
}

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username,
      },
    })

    return {
      success: true,
      message: "Signed up successfully.",
    }
  } catch (error) {
    const e = error as Error

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    }
  }
}

export const getUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    })

    // console.log("Members:", members)

    // Fetch users whose IDs are in the list of member.userId
    const users = await db.query.user.findMany({
      where: inArray(
        user.id,
        members.map((member) => member.userId)
      ),
    })

    // console.log("Users:", users)

    return users
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getUsersNotInOrganization = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: not(eq(member.organizationId, organizationId)),
    })

    // console.log("Members:", members)

    // Fetch users whose IDs are in the list of member.userId
    const users = await db.query.user.findMany({
      where: inArray(
        user.id,
        members.map((member) => member.userId)
      ),
    })

    // console.log("Users:", users)

    return users
  } catch (error) {
    console.error(error)
    return []
  }
}

/*
export const getAllUsers = async () => {
  try {
    const users = await db.query.user.findMany()
    return users
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}
*/

export const getAllNonMemberUsers = async () => {
  try {
    // Step 1: Get all member records
    const members = await db.query.member.findMany()
    const memberUserIds = members.map((m) => m.userId)

    // Step 2: Fetch users whose IDs are NOT in memberUserIds
    const users = await db.query.user.findMany({
      where:
        memberUserIds.length > 0
          ? not(inArray(user.id, memberUserIds))
          : undefined,
    })

    return users
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}

export const updateUser = async (
  userId: string,
  name: string,
  email: string,
  emailVerified: boolean
) => {
  try {
    // 1. Find the user by userId to ensure they exist
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })

    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found.`)
    }

    // 2. Prepare the update data (patch the provided fields)
    const updateData = {
      name,
      email,
      emailVerified,
    }

    // Perform the update
    await db.update(user).set(updateData).where(eq(user.id, userId))

    // Fetch and return the updated user
    const updatedUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })

    return updatedUser
  } catch (error) {
    console.error("Error updating user:", error)
    throw error // Re-throw to let the caller handle it
  }
}
