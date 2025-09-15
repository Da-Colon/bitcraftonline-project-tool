import type { RecipeBreakdownItem, TierCalculationResult, InventoryItem } from "~/types/recipes"
import { RecipeCalculator } from "./recipe-calculator.server"
import { enhanceItemWithIcon } from "~/services/gamedata-icon-lookup.server"

export class EnhancedRecipeCalculator extends RecipeCalculator {
  /**
   * Calculate recipe requirements with tier-based inventory adjustments
   * This is the core method that handles the complex tier-based calculations
   */
  calculateWithInventory(
    targetItemId: string,
    targetQuantity: number,
    inventory: InventoryItem[]
  ): TierCalculationResult {
    const DEBUG =
      typeof process !== "undefined" &&
      (process.env.RECIPE_DEBUG === "1" || process.env.NODE_ENV === "development")

    // Create inventory map - handle both formats
    const inventoryMap = new Map<string, number>()
    inventory.forEach((item) => {
      // Try both the raw itemId and the "item_" prefixed version
      inventoryMap.set(item.itemId, item.quantity)
      if (!item.itemId.startsWith("item_")) {
        inventoryMap.set(`item_${item.itemId}`, item.quantity)
      }
    })

    if (DEBUG) {
      try {
        const sampleKeys = Array.from(inventoryMap.keys()).slice(0, 10)
        const direct = inventoryMap.get(targetItemId)
        const fallback = targetItemId.startsWith("item_")
          ? inventoryMap.get(targetItemId.replace(/^item_/, ""))
          : inventoryMap.get(`item_${targetItemId}`)
        console.debug(
          `[EnhancedRecipeCalculator] calc start: target=${targetItemId} qty=${targetQuantity} invCount=${
            inventory.length
          } mapSize=${inventoryMap.size} match=${
            direct ?? fallback ?? 0
          } sampleKeys=${JSON.stringify(sampleKeys)}`
        )
      } catch {
        // ignore debug errors
      }
    }

    // Get base recipe breakdown
    const baseBreakdown = this.calculateItemBreakdown(targetItemId, targetQuantity)

    // Simple inventory application - just subtract what you have
    const adjustedBreakdown = baseBreakdown.map((item) => {
      const currentInventory = inventoryMap.get(item.itemId) || 0
      const actualRequired = Math.max(0, item.recipeRequired - currentInventory)

      return {
        ...item,
        currentInventory,
        actualRequired,
        deficit: actualRequired,
      }
    })

    const totalDeficit = new Map<string, number>()
    adjustedBreakdown.forEach((item) => {
      if (item.deficit > 0) {
        totalDeficit.set(item.itemId, item.deficit)
      }
    })

    const result = {
      breakdown: adjustedBreakdown,
      totalDeficit,
    }

    if (DEBUG) {
      try {
        const matched = adjustedBreakdown
          .filter((b) => (inventoryMap.get(b.itemId) || 0) > 0)
          .slice(0, 10)
          .map((b) => ({ id: b.itemId, have: inventoryMap.get(b.itemId)!, need: b.recipeRequired }))
        console.debug(
          `[EnhancedRecipeCalculator] calc end: matchedItemsSample=${JSON.stringify(matched)}`
        )
      } catch {
        // ignore debug errors
      }
    }

    return result
  }

  /**
   * Get detailed breakdown for a single item including all nested requirements
   */
  private calculateItemBreakdown(itemId: string, quantity: number): RecipeBreakdownItem[] {
    const breakdown = new Map<string, RecipeBreakdownItem>()

    this.calculateItemRequirementsDetailed(itemId, quantity, breakdown, new Set())

    // Initialize currentInventory to 0 for all items
    const result = Array.from(breakdown.values()).map((item) => ({
      ...item,
      currentInventory: 0,
    }))

    return result
  }

  /**
   * Recursively calculate detailed requirements for an item
   */
  private calculateItemRequirementsDetailed(
    itemId: string,
    quantity: number,
    breakdown: Map<string, RecipeBreakdownItem>,
    stack: Set<string> = new Set()
  ): void {
    if (stack.has(itemId)) {
      console.warn(`Cycle detected for item: ${itemId}`)
      return
    }

    const item = this.getItem(itemId)
    if (!item) return

    stack.add(itemId)

    // Update or create breakdown item
    const existing = breakdown.get(itemId)
    if (existing) {
      existing.recipeRequired += quantity
    } else {
      // Enhance the item to ensure it has iconAssetName
      const enhancedItem = enhanceItemWithIcon(item)

      breakdown.set(itemId, {
        itemId,
        name: enhancedItem.name,
        tier: enhancedItem.tier,
        category: enhancedItem.category,
        recipeRequired: quantity,
        actualRequired: quantity,
        currentInventory: 0,
        deficit: quantity,
        iconAssetName: enhancedItem.iconAssetName,
      })
    }

    // If this item has a recipe, calculate requirements for inputs
    const recipe = this.getRecipe(itemId)
    if (recipe) {
      const craftingBatches = Math.ceil(quantity / recipe.outputQuantity)

      recipe.inputs.forEach((input) => {
        const requiredQuantity = input.quantity * craftingBatches
        this.calculateItemRequirementsDetailed(input.itemId, requiredQuantity, breakdown, stack)
      })
    }

    stack.delete(itemId)
  }
}

// Singleton instance
let enhancedCalculatorInstance: EnhancedRecipeCalculator | null = null

export function getEnhancedRecipeCalculator(): EnhancedRecipeCalculator {
  if (!enhancedCalculatorInstance) {
    enhancedCalculatorInstance = new EnhancedRecipeCalculator()
  }
  return enhancedCalculatorInstance
}
