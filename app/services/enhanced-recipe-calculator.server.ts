import type { RecipeBreakdownItem, TierCalculationResult, InventoryItem } from "~/types/recipes"
import { RecipeCalculator } from "./recipe-calculator.server"
import { enhanceItemWithIcon } from "~/services/gamedata-icon-lookup.server"

export class EnhancedRecipeCalculator extends RecipeCalculator {
  /**
   * Calculate recipe requirements with tier-based inventory adjustments
   * Uses a two-pass approach: first build complete recipe tree, then apply inventory reductions
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

    const startTime = DEBUG ? Date.now() : 0
    
    // Pass 1: Build complete recipe tree with full requirements
    const breakdown = new Map<string, RecipeBreakdownItem>()
    const dependencies = new Map<string, Set<string>>() // parent -> children
    this.buildCompleteRecipeTree(targetItemId, targetQuantity, breakdown, dependencies, new Set())
    
    // Pass 2: Apply inventory reductions with dependency awareness
    this.applyInventoryReductions(breakdown, dependencies, inventoryMap)
    
    if (DEBUG) {
      const duration = Date.now() - startTime
      const maxDepth = this.calculateMaxDepth(targetItemId, new Set())
      console.debug(
        `[EnhancedRecipeCalculator] calc performance: duration=${duration}ms depth=${maxDepth} items=${breakdown.size}`
      )
    }

    // Convert to array and sort by tier (higher tier items first for display)
    const adjustedBreakdown = Array.from(breakdown.values()).sort((a, b) => b.tier - a.tier)

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
          .filter((b) => b.currentInventory > 0)
          .slice(0, 10)
          .map((b) => ({ id: b.itemId, have: b.currentInventory, need: b.recipeRequired, deficit: b.deficit }))
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
   * Build complete recipe tree without inventory considerations (Pass 1)
   */
  private buildCompleteRecipeTree(
    itemId: string,
    quantity: number,
    breakdown: Map<string, RecipeBreakdownItem>,
    dependencies: Map<string, Set<string>>,
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
      const enhancedItem = enhanceItemWithIcon(item)
      breakdown.set(itemId, {
        itemId,
        name: enhancedItem.name,
        tier: enhancedItem.tier,
        category: enhancedItem.category,
        recipeRequired: quantity,
        actualRequired: quantity, // Will be updated in pass 2
        currentInventory: 0, // Will be updated in pass 2
        deficit: quantity, // Will be updated in pass 2
        iconAssetName: enhancedItem.iconAssetName,
      })
    }

    // If this item has a recipe, process inputs
    const recipe = this.getRecipe(itemId)
    if (recipe) {
      const craftingBatches = Math.ceil(quantity / recipe.outputQuantity)
      
      // Track dependencies
      if (!dependencies.has(itemId)) {
        dependencies.set(itemId, new Set())
      }

      recipe.inputs.forEach((input) => {
        const requiredQuantity = input.quantity * craftingBatches
        dependencies.get(itemId)!.add(input.itemId)
        this.buildCompleteRecipeTree(input.itemId, requiredQuantity, breakdown, dependencies, stack)
      })
    }

    stack.delete(itemId)
  }

  /**
   * Apply inventory reductions with dependency awareness (Pass 2)
   */
  private applyInventoryReductions(
    breakdown: Map<string, RecipeBreakdownItem>,
    dependencies: Map<string, Set<string>>,
    inventoryMap: Map<string, number>
  ): void {
    // Process items by tier (highest first) to ensure parent reductions propagate to children
    const sortedItems = Array.from(breakdown.values()).sort((a, b) => b.tier - a.tier)
    
    for (const item of sortedItems) {
      // Get current inventory for this item (with fallback key handling)
      let currentInventory = inventoryMap.get(item.itemId) || 0
      if (currentInventory === 0 && !item.itemId.startsWith("item_")) {
        currentInventory = inventoryMap.get(`item_${item.itemId}`) || 0
      }
      if (currentInventory === 0 && item.itemId.startsWith("item_")) {
        currentInventory = inventoryMap.get(item.itemId.replace(/^item_/, "")) || 0
      }

      // Update inventory and calculate actual requirements
      item.currentInventory = currentInventory
      item.actualRequired = Math.max(0, item.recipeRequired - currentInventory)
      item.deficit = item.actualRequired

      // If this item is satisfied by inventory, reduce children requirements
      if (item.actualRequired === 0 && dependencies.has(item.itemId)) {
        const children = dependencies.get(item.itemId)!
        for (const childId of children) {
          const childItem = breakdown.get(childId)
          if (childItem) {
            // Calculate how much of this child was needed for the parent
            const recipe = this.getRecipe(item.itemId)
            if (recipe) {
              const input = recipe.inputs.find(inp => inp.itemId === childId)
              if (input) {
                const batchesNeeded = Math.ceil(item.recipeRequired / recipe.outputQuantity)
                const childQuantityForParent = input.quantity * batchesNeeded
                
                // Reduce child's requirements by the amount no longer needed
                childItem.recipeRequired = Math.max(0, childItem.recipeRequired - childQuantityForParent)
                childItem.actualRequired = Math.max(0, childItem.recipeRequired - childItem.currentInventory)
                childItem.deficit = childItem.actualRequired
              }
            }
          }
        }
      }
    }
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

  /**
   * Calculate the maximum depth of a recipe tree for performance monitoring
   */
  private calculateMaxDepth(itemId: string, stack: Set<string> = new Set(), currentDepth: number = 0): number {
    if (stack.has(itemId)) {
      return currentDepth // Cycle detected, return current depth
    }

    const recipe = this.getRecipe(itemId)
    if (!recipe) {
      return currentDepth // Raw material, no deeper
    }

    stack.add(itemId)
    let maxDepth = currentDepth

    recipe.inputs.forEach((input) => {
      const inputDepth = this.calculateMaxDepth(input.itemId, stack, currentDepth + 1)
      maxDepth = Math.max(maxDepth, inputDepth)
    })

    stack.delete(itemId)
    return maxDepth
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
