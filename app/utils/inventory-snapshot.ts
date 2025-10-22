/**
 * Utilities for creating and managing inventory snapshots
 */

import type { Inventory, ClaimInventory } from "~/types/inventory"
import type {
  TrackedInventorySnapshot,
  InventorySnapshotMetadata,
} from "~/types/inventory-tracking"

export function createInventorySnapshot(
  inventory: Inventory | ClaimInventory,
  source: "personal" | "bank" | "storage" | "recovery" | "housing" | "claim"
): TrackedInventorySnapshot {
  const now = new Date().toISOString()

  return {
    id: inventory.id,
    name: inventory.name,
    type: inventory.type,
    source,
    claimId: "claimId" in inventory ? inventory.claimId : undefined,
    claimName: "claimName" in inventory ? inventory.claimName : undefined,
    buildingName: inventory.buildingName,
    items: inventory.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      name: item.name,
      tier: item.tier,
      category: item.category,
      rarity: item.rarity,
      iconAssetName: item.iconAssetName,
    })),
    lastUpdated: now,
    snapshotTimestamp: now,
  }
}

export function getSnapshotMetadata(snapshot: TrackedInventorySnapshot): InventorySnapshotMetadata {
  const lastUpdated = new Date(snapshot.lastUpdated)
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

  return {
    isStale: hoursSinceUpdate > 24, // Consider stale after 24 hours
    hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10, // Round to 1 decimal
    needsRefresh: hoursSinceUpdate > 6, // Suggest refresh after 6 hours
  }
}

export function isSnapshotStale(snapshot: TrackedInventorySnapshot): boolean {
  return getSnapshotMetadata(snapshot).isStale
}

export function shouldRefreshSnapshot(snapshot: TrackedInventorySnapshot): boolean {
  return getSnapshotMetadata(snapshot).needsRefresh
}

export function getSnapshotAge(snapshot: TrackedInventorySnapshot): string {
  const metadata = getSnapshotMetadata(snapshot)
  const hours = Math.floor(metadata.hoursSinceUpdate)
  const minutes = Math.floor((metadata.hoursSinceUpdate - hours) * 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`
  } else {
    return `${minutes}m ago`
  }
}
