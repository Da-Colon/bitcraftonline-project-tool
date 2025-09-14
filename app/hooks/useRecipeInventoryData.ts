import { useState, useEffect, useMemo } from "react"
import { usePlayerInventorySelections } from "./usePlayerInventorySelections"
import { useSelectedClaim } from "./useSelectedClaim"
import { useClaimInventories } from "./useClaimInventories"
import type { InventoryItem } from "~/types/recipes"
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory"

export function useRecipeInventoryData() {
  const [playerInventoryData, setPlayerInventoryData] = useState<PlayerInventoryResponse | null>(null)

  // Get player inventory selections
  const playerSelections = usePlayerInventorySelections()

  // Get selected claim data
  const { claim } = useSelectedClaim()
  const { inventories: claimInventories } = useClaimInventories(claim?.claimId)

  // For now, we'll use a simple approach - get the first player with selections
  const firstPlayerWithSelections = useMemo(() => {
    const playerNames = Object.keys(playerSelections.selections)
    return playerNames.length > 0 ? playerNames[0] : null
  }, [playerSelections.selections])

  const currentPlayerSelections = useMemo(() => {
    if (!firstPlayerWithSelections) return null
    return playerSelections.getPlayerSelections(firstPlayerWithSelections)
  }, [firstPlayerWithSelections, playerSelections])

  // Load player inventory data when player is selected
  useEffect(() => {
    if (!firstPlayerWithSelections) {
      setPlayerInventoryData(null)
      return
    }

    const fetchPlayerData = async () => {
      try {
        const params = new URLSearchParams({ playerName: firstPlayerWithSelections })
        const response = await fetch(`/api/player/inventory?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setPlayerInventoryData(data)
        } else {
          setPlayerInventoryData(null)
        }
      } catch (error) {
        console.warn("Failed to fetch player inventory data:", error)
        setPlayerInventoryData(null)
      }
    }

    fetchPlayerData()
  }, [firstPlayerWithSelections])

  // Combine all inventory data into a single inventory list for calculator
  const combinedInventory = useMemo((): InventoryItem[] => {
    const totals = new Map<string, number>()

    // Helper to add to totals with normalized ID
    const add = (rawId: string, qty: number) => {
      const id = rawId.startsWith("item_") ? rawId : `item_${rawId}`
      if (!qty || qty <= 0) return
      totals.set(id, (totals.get(id) || 0) + qty)
    }

    // From player inventories: include only selected inventory categories
    if (playerInventoryData && currentPlayerSelections?.selectedInventories?.length) {
      for (const source of currentPlayerSelections.selectedInventories) {
        const items = playerInventoryData.inventories[source]
        if (!items) continue
        for (const it of items) {
          add(it.itemId, it.quantity)
        }
      }
    }

    // From claim inventories: include all items if we have a claim selected
    if (claimInventories) {
      for (const inv of claimInventories.inventories) {
        for (const it of inv.items) {
          add(it.itemId, it.quantity)
        }
      }
    }

    return Array.from(totals.entries()).map(([itemId, quantity]) => ({ itemId, quantity }))
  }, [playerInventoryData, currentPlayerSelections, claimInventories])

  return {
    combinedInventory,
  }
}
