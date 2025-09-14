import type { PlayerInventories, Inventory, InventoryItem } from "~/types/inventory"

export interface CombinedInventoryItem extends InventoryItem {
  totalQuantity: number
  sources: string[] // inventory IDs where this item is found
}

export function combineTrackedInventories(
  inventories: PlayerInventories,
  trackedInventoryIds: Set<string>
): CombinedInventoryItem[] {
  const itemMap = new Map<string, CombinedInventoryItem>()

  // Get all inventories from all categories
  const allInventories = [
    ...(inventories.personal || []),
    ...(inventories.banks || []),
    ...(inventories.storage || []),
    ...(inventories.recovery || []),
    ...(inventories.housing || []),
  ]

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
