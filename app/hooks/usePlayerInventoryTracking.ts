/**
 * Player-scoped inventory tracking hook
 * Replaces the global useTrackedInventories hook
 */

import { useState, useEffect, useCallback } from "react"

import { inventoryStorageService } from "~/services/inventory-storage.service"
import type { Inventory, ClaimInventory } from "~/types/inventory"
import type {
  TrackedInventorySnapshot,
  InventorySnapshotMetadata,
  InventorySource,
} from "~/types/inventory-tracking"
import { createInventorySnapshot, getSnapshotMetadata } from "~/utils/inventory-snapshot"

export function usePlayerInventoryTracking(playerId: string | null) {
  const [snapshots, setSnapshots] = useState<TrackedInventorySnapshot[]>([])
  const [metadata, setMetadata] = useState<Map<string, InventorySnapshotMetadata>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load snapshots for the current player
  const loadSnapshots = useCallback(async () => {
    if (!playerId) {
      setSnapshots([])
      setMetadata(new Map())
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const playerSnapshots = await inventoryStorageService.getPlayerTrackedInventories(playerId)
      setSnapshots(playerSnapshots)

      // Calculate metadata for each snapshot
      const newMetadata = new Map<string, InventorySnapshotMetadata>()
      playerSnapshots.forEach((snapshot) => {
        newMetadata.set(snapshot.id, getSnapshotMetadata(snapshot))
      })
      setMetadata(newMetadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracked inventories")
      console.error("Failed to load tracked inventories:", err)
    } finally {
      setIsLoading(false)
    }
  }, [playerId])

  // Load snapshots on mount and when player changes
  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // Track an inventory by creating a snapshot
  const trackInventory = useCallback(
    async (
      inventory: Inventory | ClaimInventory,
      source: "personal" | "bank" | "storage" | "recovery" | "housing" | "claim"
    ) => {
      if (!playerId) {
        throw new Error("No player selected")
      }

      try {
        const snapshot = createInventorySnapshot(inventory, source)
        await inventoryStorageService.saveTrackedInventory(playerId, snapshot)
        
        // Direct state update instead of re-fetching
        setSnapshots(prev => [...prev, snapshot])
        setMetadata(prev => {
          const newMetadata = new Map(prev)
          newMetadata.set(snapshot.id, getSnapshotMetadata(snapshot))
          return newMetadata
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to track inventory")
        throw err
      }
    },
    [playerId]
  )

  // Untrack an inventory
  const untrackInventory = useCallback(
    async (inventoryId: string) => {
      if (!playerId) {
        throw new Error("No player selected")
      }

      try {
        await inventoryStorageService.removeTrackedInventory(playerId, inventoryId)
        
        // Direct state update instead of re-fetching
        setSnapshots(prev => prev.filter(s => s.id !== inventoryId))
        setMetadata(prev => {
          const newMetadata = new Map(prev)
          newMetadata.delete(inventoryId)
          return newMetadata
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to untrack inventory")
        throw err
      }
    },
    [playerId]
  )

  // Track multiple inventories
  const trackInventories = useCallback(
    async (
      inventories: (Inventory | ClaimInventory)[],
      source: "personal" | "bank" | "storage" | "recovery" | "housing" | "claim"
    ) => {
      if (!playerId) {
        throw new Error("No player selected")
      }

      try {
        const snapshots = inventories.map((inventory) => createInventorySnapshot(inventory, source))

        // Save all snapshots
        for (const snapshot of snapshots) {
          await inventoryStorageService.saveTrackedInventory(playerId, snapshot)
        }

        // Direct state update instead of re-fetching
        setSnapshots(prev => [...prev, ...snapshots])
        setMetadata(prev => {
          const newMetadata = new Map(prev)
          snapshots.forEach(snapshot => {
            newMetadata.set(snapshot.id, getSnapshotMetadata(snapshot))
          })
          return newMetadata
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to track inventories")
        throw err
      }
    },
    [playerId]
  )

  // Untrack all inventories for the current player
  const untrackAll = useCallback(async () => {
    if (!playerId) {
      throw new Error("No player selected")
    }

    try {
      await inventoryStorageService.clearPlayerTracking(playerId)
      await loadSnapshots() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear tracking")
      throw err
    }
  }, [playerId, loadSnapshots])

  // Check if an inventory is tracked
  const isTracked = useCallback(
    (inventoryId: string) => {
      return snapshots.some((snapshot) => snapshot.id === inventoryId)
    },
    [snapshots]
  )

  // Get snapshot for a specific inventory
  const getSnapshot = useCallback(
    (inventoryId: string) => {
      return snapshots.find((snapshot) => snapshot.id === inventoryId)
    },
    [snapshots]
  )

  // Refresh a specific snapshot with fresh data
  const refreshSnapshot = useCallback(
    async (
      inventoryId: string,
      freshInventory: Inventory | ClaimInventory,
      source: "personal" | "bank" | "storage" | "recovery" | "housing" | "claim"
    ) => {
      if (!playerId) {
        throw new Error("No player selected")
      }

      try {
        const snapshot = createInventorySnapshot(freshInventory, source)
        await inventoryStorageService.saveTrackedInventory(playerId, snapshot)
        
        // Direct state update instead of re-fetching
        setSnapshots(prev => prev.map(s => s.id === inventoryId ? snapshot : s))
        setMetadata(prev => {
          const newMetadata = new Map(prev)
          newMetadata.set(snapshot.id, getSnapshotMetadata(snapshot))
          return newMetadata
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refresh snapshot")
        throw err
      }
    },
    [playerId]
  )

  // Get snapshots that need refresh
  const getStaleSnapshots = useCallback(() => {
    return snapshots.filter((snapshot) => {
      const meta = metadata.get(snapshot.id)
      return meta?.needsRefresh || false
    })
  }, [snapshots, metadata])

  // Get snapshots by claim ID
  const getSnapshotsByClaim = useCallback(
    (claimId: string) => {
      return snapshots.filter((snapshot) => snapshot.claimId === claimId)
    },
    [snapshots]
  )

  // Get snapshots by source
  const getSnapshotsBySource = useCallback(
    (source: InventorySource) => {
      return snapshots.filter((snapshot) => snapshot.source === source)
    },
    [snapshots]
  )

  // Untrack all inventories from a specific claim
  const untrackByClaim = useCallback(
    async (claimId: string) => {
      if (!playerId) {
        throw new Error("No player selected")
      }

      try {
        await inventoryStorageService.clearClaimTracking(playerId, claimId)
        
        // Direct state update instead of re-fetching
        setSnapshots(prev => prev.filter(s => s.claimId !== claimId))
        setMetadata(prev => {
          const newMetadata = new Map(prev)
          prev.forEach((_, snapshotId) => {
            const snapshot = snapshots.find(s => s.id === snapshotId)
            if (snapshot?.claimId === claimId) {
              newMetadata.delete(snapshotId)
            }
          })
          return newMetadata
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to clear claim tracking")
        throw err
      }
    },
    [playerId, snapshots]
  )

  // Get tracking summary with breakdown by source and claim
  const getTrackingSummary = useCallback(async () => {
    if (!playerId) {
      return {
        total: 0,
        bySource: {},
        byClaim: {},
      }
    }

    try {
      return await inventoryStorageService.getTrackingSummaryBySource(playerId)
    } catch (err) {
      console.error("Failed to get tracking summary:", err)
      return {
        total: 0,
        bySource: {},
        byClaim: {},
      }
    }
  }, [playerId])

  return {
    snapshots,
    metadata,
    isLoading,
    error,
    trackInventory,
    untrackInventory,
    trackInventories,
    untrackAll,
    untrackByClaim,
    isTracked,
    getSnapshot,
    refreshSnapshot,
    getStaleSnapshots,
    getSnapshotsByClaim,
    getSnapshotsBySource,
    getTrackingSummary,
    reload: loadSnapshots,
  }
}
