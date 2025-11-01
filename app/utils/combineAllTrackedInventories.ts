import type {
  PlayerInventories,
  ClaimInventoriesResponse,
  Inventory,
  InventoryItem,
  ClaimInventory,
} from "~/types/inventory"
import type { TrackedInventorySnapshot } from "~/types/inventory-tracking"
import { normalizeItemId } from "~/utils/itemId"

export interface CombinedItemSource {
  inventoryId: string
  inventoryName: string
  inventoryType: string
  claimName?: string
  buildingName?: string
  claimId?: string
}

export interface CombinedInventoryItem extends InventoryItem {
  totalQuantity: number
  sources: CombinedItemSource[]
}

export interface TrackedInventorySummary {
  /** Flattened list of every known inventory (player + claim). */
  allInventories: Inventory[]
  /** Quick lookup for inventory metadata by ID. */
  inventoryIndex: Map<string, Inventory>
  /** Inventories that are actively tracked. */
  trackedInventories: Inventory[]
  /** Aggregated item list with per-item totals and provenance. */
  combinedItems: CombinedInventoryItem[]
  /** Map form of combined items for quick lookups. */
  itemTotalsById: Map<string, CombinedInventoryItem>
  /** Total quantity across all combined items. */
  totalQuantity: number
  /** Count of unique item types represented in combined items. */
  uniqueItemCount: number
}

const EMPTY_SUMMARY: TrackedInventorySummary = {
  allInventories: [],
  inventoryIndex: new Map(),
  trackedInventories: [],
  combinedItems: [],
  itemTotalsById: new Map(),
  totalQuantity: 0,
  uniqueItemCount: 0,
}

type InventorySource = Inventory | ClaimInventory

function flattenPlayerInventories(playerInventories: PlayerInventories | null): Inventory[] {
  if (!playerInventories) return []

  const groups: (keyof PlayerInventories)[] = [
    "personal",
    "banks",
    "storage",
    "recovery",
    "housing",
  ]

  const flattened: Inventory[] = []

  for (const group of groups) {
    const inventories = playerInventories[group]
    if (!inventories) continue
    inventories.forEach((inventory) => {
      flattened.push(inventory)
    })
  }

  return flattened
}

function resolveSourceMetadata(inventory: InventorySource): CombinedItemSource {
  const claimInventory = inventory as ClaimInventory
  return {
    inventoryId: inventory.id,
    inventoryName: inventory.name,
    inventoryType: inventory.type,
    claimId: claimInventory.claimId,
    claimName: claimInventory.claimName,
    buildingName: inventory.buildingName,
  }
}

/**
 * Aggregate items from inventories into a map keyed by normalized item ID
 * 
 * @param inventories - Array of inventories to aggregate
 * @param getSource - Function to extract source metadata from an inventory
 * @returns Map of normalized item ID to CombinedInventoryItem
 */
function aggregateItemsByInventory(
  inventories: Inventory[],
  getSource: (inventory: Inventory) => CombinedItemSource
): Map<string, CombinedInventoryItem> {
  const itemTotals = new Map<string, CombinedInventoryItem>()

  for (const inventory of inventories) {
    const source = getSource(inventory)

    for (const item of inventory.items) {
      const normalizedId = normalizeItemId(item.itemId)
      if (!normalizedId) {
        continue
      }

      const baseItem: InventoryItem =
        normalizedId === item.itemId ? item : { ...item, itemId: normalizedId }
      const existing = itemTotals.get(normalizedId)

      if (existing) {
        existing.totalQuantity += baseItem.quantity
        existing.quantity = existing.totalQuantity
        if (!existing.sources.some((src) => src.inventoryId === source.inventoryId)) {
          existing.sources.push(source)
        }
      } else {
        itemTotals.set(normalizedId, {
          ...baseItem,
          totalQuantity: baseItem.quantity,
          quantity: baseItem.quantity,
          sources: [source],
        })
      }
    }
  }

  return itemTotals
}

/**
 * Sort combined items by tier (descending), then name, then itemId
 * 
 * @param itemTotals - Map of aggregated items
 * @returns Sorted array of CombinedInventoryItem
 */
function sortCombinedItems(
  itemTotals: Map<string, CombinedInventoryItem>
): CombinedInventoryItem[] {
  return Array.from(itemTotals.values()).sort((a, b) => {
    const tierA = a.tier ?? -1
    const tierB = b.tier ?? -1
    if (tierA !== tierB) {
      return tierB - tierA
    }

    const nameA = a.name ?? ""
    const nameB = b.name ?? ""
    if (nameA && nameB) {
      const byName = nameA.localeCompare(nameB)
      if (byName !== 0) {
        return byName
      }
    } else if (nameA) {
      return -1
    } else if (nameB) {
      return 1
    }

    return a.itemId.localeCompare(b.itemId)
  })
}

