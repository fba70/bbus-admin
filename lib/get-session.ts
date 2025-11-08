import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { cache } from "react"

// chache() deduplicates repeated calls for the session, for example, from the header and the page

export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session
})
