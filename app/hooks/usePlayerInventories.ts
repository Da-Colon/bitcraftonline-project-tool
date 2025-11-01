import { useFetcher } from "@remix-run/react"
import { useEffect, useMemo } from "react"

import type { StandardErrorResponse } from "~/types/api-responses"
import type { PlayerInventories, BitJitaInventoriesResponse } from "~/types/inventory"
import { transformBitJitaInventories } from "~/utils/inventoryTransform"

import { usePlayerHousing } from "./usePlayerHousing"

export function usePlayerInventories(playerId?: string) {
  const fetcher = useFetcher<BitJitaInventoriesResponse | StandardErrorResponse>()
  const {
    housingInventories,
    loading: housingLoading,
    error: housingError,
  } = usePlayerHousing(playerId)

  // Load data when playerId changes
  useEffect(() => {
    if (!playerId) {
      return
    }
    fetcher.load(`/api/players/${playerId}/inventories`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  // Transform data from fetcher
  const inventories = useMemo<PlayerInventories | null>(() => {
    if (!fetcher.data || "error" in fetcher.data) {
      return null
    }
    try {
      return transformBitJitaInventories(fetcher.data as BitJitaInventoriesResponse)
    } catch {
      return null
    }
  }, [fetcher.data])

  // Extract error from fetcher response
  const error = useMemo<string | null>(() => {
    if (fetcher.data && "error" in fetcher.data) {
      const errorData = fetcher.data as StandardErrorResponse
      return errorData.isExternalError
        ? `${errorData.service || "External API"} Error: ${
            errorData.detail || "Service unavailable"
          }`
        : errorData.detail || errorData.error || "Failed to fetch inventories"
    }
    return null
  }, [fetcher.data])

  // Combine regular inventories with housing inventories
  const combinedInventories: PlayerInventories | null = useMemo(() => {
    if (!inventories && !housingInventories) {
      return null
    }

    const base: PlayerInventories = inventories || {
      personal: [],
      banks: [],
      storage: [],
      recovery: [],
    }

    return {
      ...base,
      housing: housingInventories?.housing || [],
    }
  }, [inventories, housingInventories])

  // Combine loading states and errors
  const combinedLoading =
    fetcher.state === "loading" || fetcher.state === "submitting" || housingLoading
  const combinedError = error || housingError

  return {
    inventories: combinedInventories,
    loading: combinedLoading,
    error: combinedError,
  }
}
