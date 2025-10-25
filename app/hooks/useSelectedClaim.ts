import { useState, useEffect } from "react";

import { useSelectedPlayer } from "./useSelectedPlayer";

const SELECTED_CLAIM_KEY = "bitcraft-selected-claim";

export interface SelectedClaim {
  claimId: string;
  claimName: string;
}

export function useSelectedClaim() {
  const { player } = useSelectedPlayer();
  const [claim, setClaim] = useState<SelectedClaim | null>(null);

  // Get the storage key for the current player
  const getStorageKey = (playerId: string) => `${SELECTED_CLAIM_KEY}-${playerId}`;

  // Load from localStorage on mount and when player changes
  useEffect(() => {
    if (typeof window !== "undefined" && player?.entityId) {
      try {
        const storageKey = getStorageKey(player.entityId);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setClaim(parsed);
        } else {
          // Clear claim if no stored data for this player
          setClaim(null);
        }
      } catch {
        setClaim(null);
      }
    } else if (!player?.entityId) {
      // Clear claim when no player is selected
      setClaim(null);
    }
  }, [player?.entityId]);

  // Save to localStorage whenever claim changes
  useEffect(() => {
    if (typeof window !== "undefined" && player?.entityId) {
      try {
        const storageKey = getStorageKey(player.entityId);
        if (claim) {
          localStorage.setItem(storageKey, JSON.stringify(claim));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [claim, player?.entityId]);

  const selectClaim = (claimId: string, claimName: string) => {
    setClaim({ claimId, claimName });
  };

  const clearClaim = () => {
    setClaim(null);
  };

  return {
    claim,
    selectClaim,
    clearClaim,
  };
}
