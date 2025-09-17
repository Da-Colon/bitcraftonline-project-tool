import type { PlayerInventories } from "~/types/inventory"
import {
  buildTrackedInventorySummary,
  type CombinedInventoryItem,
} from "~/utils/combineAllTrackedInventories"

export { CombinedInventoryItem }

export function combineTrackedInventories(
  inventories: PlayerInventories,
  trackedInventoryIds: Set<string>
): CombinedInventoryItem[] {
  return buildTrackedInventorySummary(inventories, null, trackedInventoryIds).combinedItems
}
