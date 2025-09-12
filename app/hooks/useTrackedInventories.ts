import { useState, useEffect, useCallback } from "react";

const TRACKED_INVENTORIES_KEY = "bitcraft-tracked-inventories";

export function useTrackedInventories() {
  const [trackedInventories, setTrackedInventories] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TRACKED_INVENTORIES_KEY);
        console.log("Loading from localStorage:", stored);
        if (stored && stored !== "[]") {
          const parsed = JSON.parse(stored);
          console.log("Parsed tracked inventories:", parsed);
          setTrackedInventories(new Set(parsed));
        } else {
          console.log("No tracked inventories found or empty array");
        }
      } catch (error) {
        console.warn("Failed to load tracked inventories from localStorage:", error);
      }
    }
  }, []);

  // Save to localStorage whenever trackedInventories changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const arrayToSave = Array.from(trackedInventories);
        console.log("Saving to localStorage:", arrayToSave);
        localStorage.setItem(TRACKED_INVENTORIES_KEY, JSON.stringify(arrayToSave));
      } catch (error) {
        console.warn("Failed to save tracked inventories to localStorage:", error);
      }
    }
  }, [trackedInventories]);

  const toggleTracking = useCallback((inventoryId: string) => {
    console.log("toggleTracking called with:", inventoryId);
    setTrackedInventories(prev => {
      console.log("Previous tracked inventories:", Array.from(prev));
      const newSet = new Set(prev);
      if (newSet.has(inventoryId)) {
        console.log("Removing inventory:", inventoryId);
        newSet.delete(inventoryId);
      } else {
        console.log("Adding inventory:", inventoryId);
        newSet.add(inventoryId);
      }
      console.log("New tracked inventories:", Array.from(newSet));
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
