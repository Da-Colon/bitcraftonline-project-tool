/**
 * Types for the inventory tracking system
 * Separated from recipe tracking to clarify concerns
 */

export type InventorySource = "personal" | "bank" | "storage" | "recovery" | "housing" | "claim"

export interface TrackedInventorySnapshot {
  id: string
  name: string
  type: string
  source: InventorySource
  claimId?: string
  claimName?: string
  buildingName?: string
  items: {
    itemId: string
    quantity: number
    name?: string
    tier?: number
    category?: string
    rarity?: string
    iconAssetName?: string
  }[]
  lastUpdated: string // ISO timestamp when data was fetched from API
  snapshotTimestamp: string // ISO timestamp when snapshot was created
}

export interface PlayerInventoryTracking {
  playerId: string
  trackedInventories: {
    [inventoryId: string]: TrackedInventorySnapshot
  }
  lastUpdated: string
}

export interface InventoryTrackingStorage {
  [playerId: string]: PlayerInventoryTracking
}

export interface InventorySnapshotMetadata {
  isStale: boolean
  hoursSinceUpdate: number
  needsRefresh: boolean
}

export interface InventoryTrackingState {
  snapshots: TrackedInventorySnapshot[]
  metadata: Map<string, InventorySnapshotMetadata>
  isLoading: boolean
  error: string | null
}
