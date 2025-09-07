/**
 * Custom hook for managing tracking state and operations
 */
import { useState, useMemo, useCallback } from "react";
import type { TrackingData, TrackedItem, TrackingStatus, ProfessionProgress, TrackingStats } from "~/types/tracking";
import type { Item } from "~/types/recipes";
import { calculateTierReductions, applyTierReductions } from "~/utils/tier-calculation";

interface UseTrackingProps {
  breakdown: {
    rawMaterials: Map<string, number>;
    intermediates: Map<string, number>;
    totalItems: Map<string, number>;
  } | null;
  calcData: {
    items: Record<string, Item>;
  } | null;
  itemMap: Map<string, Item>;
}

export function useTracking({ breakdown, calcData, itemMap }: UseTrackingProps) {
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
    const professions = new Map<string, {
      category: string;
      items: Array<{ item: Item; quantity: number; tracked?: TrackedItem }>;
      tierQuantities: Record<number, { completed: number; total: number }>;
    }>();

    // Combine raw materials and intermediates for tracking
    const allMaterials = new Map<string, number>();
    
    // Add raw materials
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }
    
    // Add intermediates
    for (const [itemId, quantity] of breakdown.intermediates.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }

    // Initialize profession data from all materials
    for (const [itemId, quantity] of allMaterials.entries()) {
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
      profData.items.push({ item, quantity, tracked });
      
      // Initialize tier data if not exists
      if (!profData.tierQuantities[item.tier]) {
        profData.tierQuantities[item.tier] = { completed: 0, total: 0 };
      }
      profData.tierQuantities[item.tier].total += quantity;
      if (tracked?.status === 'completed') {
        profData.tierQuantities[item.tier].completed += tracked.completedQuantity;
      } else if (tracked?.status === 'in_progress') {
        profData.tierQuantities[item.tier].completed += tracked.completedQuantity;
      }
    }

    // Convert to ProfessionProgress array
    return Array.from(professions.entries()).map(([profession, data]) => {
      const totalItems = data.items.length;
      const completedItems = data.items.filter(i => i.tracked?.status === 'completed').length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      return {
        profession,
        category: data.category,
        progress,
        completedItems,
        totalItems,
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

  const applyPlayerInventory = useCallback(async (playerName: string, selectedInventories: string[]) => {
    if (!breakdown) return;

    // Fetch player inventory data
    const params = new URLSearchParams();
    params.set('playerName', playerName);
    selectedInventories.forEach(inv => params.append('inventoryTypes', inv));
    
    console.log('Fetching inventory for:', playerName, 'sources:', selectedInventories);
    const response = await fetch(`/api/player/inventory?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch player inventory');
    }
    
    const inventoryData = await response.json();
    console.log('Raw inventory response:', inventoryData);
    
    // Aggregate all inventory items
    const playerItems = new Map<string, number>();
    Object.values(inventoryData.inventories).forEach((inventory) => {
      if (Array.isArray(inventory)) {
        inventory.forEach((item: any) => {
          const current = playerItems.get(item.itemId) || 0;
          playerItems.set(item.itemId, current + item.quantity);
        });
      }
    });
    
    console.log('Aggregated player items:', Array.from(playerItems.entries()));
    console.log('Required items from breakdown:', Array.from(breakdown.rawMaterials.entries()).slice(0, 5));

    // Combine all materials for tier-aware calculation
    const allMaterials = new Map<string, number>();
    
    // Add raw materials
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }
    
    // Add intermediates
    for (const [itemId, quantity] of breakdown.intermediates.entries()) {
      allMaterials.set(itemId, (allMaterials.get(itemId) || 0) + quantity);
    }

    // Apply tier-aware calculation to all materials
    const tierReductions = calculateTierReductions(
      allMaterials,
      playerItems,
      itemMap
    );
    
    const adjustedRequirements = applyTierReductions(
      allMaterials,
      tierReductions
    );

    console.log('Adjusted requirements after tier calc:', Array.from(adjustedRequirements.entries()).slice(0, 5));

    // Apply inventory to tracking with tier-aware calculation
    let matchedItems = 0;
    let fullySatisfiedItems = 0;
    let partiallySatisfiedItems = 0;
    let totalCompletedQuantity = 0;
    setTrackingData((prev: TrackingData) => {
      const newTrackedItems = new Map(prev.trackedItems);
      
      for (const [itemId, requiredQuantity] of adjustedRequirements.entries()) {
        const availableQuantity = playerItems.get(itemId) || 0;
        const completedQuantity = Math.min(availableQuantity, requiredQuantity);
        
        console.log(`Item ${itemId}: required=${requiredQuantity}, available=${availableQuantity}, completed=${completedQuantity}`);
        
        if (completedQuantity > 0) {
          const status: TrackingStatus = completedQuantity >= requiredQuantity ? 'completed' : 'in_progress';
          newTrackedItems.set(itemId, {
            itemId,
            status,
            completedQuantity,
            totalQuantity: requiredQuantity,
          });

          matchedItems += 1;
          totalCompletedQuantity += completedQuantity;
          if (completedQuantity >= requiredQuantity) {
            fullySatisfiedItems += 1;
          } else {
            partiallySatisfiedItems += 1;
          }
        }
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });

    setLastApplyInfo({
      playerName,
      selectedInventories,
      matchedItems,
      fullySatisfiedItems,
      partiallySatisfiedItems,
      totalCompletedQuantity,
    });
  }, [breakdown]);

  return {
    trackingData,
    professionProgress,
    overallStats,
    toggleItemTracking,
    resetAllTracking,
    addAllToTracking,
    applyPlayerInventory,
    lastApplyInfo,
  };
}
