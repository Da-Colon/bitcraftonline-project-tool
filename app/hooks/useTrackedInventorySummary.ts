import { useMemo } from "react"
import { useSelectedPlayer } from "~/hooks/useSelectedPlayer"
import { usePlayerInventories } from "~/hooks/usePlayerInventories"
import { useSelectedClaim } from "~/hooks/useSelectedClaim"
import { useClaimInventories } from "~/hooks/useClaimInventories"
import { useTrackedInventories } from "~/hooks/useTrackedInventories"
import {
  buildTrackedInventorySummary,
  type TrackedInventorySummary,
} from "~/utils/combineAllTrackedInventories"
import type { PlayerInventories, ClaimInventoriesResponse } from "~/types/inventory"

export interface TrackedInventorySummaryResult extends TrackedInventorySummary {
  player: ReturnType<typeof useSelectedPlayer>["player"]
  claim: ReturnType<typeof useSelectedClaim>["claim"]
  playerInventories: PlayerInventories | null
  claimInventories: ClaimInventoriesResponse | null
  trackedInventoryIds: Set<string>
  trackedCount: number
  isTrackingLoaded: boolean
  loading: boolean
  error: string | null
  playerLoading: boolean
  playerError: string | null
  claimLoading: boolean
  claimError: string | null
  toggleTracking: (inventoryId: string) => void
  trackAll: (inventoryIds: string[]) => void
  untrackAll: () => void
  clearAll: () => void
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
    trackedInventories,
    toggleTracking,
    trackAll,
    untrackAll,
    clearAll,
    isLoaded,
  } = useTrackedInventories()

  const summary = useMemo(() => {
    return buildTrackedInventorySummary(playerInventories, claimInventories, trackedInventories)
  }, [playerInventories, claimInventories, trackedInventories])

  const loading = playerLoading || claimLoading
  const error = playerError || claimError || null
  const trackedCount = trackedInventories.size

  return {
    ...summary,
    player,
    claim,
    playerInventories,
    claimInventories,
    trackedInventoryIds: trackedInventories,
    trackedCount,
    isTrackingLoaded: isLoaded,
    loading,
    error,
    playerLoading,
    playerError,
    claimLoading,
    claimError,
    toggleTracking,
    trackAll,
    untrackAll,
    clearAll,
  }
}
