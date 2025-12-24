import { NextResponse, NextRequest } from "next/server"
import { getOrganizations } from "@/server/clients"

// GET method
export async function GET(req: NextRequest) {
  const bbusApiKey = process.env.BBUS_API_KEY
  const bbusApiKeyPublic = process.env.NEXT_PUBLIC_BBUS_API_KEY
  const systemUserId = process.env.SYSTEM_USER_ID || ""

  const { searchParams } = new URL(req.url)

  const apiKey = searchParams.get("apiKey")
  const taxId = searchParams.get("taxId")

  // console.log("Received bus data:", StateNumbersDictionary)
  //console.log("Received API key:", apiKey)

  if (!apiKey || (apiKey !== bbusApiKey && apiKey !== bbusApiKeyPublic)) {
    return NextResponse.json({ error: "API key is missing" }, { status: 400 })
  }

  // console.log("API key passed")

  try {
    const organizations = await getOrganizations(
      systemUserId,
      undefined,
      taxId || undefined
    )
    return NextResponse.json(organizations)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
