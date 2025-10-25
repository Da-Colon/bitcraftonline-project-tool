import { useMemo } from "react"

import { useClaimInventories } from "~/hooks/useClaimInventories"
import { usePlayerInventories } from "~/hooks/usePlayerInventories"
import { usePlayerInventoryTracking } from "~/hooks/usePlayerInventoryTracking"
import { useSelectedClaim } from "~/hooks/useSelectedClaim"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import type {
  PlayerInventories,
  ClaimInventoriesResponse,
  Inventory,
  ClaimInventory,
} from "~/types/inventory"
import type { TrackedInventorySnapshot, InventorySource } from "~/types/inventory-tracking"
import {
  buildTrackedInventorySummary,
  buildTrackedInventorySummaryFromSnapshots,
  type TrackedInventorySummary,
} from "~/utils/combineAllTrackedInventories"

export interface TrackedInventorySummaryResult extends TrackedInventorySummary {
  player: ReturnType<typeof useSelectedPlayer>["player"]
  claim: ReturnType<typeof useSelectedClaim>["claim"]
  playerInventories: PlayerInventories | null
  claimInventories: ClaimInventoriesResponse | null
  snapshots: TrackedInventorySnapshot[]
  trackedCount: number
  isTrackingLoaded: boolean
  loading: boolean
  error: string | null
  playerLoading: boolean
  playerError: string | null
  claimLoading: boolean
  claimError: string | null
  trackInventory: (inventory: Inventory | ClaimInventory, source: InventorySource) => Promise<void>
  untrackInventory: (inventoryId: string) => Promise<void>
  trackInventories: (
    inventories: (Inventory | ClaimInventory)[],
    source: InventorySource
  ) => Promise<void>
  untrackAll: () => Promise<void>
  isTracked: (inventoryId: string) => boolean
  refreshSnapshot: (
    inventoryId: string,
    freshInventory: Inventory | ClaimInventory,
    source: InventorySource
  ) => Promise<void>
  getStaleSnapshots: () => TrackedInventorySnapshot[]
}

export function useTrackedInventorySummary(): TrackedInventorySummaryResult {
  const { player } = useSelectedPlayer()
  const { claim } = useSelectedClaim()
  const {
    inventories: playerInventories,
    loading: playerLoading,
    error: playerError,
  } = usePlayerInventories(player?.entityId)
  const {
    inventories: claimInventories,
    loading: claimLoading,
    error: claimError,
  } = useClaimInventories(claim?.claimId)
  const {
    snapshots,
    // metadata,
    isLoading: trackingLoading,
    error: trackingError,
    trackInventory,
    untrackInventory,
    trackInventories,
    untrackAll,
    isTracked,
    refreshSnapshot,
    getStaleSnapshots,
  } = usePlayerInventoryTracking(player?.entityId || null)

  const summary = useMemo(() => {
    // Use snapshots if available, otherwise fall back to live data
    if (snapshots.length > 0) {
      return buildTrackedInventorySummaryFromSnapshots(snapshots)
    } else {
      // Fallback to old method for backward compatibility
      const trackedIds = new Set(snapshots.map((s) => s.id))
      return buildTrackedInventorySummary(playerInventories, claimInventories, trackedIds)
    }
  }, [snapshots, playerInventories, claimInventories])

  const loading = playerLoading || claimLoading || trackingLoading
  const error = playerError || claimError || trackingError || null
  const trackedCount = snapshots.length

  return {
    ...summary,
    player,
    claim,
    playerInventories,
    claimInventories,
    snapshots,
    trackedCount,
    isTrackingLoaded: !trackingLoading,
    loading,
    error,
    playerLoading,
    playerError,
    claimLoading,
    claimError,
    trackInventory,
    untrackInventory,
    trackInventories,
    untrackAll,
    isTracked,
    refreshSnapshot,
    getStaleSnapshots,
  }
}
