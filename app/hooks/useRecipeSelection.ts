import { useState, useEffect, useCallback } from "react"

import type { Item } from "~/types/recipes"

interface RecipeSelection {
  selectedItem: Item | null
  targetQuantity: number
  lastUpdated: number
}

const RECIPE_SELECTION_KEY = "recipeSelection"

export function useRecipeSelection() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [targetQuantity, setTargetQuantity] = useState(1)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECIPE_SELECTION_KEY)
      if (saved) {
        const selection: RecipeSelection = JSON.parse(saved)
        setSelectedItem(selection.selectedItem)
        setTargetQuantity(selection.targetQuantity)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save to localStorage when selection changes
  const saveSelection = useCallback((item: Item | null, quantity: number) => {
    const selection: RecipeSelection = {
      selectedItem: item,
      targetQuantity: quantity,
      lastUpdated: Date.now(),
    }

    try {
      localStorage.setItem(RECIPE_SELECTION_KEY, JSON.stringify(selection))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Update selected item
  const updateSelectedItem = useCallback(
    (item: Item | null) => {
      setSelectedItem(item)
      saveSelection(item, targetQuantity)
    },
    [targetQuantity, saveSelection]
  )

  // Update target quantity
  const updateTargetQuantity = useCallback(
    (quantity: number) => {
      setTargetQuantity(quantity)
      saveSelection(selectedItem, quantity)
    },
    [selectedItem, saveSelection]
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItem(null)
    setTargetQuantity(1)
    try {
      localStorage.removeItem(RECIPE_SELECTION_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECIPE_SELECTION_KEY) {
        if (e.newValue) {
          try {
            const selection: RecipeSelection = JSON.parse(e.newValue)

            setSelectedItem(selection.selectedItem)
            setTargetQuantity(selection.targetQuantity)
          } catch {
            // Ignore localStorage errors
          }
        } else {
          setSelectedItem(null)
          setTargetQuantity(1)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return {
    selectedItem,
    targetQuantity,
    updateSelectedItem,
    updateTargetQuantity,
    clearSelection,
  }
}
