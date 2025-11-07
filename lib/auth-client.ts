import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL: baseUrl,
  plugins: [organizationClient(), lastLoginMethodClient()],
})
