import { useMemo } from "react"

import { useTrackedInventorySummary } from "~/hooks/useTrackedInventorySummary"
import type { InventoryItem } from "~/types/recipes"

export function useRecipeInventoryData() {
  const { combinedItems } = useTrackedInventorySummary()

  const combinedInventory = useMemo((): InventoryItem[] => {
    if (combinedItems.length === 0) {
      return []
    }

    return combinedItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.totalQuantity,
    }))
  }, [combinedItems])

  return {
    combinedInventory,
  }
}
