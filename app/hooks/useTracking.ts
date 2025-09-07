/**
 * Custom hook for managing tracking state and operations
 */
import { useState, useMemo, useCallback } from "react";
import type { TrackingData, TrackedItem, TrackingStatus, ProfessionProgress, TrackingStats } from "~/types/tracking";
import type { Item } from "~/types/recipes";

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

  // Calculate profession progress for tracking
  const professionProgress = useMemo(() => {
    if (!breakdown) return [];
    const professions = new Map<string, {
      category: string;
      items: Array<{ item: Item; quantity: number; tracked?: TrackedItem }>;
      tierQuantities: Record<number, { completed: number; total: number }>;
    }>();

    // Initialize profession data
    for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
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

  // Calculate overall stats
  const overallStats = useMemo((): TrackingStats => {
    if (!breakdown) return { totalItems: 0, completedItems: 0, inProgressItems: 0, notStartedItems: 0 };
    const totalItems = Array.from(breakdown.rawMaterials.keys()).length;
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
      const quantity = breakdown?.rawMaterials.get(itemId) || 0;
      
      if (status === 'not_started') {
        newTrackedItems.delete(itemId);
      } else {
        newTrackedItems.set(itemId, {
          itemId,
          status,
          completedQuantity: status === 'completed' ? quantity : 0,
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

  const autoFillCompleted = useCallback(() => {
    if (!breakdown) return;
    
    setTrackingData((prev: TrackingData) => {
      const newTrackedItems = new Map(prev.trackedItems);
      
      for (const [itemId, quantity] of breakdown.rawMaterials.entries()) {
        newTrackedItems.set(itemId, {
          itemId,
          status: 'completed',
          completedQuantity: quantity,
          totalQuantity: quantity,
        });
      }
      
      return {
        ...prev,
        trackedItems: newTrackedItems,
      };
    });
  }, [breakdown]);

  return {
    trackingData,
    professionProgress,
    overallStats,
    toggleItemTracking,
    resetAllTracking,
    autoFillCompleted,
  };
}
