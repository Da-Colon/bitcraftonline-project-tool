import type { RecipeBreakdownItem, TierCalculationResult, InventoryItem } from "~/types/recipes"
import { RecipeCalculator } from "./recipe-calculator.server"

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
    // Create inventory map - handle both formats
    const inventoryMap = new Map<string, number>()
    inventory.forEach((item) => {
      // Try both the raw itemId and the "item_" prefixed version
      inventoryMap.set(item.itemId, item.quantity)
      if (!item.itemId.startsWith("item_")) {
        inventoryMap.set(`item_${item.itemId}`, item.quantity)
      }
    })

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

    return {
      breakdown: adjustedBreakdown,
      totalDeficit,
    }
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
      breakdown.set(itemId, {
        itemId,
        name: item.name,
        tier: item.tier,
        category: item.category,
        recipeRequired: quantity,
        actualRequired: quantity,
        currentInventory: 0,
        deficit: quantity,
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
