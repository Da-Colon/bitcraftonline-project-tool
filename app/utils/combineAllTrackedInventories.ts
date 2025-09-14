import type {
  PlayerInventories,
  ClaimInventoriesResponse,
  Inventory,
  InventoryItem,
  ClaimInventory,
} from "~/types/inventory"

export interface CombinedInventoryItem extends InventoryItem {
  totalQuantity: number
  sources: string[] // inventory IDs where this item is found
}

export function combineAllTrackedInventories(
  playerInventories: PlayerInventories | null,
  claimInventories: ClaimInventoriesResponse | null,
  trackedInventoryIds: Set<string>
): CombinedInventoryItem[] {
  const itemMap = new Map<string, CombinedInventoryItem>()

  // Get all player inventories
  const allPlayerInventories: Inventory[] = []
  if (playerInventories) {
    allPlayerInventories.push(
      ...(playerInventories.personal || []),
      ...(playerInventories.banks || []),
      ...(playerInventories.storage || []),
      ...(playerInventories.recovery || []),
      ...(playerInventories.housing || [])
    )
  }

  // Get all claim inventories (convert ClaimInventory to Inventory format)
  const allClaimInventories: Inventory[] = []
  if (claimInventories) {
    allClaimInventories.push(
      ...claimInventories.inventories.map((claimInv) => ({
        id: claimInv.id,
        name: claimInv.name,
        type: claimInv.type,
        items: claimInv.items,
        maxSlots: claimInv.maxSlots,
        buildingName: claimInv.buildingName,
        claimName: claimInv.claimName,
        region: claimInv.region,
      }))
    )
  }

  // Combine all inventories
  const allInventories = [...allPlayerInventories, ...allClaimInventories]

  // Filter to only tracked inventories
  const trackedInventories = allInventories.filter((inv) => trackedInventoryIds.has(inv.id))

  // Combine items from all tracked inventories
  trackedInventories.forEach((inventory) => {
    inventory.items.forEach((item) => {
      const key = item.itemId

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!
        existing.totalQuantity += item.quantity
        existing.sources.push(inventory.id)
      } else {
        itemMap.set(key, {
          ...item,
          totalQuantity: item.quantity,
          sources: [inventory.id],
        })
      }
    })
  })

  return Array.from(itemMap.values()).sort((a, b) => {
    // Sort by tier (descending), then by name
    if (a.tier !== b.tier) {
      return (b.tier || 0) - (a.tier || 0)
    }
    return (a.name || "").localeCompare(b.name || "")
  })
}
