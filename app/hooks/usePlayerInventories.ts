import { useState, useEffect } from "react"

import { usePlayerHousing } from "./usePlayerHousing"

import type { PlayerInventories, BitJitaInventoriesResponse } from "~/types/inventory"
import { transformBitJitaInventories } from "~/utils/inventoryTransform"

export function usePlayerInventories(playerId?: string) {
  const [inventories, setInventories] = useState<PlayerInventories | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    housingInventories,
    loading: housingLoading,
    error: housingError,
  } = usePlayerHousing(playerId)

  useEffect(() => {
    if (!playerId) {
      setInventories(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchInventories = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/player/${playerId}/inventories`)
        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json().catch(() => ({}))
            const errorMsg = errorData.isExternalError
              ? `${errorData.service || "External API"} Error: ${
                  errorData.detail || "Service unavailable"
                }`
              : errorData.detail || "External service is currently unavailable"
            throw new Error(errorMsg)
          }
          throw new Error(`Failed to fetch inventories: ${response.statusText}`)
        }

        const bitjitaData: BitJitaInventoriesResponse = await response.json()
        const transformedData = transformBitJitaInventories(bitjitaData)
        setInventories(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setInventories(null)
      } finally {
        setLoading(false)
      }
    }

    fetchInventories()
  }, [playerId])

  // Combine regular inventories with housing inventories
  const combinedInventories: PlayerInventories | null = (() => {
    if (!inventories && !housingInventories) return null
    
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
  })()

  // Combine loading states and errors
  const combinedLoading = loading || housingLoading
  const combinedError = error || housingError

  return {
    inventories: combinedInventories,
    loading: combinedLoading,
    error: combinedError,
  }
}
