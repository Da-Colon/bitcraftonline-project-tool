import { useFetcher } from "@remix-run/react"
import { useEffect, useMemo, useState } from "react"

import type { StandardErrorResponse } from "~/types/api-responses"
import type {
  BitJitaHousingResponse,
  BitJitaHousingDetailsResponse,
  PlayerInventories,
  Inventory,
  InventoryItem,
} from "~/types/inventory"
import { extractFetcherError } from "~/utils/error-handling"
import { normalizeItemId } from "~/utils/itemId"
import {
  isBitJitaHousingResponse,
  isStandardErrorResponse,
} from "~/utils/type-guards"

export function usePlayerHousing(playerId?: string) {
  const housingFetcher = useFetcher<BitJitaHousingResponse | StandardErrorResponse>()
  const [housingInventories, setHousingInventories] = useState<PlayerInventories | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!playerId) {
      return
    }
    housingFetcher.load(`/api/players/${playerId}/housing`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  // Treat 404 as empty array (no housing exists)
  const housingData = useMemo<BitJitaHousingResponse | null>(() => {
    if (!housingFetcher.data) {
      return null
    }
    if (isStandardErrorResponse(housingFetcher.data)) {
      const errorData = housingFetcher.data
      if (
        errorData.error?.toLowerCase().includes("not found") ||
        errorData.error?.toLowerCase().includes("404")
      ) {
        return []
      }
      return null
    }
    if (isBitJitaHousingResponse(housingFetcher.data)) {
      return housingFetcher.data
    }
    return null
  }, [housingFetcher.data])

  const error = useMemo<string | null>(() => {
    return extractFetcherError(housingFetcher.data, "Failed to fetch housing data", {
      treat404AsNonError: true,
    })
  }, [housingFetcher.data])

  useEffect(() => {
    if (!playerId) {
      setHousingInventories(null)
      return
    }

    if (housingData === null) {
      return
    }

    if (housingData.length === 0) {
      setHousingInventories({ housing: [] })
      return
    }

    const fetchHousingDetails = async () => {
      setDetailsLoading(true)
      try {
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

        const transformedInventories = transformHousingToInventories(validHousingDetails)
        setHousingInventories({ housing: transformedInventories })
      } catch {
        setHousingInventories({ housing: [] })
      } finally {
        setDetailsLoading(false)
      }
    }

    fetchHousingDetails()
  }, [playerId, housingData])

  const loading =
    housingFetcher.state === "loading" ||
    housingFetcher.state === "submitting" ||
    detailsLoading

  return { housingData, housingInventories, loading, error }
}

function transformHousingToInventories(
  housingDetails: BitJitaHousingDetailsResponse[]
): Inventory[] {
  const inventories: Inventory[] = []

  housingDetails.forEach((housing) => {
    housing.inventories.forEach((container) => {
      const items: InventoryItem[] = container.inventory.map((item) => {
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
