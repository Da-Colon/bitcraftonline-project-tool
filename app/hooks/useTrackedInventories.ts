import { useState, useEffect, useCallback } from "react";

const TRACKED_INVENTORIES_KEY = "bitcraft-tracked-inventories";

export function useTrackedInventories() {
  const [trackedInventories, setTrackedInventories] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TRACKED_INVENTORIES_KEY);
        if (stored && stored !== "[]") {
          const parsed = JSON.parse(stored);
          setTrackedInventories(new Set(parsed));
        }
      } catch (error) {
        // ignore
      }
    }
  }, []);

  // Save to localStorage whenever trackedInventories changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const arrayToSave = Array.from(trackedInventories);
        localStorage.setItem(TRACKED_INVENTORIES_KEY, JSON.stringify(arrayToSave));
      } catch (error) {
        // ignore
      }
    }
  }, [trackedInventories]);

  const toggleTracking = useCallback((inventoryId: string) => {
    setTrackedInventories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(inventoryId)) newSet.delete(inventoryId);
      else newSet.add(inventoryId);
      return newSet;
    });
  }, []);

  const isTracked = useCallback((inventoryId: string) => {
    return trackedInventories.has(inventoryId);
  }, [trackedInventories]);

  const clearAll = useCallback(() => {
    setTrackedInventories(new Set());
  }, []);

  return {
    trackedInventories,
    toggleTracking,
    isTracked,
    clearAll,
  };
}
