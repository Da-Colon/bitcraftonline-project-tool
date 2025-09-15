import { useState, useEffect, useMemo } from "react"
import { usePlayerInventorySelections } from "./usePlayerInventorySelections"
import { useSelectedPlayer } from "./useSelectedPlayer"
import { useSelectedClaim } from "./useSelectedClaim"
import { useClaimInventories } from "./useClaimInventories"
import { usePlayerInventories } from "./usePlayerInventories"
import type { InventoryItem } from "~/types/recipes"
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory"

export function useRecipeInventoryData() {
  const [playerInventoryData, setPlayerInventoryData] = useState<PlayerInventoryResponse | null>(null)

  // Get player inventory selections
  const playerSelections = usePlayerInventorySelections()

  // Get selected claim data
  const { claim } = useSelectedClaim()
  const { inventories: claimInventories } = useClaimInventories(claim?.claimId)

  // Get selected player and their inventories (including housing)
  const { player } = useSelectedPlayer()
  const { inventories: playerInventories } = usePlayerInventories(player?.entityId)

  // Prefer the first player that has saved selections; otherwise fall back to the currently selected player
  const firstPlayerWithSelections = useMemo(() => {
    const playerNames = Object.keys(playerSelections.selections)
    return playerNames.length > 0 ? playerNames[0] : null
  }, [playerSelections.selections])
  const activePlayerName = firstPlayerWithSelections || player?.username || null

  const currentPlayerSelections = useMemo(() => {
    if (!firstPlayerWithSelections) return null
    return playerSelections.getPlayerSelections(firstPlayerWithSelections)
  }, [firstPlayerWithSelections, playerSelections])

  // Load player inventory data when player is selected (fallback for legacy API)
  useEffect(() => {
    if (!activePlayerName || playerInventories) {
      // If we have playerInventories from the new hook, don't fetch from legacy API
      if (playerInventories) {
        setPlayerInventoryData(null)
      }
      return
    }

    const fetchPlayerData = async () => {
      try {
        const params = new URLSearchParams({ playerName: activePlayerName })
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
  }, [activePlayerName, playerInventories])

  // Combine all inventory data into a single inventory list for calculator
  const combinedInventory = useMemo((): InventoryItem[] => {
    const totals = new Map<string, number>()

    // Helper to add to totals with normalized ID
    const add = (rawId: string, qty: number) => {
      const id = rawId.startsWith("item_") ? rawId : `item_${rawId}`
      if (!qty || qty <= 0) return
      totals.set(id, (totals.get(id) || 0) + qty)
    }

    // From player inventories: use new hook data (includes housing) if available, otherwise fallback to legacy API
    if (playerInventories) {
      // Use the new playerInventories hook that includes housing
      const selected = currentPlayerSelections?.selectedInventories
      const allInventoryTypes = ['personal', 'banks', 'storage', 'recovery', 'housing']
      const sources = Array.isArray(selected) && selected.length > 0
        ? selected
        : allInventoryTypes

      for (const source of sources) {
        const inventoryList = playerInventories[source as keyof typeof playerInventories]
        if (!inventoryList) continue
        for (const inventory of inventoryList) {
          for (const item of inventory.items) {
            add(item.itemId, item.quantity)
          }
        }
      }
    } else if (playerInventoryData) {
      // Fallback to legacy API data (doesn't include housing)
      const selected = currentPlayerSelections?.selectedInventories
      const sources = Array.isArray(selected) && selected.length > 0
        ? selected
        : Object.keys(playerInventoryData.inventories)
      for (const source of sources) {
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
  }, [playerInventories, playerInventoryData, currentPlayerSelections, claimInventories])

  return {
    combinedInventory,
  }
}
