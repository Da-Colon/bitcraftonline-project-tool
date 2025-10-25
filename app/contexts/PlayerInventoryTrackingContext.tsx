/**
 * Context provider for shared player inventory tracking state
 * Ensures all components use the same hook instance and state
 */

import { createContext, useContext, type ReactNode } from "react"

import { usePlayerInventoryTracking } from "~/hooks/usePlayerInventoryTracking"
// import type { Inventory, ClaimInventory } from "~/types/inventory"
// import type { TrackedInventorySnapshot, InventorySnapshotMetadata } from "~/types/inventory-tracking"

type PlayerInventoryTrackingContextType = ReturnType<typeof usePlayerInventoryTracking>

const PlayerInventoryTrackingContext = createContext<PlayerInventoryTrackingContextType | null>(
  null
)

interface PlayerInventoryTrackingProviderProps {
  playerId: string | null
  children: ReactNode
}

export function PlayerInventoryTrackingProvider({
  playerId,
  children,
}: PlayerInventoryTrackingProviderProps) {
  const tracking = usePlayerInventoryTracking(playerId)

  return (
    <PlayerInventoryTrackingContext.Provider value={tracking}>
      {children}
    </PlayerInventoryTrackingContext.Provider>
  )
}

export function useSharedPlayerInventoryTracking() {
  const context = useContext(PlayerInventoryTrackingContext)
  if (!context) {
    throw new Error(
      "useSharedPlayerInventoryTracking must be used within PlayerInventoryTrackingProvider"
    )
  }
  return context
}
