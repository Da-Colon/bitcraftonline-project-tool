import { type LoaderFunctionArgs, json } from "@remix-run/node"

import type { BitJitaHousingResponse } from "~/types/inventory"
import { getPlayerHousing } from "~/utils/bitjita.server"

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params

  if (!playerId) {
    return json({ error: "Player ID is required" }, { status: 400 })
  }

  try {
    const housingData: BitJitaHousingResponse = await getPlayerHousing(playerId)
    return json(housingData, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=60" },
    })
  } catch (error: any) {
    console.error("Failed to fetch player housing:", error)

    if (error?.status === 404) {
      return json({ error: "Player not found or has no housing" }, { status: 404 })
    }

    if (error?.status >= 500) {
      return json(
        {
          error: "External service error",
          detail: error.message,
          isExternalError: true,
          service: "BitJita API",
        },
        { status: 503 }
      )
    }

    return json({ error: "Failed to fetch player housing data" }, { status: 500 })
  }
}
