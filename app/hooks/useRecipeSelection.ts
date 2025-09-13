import { useState, useEffect, useCallback } from "react";
import type { Item } from "~/types/recipes";

interface RecipeSelection {
  selectedItem: Item | null;
  targetQuantity: number;
  lastUpdated: number;
}

const RECIPE_SELECTION_KEY = "recipeSelection";
const STALENESS_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export function useRecipeSelection() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [targetQuantity, setTargetQuantity] = useState(1);
  const [isStale, setIsStale] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECIPE_SELECTION_KEY);
      if (saved) {
        const selection: RecipeSelection = JSON.parse(saved);
        const now = Date.now();
        const isDataStale = now - selection.lastUpdated > STALENESS_THRESHOLD;
        
        setSelectedItem(selection.selectedItem);
        setTargetQuantity(selection.targetQuantity);
        setIsStale(isDataStale);
      }
    } catch (error) {
      console.warn("Failed to load recipe selection from localStorage:", error);
    }
  }, []);

  // Save to localStorage when selection changes
  const saveSelection = useCallback((item: Item | null, quantity: number) => {
    const selection: RecipeSelection = {
      selectedItem: item,
      targetQuantity: quantity,
      lastUpdated: Date.now(),
    };

    try {
      localStorage.setItem(RECIPE_SELECTION_KEY, JSON.stringify(selection));
      setIsStale(false);
    } catch (error) {
      console.warn("Failed to save recipe selection to localStorage:", error);
    }
  }, []);

  // Update selected item
  const updateSelectedItem = useCallback((item: Item | null) => {
    setSelectedItem(item);
    saveSelection(item, targetQuantity);
  }, [targetQuantity, saveSelection]);

  // Update target quantity
  const updateTargetQuantity = useCallback((quantity: number) => {
    setTargetQuantity(quantity);
    saveSelection(selectedItem, quantity);
  }, [selectedItem, saveSelection]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setTargetQuantity(1);
    try {
      localStorage.removeItem(RECIPE_SELECTION_KEY);
      setIsStale(false);
    } catch (error) {
      console.warn("Failed to clear recipe selection from localStorage:", error);
    }
  }, []);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECIPE_SELECTION_KEY) {
        if (e.newValue) {
          try {
            const selection: RecipeSelection = JSON.parse(e.newValue);
            const now = Date.now();
            const isDataStale = now - selection.lastUpdated > STALENESS_THRESHOLD;
            
            setSelectedItem(selection.selectedItem);
            setTargetQuantity(selection.targetQuantity);
            setIsStale(isDataStale);
          } catch (error) {
            console.warn("Failed to parse recipe selection from storage event:", error);
          }
        } else {
          setSelectedItem(null);
          setTargetQuantity(1);
          setIsStale(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    selectedItem,
    targetQuantity,
    isStale,
    updateSelectedItem,
    updateTargetQuantity,
    clearSelection,
  };
}
