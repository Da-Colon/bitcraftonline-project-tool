import { useState, useEffect } from "react"

import type {
  BitJitaHousingResponse,
  BitJitaHousingDetailsResponse,
  PlayerInventories,
  Inventory,
  InventoryItem,
} from "~/types/inventory"
import { normalizeItemId } from "~/utils/itemId"

export function usePlayerHousing(playerId?: string) {
  const [housingData, setHousingData] = useState<BitJitaHousingResponse | null>(null)
  const [housingInventories, setHousingInventories] = useState<PlayerInventories | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) {
      setHousingData(null)
      setHousingInventories(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchHousingData = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, get the list of housing buildings
        const housingResponse = await fetch(`/api/players/${playerId}/housing`)
        if (!housingResponse.ok) {
          if (housingResponse.status === 404) {
            // Player has no housing, this is fine
            setHousingData([])
            setHousingInventories({ housing: [] })
            return
          }
          if (housingResponse.status === 503) {
            const errorData = await housingResponse.json().catch(() => ({}))
            const errorMsg = errorData.isExternalError
              ? `${errorData.service || "External API"} Error: ${
                  errorData.detail || "Service unavailable"
                }`
              : errorData.detail || "External service is currently unavailable"
            throw new Error(errorMsg)
          }
          throw new Error(`Failed to fetch housing data: ${housingResponse.statusText}`)
        }

        const housingData: BitJitaHousingResponse = await housingResponse.json()
        setHousingData(housingData)

        // If no housing buildings, return empty inventories
        if (!housingData || housingData.length === 0) {
          setHousingInventories({ housing: [] })
          return
        }

        // Fetch details for each housing building
        const housingInventoriesPromises = housingData.map(async (housing) => {
          try {
            const detailsResponse = await fetch(
              `/api/players/${playerId}/housing/${housing.buildingEntityId}`
            )
            if (!detailsResponse.ok) {
              return null
            }
            return (await detailsResponse.json()) as BitJitaHousingDetailsResponse
          } catch {
            return null
          }
        })

        const housingDetails = await Promise.all(housingInventoriesPromises)
        const validHousingDetails = housingDetails.filter(
          (details): details is BitJitaHousingDetailsResponse => details !== null
        )

        // Transform housing details into our inventory format
        const housingInventories = transformHousingToInventories(validHousingDetails)
        setHousingInventories({ housing: housingInventories })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setHousingData(null)
        setHousingInventories(null)
      } finally {
        setLoading(false)
      }
    }

    fetchHousingData()
  }, [playerId])

  return { housingData, housingInventories, loading, error }
}

function transformHousingToInventories(
  housingDetails: BitJitaHousingDetailsResponse[]
): Inventory[] {
  const inventories: Inventory[] = []

  housingDetails.forEach((housing) => {
    housing.inventories.forEach((container) => {
      const items: InventoryItem[] = container.inventory.map((item) => {
        // The items are stored as a record with item_id as key
        const itemInfo = housing.items.find((i) => i.id === item.contents.item_id)

        return {
          itemId: normalizeItemId(item.contents.item_id),
          quantity: item.contents.quantity,
          name: itemInfo?.name,
          tier: itemInfo?.tier,
          category: itemInfo?.tag,
          rarity: itemInfo?.rarityStr,
          iconAssetName: itemInfo?.iconAssetName,
        }
      })

      inventories.push({
        id: container.entityId,
        name: container.buildingNickname || container.buildingName,
        type: "housing",
        items: items,
        maxSlots: container.inventory.length,
        buildingName: housing.buildingName,
        claimName: housing.claimName,
        region: housing.regionId,
      })
    })
  })

  return inventories
}