/**
 * Build complete TrackedInventorySummary from aggregated items
 * 
 * @param itemTotals - Map of aggregated items
 * @param allInventories - All known inventories
 * @param inventoryIndex - Map for quick inventory lookup
 * @param trackedInventories - Inventories that are actively tracked
 * @returns Complete TrackedInventorySummary
 */
function buildSummaryFromAggregatedItems(
  itemTotals: Map<string, CombinedInventoryItem>,
  allInventories: Inventory[],
  inventoryIndex: Map<string, Inventory>,
  trackedInventories: Inventory[]
): TrackedInventorySummary {
  const combinedItems = sortCombinedItems(itemTotals)
  const totalQuantity = combinedItems.reduce((sum, item) => sum + item.totalQuantity, 0)

  return {
    allInventories,
    inventoryIndex,
    trackedInventories,
    combinedItems,
    itemTotalsById: itemTotals,
    totalQuantity,
    uniqueItemCount: combinedItems.length,
  }
}

export function buildTrackedInventorySummary(
  playerInventories: PlayerInventories | null,
  claimInventories: ClaimInventoriesResponse | null,
  trackedInventoryIds: Set<string>
): TrackedInventorySummary {
  const allPlayerInventories = flattenPlayerInventories(playerInventories)
  const allClaimInventories = claimInventories?.inventories ?? []

  const allInventories: Inventory[] = [...allPlayerInventories, ...allClaimInventories]

  if (allInventories.length === 0) {
    return EMPTY_SUMMARY
  }

  const inventoryIndex = new Map<string, Inventory>()
  allInventories.forEach((inventory) => {
    inventoryIndex.set(inventory.id, inventory)
  })

  const trackedInventories = allInventories.filter((inventory) =>
    trackedInventoryIds.has(inventory.id)
  )

  if (trackedInventories.length === 0) {
    return {
      allInventories,
      inventoryIndex,
      trackedInventories: [],
      combinedItems: [],
      itemTotalsById: new Map(),
      totalQuantity: 0,
      uniqueItemCount: 0,
    }
  }

  const itemTotals = aggregateItemsByInventory(
    trackedInventories,
    resolveSourceMetadata
  )

  return buildSummaryFromAggregatedItems(
    itemTotals,
    allInventories,
    inventoryIndex,
    trackedInventories
  )
}

export function combineAllTrackedInventories(
  playerInventories: PlayerInventories | null,
  claimInventories: ClaimInventoriesResponse | null,
  trackedInventoryIds: Set<string>
): CombinedInventoryItem[] {
  return buildTrackedInventorySummary(playerInventories, claimInventories, trackedInventoryIds)
    .combinedItems
}

/**
 * Build tracked inventory summary from snapshots
 * This is the new preferred method that uses cached snapshot data
 */
export function buildTrackedInventorySummaryFromSnapshots(
  snapshots: TrackedInventorySnapshot[]
): TrackedInventorySummary {
  if (snapshots.length === 0) {
    return EMPTY_SUMMARY
  }

  const allInventories: Inventory[] = snapshots.map((snapshot) => ({
    id: snapshot.id,
    name: snapshot.name,
    type: snapshot.type,
    items: snapshot.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      name: item.name,
      tier: item.tier,
      category: item.category,
      rarity: item.rarity,
      iconAssetName: item.iconAssetName,
    })),
    maxSlots: undefined,
    buildingName: snapshot.buildingName,
    claimName: snapshot.claimName,
    region: undefined,
  }))

  const inventoryIndex = new Map<string, Inventory>()
  allInventories.forEach((inventory) => {
    inventoryIndex.set(inventory.id, inventory)
  })

  const getSourceFromSnapshot = (inventory: Inventory): CombinedItemSource => {
    const snapshot = snapshots.find((s) => s.id === inventory.id)
    return {
      inventoryId: inventory.id,
      inventoryName: inventory.name,
      inventoryType: inventory.type,
      claimId: snapshot?.claimId,
      claimName: snapshot?.claimName,
      buildingName: inventory.buildingName,
    }
  }

  const itemTotals = aggregateItemsByInventory(allInventories, getSourceFromSnapshot)

  return buildSummaryFromAggregatedItems(
    itemTotals,
    allInventories,
    inventoryIndex,
    allInventories
  )
}

export function combineTrackedInventoriesFromSnapshots(
  snapshots: TrackedInventorySnapshot[]
): CombinedInventoryItem[] {
  return buildTrackedInventorySummaryFromSnapshots(snapshots).combinedItems
}
