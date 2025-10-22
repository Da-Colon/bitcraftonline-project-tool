import { type LoaderFunctionArgs, json } from "@remix-run/node"

import type { BitJitaHousingDetailsResponse } from "~/types/inventory"
import { getPlayerHousingDetails } from "~/utils/bitjita.server"

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId, buildingId } = params

  if (!playerId || !buildingId) {
    return json({ error: "Player ID and Building ID are required" }, { status: 400 })
  }

  try {
    const housingDetails: BitJitaHousingDetailsResponse = await getPlayerHousingDetails(
      playerId,
      buildingId
    )
    return json(housingDetails, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=60" },
    })
  } catch (error: any) {
    console.error("Failed to fetch player housing details:", error)

    if (error?.status === 404) {
      return json({ error: "Housing not found" }, { status: 404 })
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

    return json({ error: "Failed to fetch housing details" }, { status: 500 })
  }
}
