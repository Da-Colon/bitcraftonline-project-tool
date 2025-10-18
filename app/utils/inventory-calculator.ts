/**
 * Utility for applying player inventory to recipe requirements with cascading logic.
 * This is recipe-specific logic, not general inventory tracking.
 */
import type { Item, Recipe } from "~/types/recipes"
import type { TrackedItem } from "~/types/recipe-tracking"
import { calculateTierReductions, applyTierReductions } from "./tier-calculation"

interface InventoryCalculatorProps {
  breakdown: {
    rawMaterials: Map<string, number>
    intermediates: Map<string, number>
  }
  playerInventory: Map<string, number>
  itemMap: Map<string, Item>
  recipeMap: Map<string, Recipe>
}

/**
 * Calculates the final tracking data after applying player inventory with cascading logic.
 */
export function calculateInventoryApplication({
  breakdown,
  playerInventory,
  itemMap,
  recipeMap,
}: InventoryCalculatorProps): {
  trackedItems: Map<string, TrackedItem>
  adjustedRequirements: Map<string, number>
} {
  const newTrackedItems = new Map<string, TrackedItem>()
  const originalRequirements = new Map([...breakdown.rawMaterials, ...breakdown.intermediates])
  const remainingRequirements = new Map(originalRequirements)
  const availableInventory = new Map(playerInventory)

  // --- Pass 1: Apply intermediates from inventory (top-down) ---
  const sortedIntermediates = [...breakdown.intermediates.keys()]
    .map((id) => itemMap.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.tier - a.tier)

  const removeIngredients = (itemId: string, quantity: number) => {
    const recipe = recipeMap.get(itemId)
    if (!recipe) return
    for (const input of recipe.inputs) {
      const requiredAmount = input.quantity * quantity
      const currentRequired = remainingRequirements.get(input.itemId) || 0
      const newRequired = Math.max(0, currentRequired - requiredAmount)
      if (newRequired === 0) {
        remainingRequirements.delete(input.itemId)
      } else {
        remainingRequirements.set(input.itemId, newRequired)
      }
      if (recipeMap.has(input.itemId)) {
        removeIngredients(input.itemId, requiredAmount)
      }
    }
  }

  for (const item of sortedIntermediates) {
    const available = availableInventory.get(item.id) || 0
    const required = remainingRequirements.get(item.id) || 0
    if (available > 0 && required > 0) {
      const consumed = Math.min(available, required)
      removeIngredients(item.id, consumed)
      availableInventory.set(item.id, available - consumed)
      remainingRequirements.set(item.id, required - consumed)
    }
  }

  // --- Pass 2: Apply direct raw material matches ---
  for (const [itemId, required] of remainingRequirements.entries()) {
    const available = availableInventory.get(itemId) || 0
    if (available > 0) {
      const consumed = Math.min(required, available)
      remainingRequirements.set(itemId, required - consumed)
      availableInventory.set(itemId, available - consumed)
    }
  }

  // --- Pass 3: Apply tier substitution for remaining raw materials ---
  const tierReductions = calculateTierReductions(remainingRequirements, availableInventory, itemMap)
  const finalAdjusted = applyTierReductions(remainingRequirements, tierReductions)

  // --- Final Step: Generate tracking data ---
  for (const [itemId, originalQty] of originalRequirements.entries()) {
    const remainingQty = finalAdjusted.get(itemId) || 0
    const completedQty = originalQty - remainingQty

    if (completedQty > 0) {
      newTrackedItems.set(itemId, {
        itemId,
        status: completedQty >= originalQty ? "completed" : "in_progress",
        completedQuantity: Math.round(completedQty),
        totalQuantity: originalQty,
      })
    }
  }

  return { trackedItems: newTrackedItems, adjustedRequirements: finalAdjusted }
}
