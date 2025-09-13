import { useState, useEffect, useMemo } from "react";
import { usePlayerInventorySelections } from "./usePlayerInventorySelections";
import { useSelectedClaim } from "./useSelectedClaim";
import { useClaimInventories } from "./useClaimInventories";
import { combineAllTrackedInventories } from "~/utils/combineAllTrackedInventories";
import type { InventoryItem } from "~/types/recipes";
import type { PlayerInventories } from "~/types/inventory";

export function useRecipeInventoryData() {
  const [playerInventoryData, setPlayerInventoryData] = useState<PlayerInventories | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  
  // Get player inventory selections
  const playerSelections = usePlayerInventorySelections();
  
  // Get selected claim data
  const { claim } = useSelectedClaim();
  const { inventories: claimInventories, loading: claimLoading } = useClaimInventories(claim?.claimId);

  // For now, we'll use a simple approach - get the first player with selections
  const firstPlayerWithSelections = useMemo(() => {
    const playerNames = Object.keys(playerSelections.selections);
    return playerNames.length > 0 ? playerNames[0] : null;
  }, [playerSelections.selections]);

  const currentPlayerSelections = useMemo(() => {
    if (!firstPlayerWithSelections) return null;
    return playerSelections.getPlayerSelections(firstPlayerWithSelections);
  }, [firstPlayerWithSelections, playerSelections]);

  // Load player inventory data when player is selected
  useEffect(() => {
    if (!firstPlayerWithSelections) {
      setPlayerInventoryData(null);
      setSelectedPlayerName(null);
      return;
    }

    const fetchPlayerData = async () => {
      try {
        const response = await fetch(`/api/player/${firstPlayerWithSelections}`);
        if (response.ok) {
          const data = await response.json();
          setPlayerInventoryData(data);
          setSelectedPlayerName(firstPlayerWithSelections);
        } else {
          setPlayerInventoryData(null);
          setSelectedPlayerName(null);
        }
      } catch (error) {
        console.warn("Failed to fetch player inventory data:", error);
        setPlayerInventoryData(null);
        setSelectedPlayerName(null);
      }
    };

    fetchPlayerData();
  }, [firstPlayerWithSelections]);

  // Combine all inventory data into a single inventory map
  const combinedInventory = useMemo((): InventoryItem[] => {
    if (!playerInventoryData && !claimInventories) {
      return [];
    }

    // Create set of tracked inventory IDs
    const trackedInventoryIds = new Set<string>();
    
    // Add selected player inventories
    if (currentPlayerSelections?.selectedInventories) {
      currentPlayerSelections.selectedInventories.forEach(id => trackedInventoryIds.add(id));
    }
    
    // Add all claim inventories if we have them
    if (claimInventories) {
      claimInventories.inventories.forEach(inv => trackedInventoryIds.add(inv.id));
    }

    const allInventories = combineAllTrackedInventories(
      playerInventoryData,
      claimInventories,
      trackedInventoryIds
    );

    // Convert to InventoryItem format expected by recipe calculator
    const result = allInventories.map(inv => ({
      itemId: inv.itemId,
      quantity: inv.totalQuantity,
    }));

    return result;
  }, [playerInventoryData, currentPlayerSelections, claimInventories, firstPlayerWithSelections]);

  // Create inventory map for easy lookup
  const inventoryMap = useMemo(() => {
    const map = new Map<string, number>();
    combinedInventory.forEach(item => {
      const existing = map.get(item.itemId) || 0;
      map.set(item.itemId, existing + item.quantity);
    });
    return map;
  }, [combinedInventory]);

  const hasInventoryData = combinedInventory.length > 0;
  const isLoading = claimLoading;
  const isPlayerDataStale = selectedPlayerName ? playerSelections.areSelectionsStale(selectedPlayerName) : false;
  
  return {
    combinedInventory,
    inventoryMap,
    hasInventoryData,
    isLoading,
    selectedPlayer: selectedPlayerName,
    selectedClaim: claim?.claimId || null,
    isPlayerDataStale,
  };
}
