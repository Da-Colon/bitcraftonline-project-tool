/**
 * Custom hook for managing tracking state and operations
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import type { PlayerInventoryResponse } from "~/routes/api.player.inventory";
import type { TrackingData, TrackedItem, TrackingStatus, ProfessionProgress, TrackingStats } from "~/types/tracking";
import type { Item, Recipe } from "~/types/recipes";
import { calculateInventoryApplication } from "~/utils/inventory-calculator";

interface UseTrackingProps {
  breakdown: {
    rawMaterials: Map<string, number>;
    intermediates: Map<string, number>;
    totalItems: Map<string, number>;
  } | null;
  calcData: {
    items: Record<string, Item>;
    recipes: Record<string, Recipe>;
  } | null;
  itemMap: Map<string, Item>;
}

export function useTracking({ breakdown, calcData, itemMap }: UseTrackingProps) {
  const [adjustedBreakdown, setAdjustedBreakdown] = useState(breakdown);

  useEffect(() => {
    setAdjustedBreakdown(breakdown);
  }, [breakdown]);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    trackedItems: new Map(),
    professionProgress: [],
    globalFilters: {
      showCompleted: true,
      showInProgress: true,
      showNotStarted: true,
    },
  });
  const [lastApplyInfo, setLastApplyInfo] = useState<{
    playerName?: string;
    selectedInventories?: string[];
    matchedItems: number;
    fullySatisfiedItems: number;
    partiallySatisfiedItems: number;
    totalCompletedQuantity: number;
  } | null>(null);

  // Calculate profession progress for tracking
  const professionProgress = useMemo(() => {
    if (!breakdown) return [];

    // 1. Get all materials (raw + intermediates)
    const allMaterials = new Map<string, number>();
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }
    for (const [itemId, quantity] of breakdown.intermediates.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }

    // 2. Build profession data directly from tracking data
    const professions = new Map<string, {
      category: string;
      items: Array<{ item: Item; quantity: number; tracked?: TrackedItem }>;
      tierQuantities: Record<number, { completed: number; total: number }>;
    }>();

    for (const [itemId, originalQuantity] of allMaterials.entries()) {
      const item = (calcData?.items[itemId] as Item | undefined) || itemMap.get(itemId);
      if (!item) continue;

      const profession = item.category || "Other";
      if (!professions.has(profession)) {
        professions.set(profession, {
          category: profession,
          items: [],
          tierQuantities: {},
        });
      }

      const profData = professions.get(profession)!;
      const tracked = trackingData.trackedItems.get(itemId);
      profData.items.push({ item, quantity: originalQuantity, tracked });

      if (!profData.tierQuantities[item.tier]) {
        profData.tierQuantities[item.tier] = { completed: 0, total: 0 };
      }

      // Use the completed quantity directly from the tracking data
      const completedQuantity = tracked?.completedQuantity || 0;

      profData.tierQuantities[item.tier].total += originalQuantity;
      profData.tierQuantities[item.tier].completed += completedQuantity;
    }

    // 5. Convert to ProfessionProgress array for display
    return Array.from(professions.entries()).map(([profession, data]) => {
      const totalQuantity = Object.values(data.tierQuantities).reduce((sum, tier) => sum + tier.total, 0);
      const completedQuantity = Object.values(data.tierQuantities).reduce((sum, tier) => sum + tier.completed, 0);
      const progress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0;

      const completedItems = data.items.filter(i => {
        const t = i.tracked;
        return t?.status === 'completed' || (professions.get(profession)?.tierQuantities[i.item.tier]?.total === professions.get(profession)?.tierQuantities[i.item.tier]?.completed);
      }).length;

      return {
        profession,
        category: data.category,
        progress,
        completedItems,
        totalItems: data.items.length,
        tierQuantities: data.tierQuantities,
      } as ProfessionProgress;
    }).sort((a, b) => a.profession.localeCompare(b.profession));
  }, [breakdown, calcData, itemMap, trackingData]);

  // Calculate overall stats from all materials
  const overallStats = useMemo((): TrackingStats => {
    if (!breakdown) return { totalItems: 0, completedItems: 0, inProgressItems: 0, notStartedItems: 0 };
    
    // Count all unique items (raw + intermediates)
    const allItemIds = new Set([
      ...Array.from(breakdown.rawMaterials.keys()),
      ...Array.from(breakdown.intermediates.keys())
    ]);
    
    const totalItems = allItemIds.size;
    const completedItems = Array.from(trackingData.trackedItems.values())
      .filter((t: TrackedItem) => t.status === 'completed').length;
    const inProgressItems = Array.from(trackingData.trackedItems.values())
      .filter((t: TrackedItem) => t.status === 'in_progress').length;
    const notStartedItems = totalItems - completedItems - inProgressItems;
    
    return { totalItems, completedItems, inProgressItems, notStartedItems };
  }, [breakdown, trackingData]);

  const toggleItemTracking = useCallback((itemId: string, status: TrackingStatus) => {
    setTrackingData((prev: TrackingData) => {
      const newTrackedItems = new Map(prev.trackedItems);
      
      // Get quantity from either raw materials or intermediates
      const rawQuantity = breakdown?.rawMaterials.get(itemId) || 0;
      const intermediateQuantity = breakdown?.intermediates.get(itemId) || 0;
      const quantity = rawQuantity + intermediateQuantity;
      
      if (status === 'not_started') {
        newTrackedItems.delete(itemId);
      } else {
        // Always start with 0 completed quantity - user must manually update
        newTrackedItems.set(itemId, {
          itemId,
          status: 'in_progress',
          completedQuantity: 0,
          totalQuantity: quantity,
        });
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });
  }, [breakdown]);

  const resetAllTracking = useCallback(() => {
    setTrackingData((prev: TrackingData) => ({
      ...prev,
      trackedItems: new Map(),
    }));
  }, []);

  const addAllToTracking = useCallback(() => {
    if (!breakdown) return;
    
    setTrackingData((prev: TrackingData) => {
      const newTrackedItems = new Map(prev.trackedItems);
      
      // Add all materials (raw + intermediates)
      const allMaterials = new Map<string, number>();
      
      // Add raw materials
      for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
        allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
      }
      
      // Add intermediates
      for (const [itemId, quantity] of breakdown.intermediates.entries()) {
        allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
      }
      
      for (const [itemId, quantity] of allMaterials.entries()) {
        // Only add if not already tracked
        if (!newTrackedItems.has(itemId)) {
          newTrackedItems.set(itemId, {
            itemId,
            status: 'in_progress',
            completedQuantity: 0,
            totalQuantity: quantity,
          });
        }
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });
  }, [breakdown]);

  const applyPlayerInventory = useCallback((inventoryData: PlayerInventoryResponse) => {
    if (!breakdown || !calcData) return;

    const playerInventory = new Map<string, number>();
    Object.values(inventoryData.inventories).forEach((inventory) => {
      if (Array.isArray(inventory)) {
        inventory.forEach((item: any) => {
          playerInventory.set(item.itemId, (playerInventory.get(item.itemId) || 0) + item.quantity);
        });
      }
    });

    const { trackedItems, adjustedRequirements } = calculateInventoryApplication({
      breakdown,
      playerInventory,
      itemMap,
      recipeMap: new Map(Object.entries(calcData.recipes)),
    });

    setTrackingData(prev => ({ ...prev, trackedItems }));

    // Derive the new adjusted breakdown from the calculation results.
    const newAdjusted = {
        rawMaterials: new Map(),
        intermediates: new Map(),
        totalItems: new Map(breakdown.totalItems), // This might need adjustment later
    };

    for (const [itemId, quantity] of adjustedRequirements.entries()) {
        if (breakdown.rawMaterials.has(itemId)) {
            newAdjusted.rawMaterials.set(itemId, quantity);
        } else if (breakdown.intermediates.has(itemId)) {
            newAdjusted.intermediates.set(itemId, quantity);
        }
    }
    setAdjustedBreakdown(newAdjusted);

    setLastApplyInfo({
      playerName: inventoryData.playerName,
      selectedInventories: Object.keys(inventoryData.inventories),
      matchedItems: trackedItems.size,
      fullySatisfiedItems: [...trackedItems.values()].filter(i => i.status === 'completed').length,
      partiallySatisfiedItems: [...trackedItems.values()].filter(i => i.status === 'in_progress').length,
      totalCompletedQuantity: [...trackedItems.values()].reduce((sum, i) => sum + i.completedQuantity, 0),
    });

  }, [breakdown, calcData, itemMap]);

  return {
    trackingData,
    professionProgress,
    overallStats,
    toggleItemTracking,
    resetAllTracking,
    addAllToTracking,
    applyPlayerInventory,
    lastApplyInfo,
    adjustedBreakdown,
  };
}
