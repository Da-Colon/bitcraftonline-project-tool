import { enhanceItemWithIcon } from "~/services/gamedata-icon-lookup.server";
import type { RecipeBreakdownItem, TierCalculationResult, InventoryItem } from "~/types/recipes";

import { RecipeCalculator } from "./recipe-calculator.server";

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

    // Create inventory map - handle both formats
    const inventoryMap = new Map<string, number>()
    inventory.forEach((item) => {
      // Try both the raw itemId and the "item_" prefixed version
      inventoryMap.set(item.itemId, item.quantity)
      if (!item.itemId.startsWith("item_")) {
        inventoryMap.set(`item_${item.itemId}`, item.quantity)
      }
    })




    // Pass 1: Build complete recipe tree with full requirements
    const breakdown = new Map<string, RecipeBreakdownItem>()
    const dependencies = new Map<string, Set<string>>() // parent -> children
    this.buildCompleteRecipeTree(targetItemId, targetQuantity, breakdown, dependencies, new Set())

    // Pass 2: Apply inventory reductions with dependency awareness
    this.applyInventoryReductions(targetItemId, breakdown, dependencies, inventoryMap)
    


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
        const itemDependencies = dependencies.get(itemId)
        if (itemDependencies) {
          itemDependencies.add(input.itemId)
        }
        this.buildCompleteRecipeTree(input.itemId, requiredQuantity, breakdown, dependencies, stack)
      })
    }

    stack.delete(itemId)
  }

  /**
   * Apply inventory reductions with dependency awareness (Pass 2)
   *
   * Algorithm:
   * 1. Process items in parent-first order (root → children)
   * 2. For each item, check inventory and calculate how many batches can be skipped
   * 3. When an item is fully satisfied by inventory, immediately reduce its children to zero
   * 4. When an item is partially satisfied, reduce children proportionally
   *
   * Key Benefits:
   * - Fixes the bug where children weren't zeroed when parent was fully satisfied
   * - Preserves recipeRequired immutability - only modifies actualRequired and deficit
   * - Parent-first processing ensures reductions cascade correctly down the dependency tree
   * - Handles complex scenarios like multiple parents sharing children correctly
   *
   * Edge Cases Handled:
   * - Fully satisfied parents: children are immediately zeroed
   * - Partially satisfied parents: children are reduced proportionally
   * - Multiple parents sharing children: each parent's reduction is applied independently
   * - Items with no recipes: treated as raw materials, no further processing needed
   */
  private applyInventoryReductions(
    rootItemId: string,
    breakdown: Map<string, RecipeBreakdownItem>,
    dependencies: Map<string, Set<string>>,
    inventoryMap: Map<string, number>
  ): void {
    // Track parent reductions separately to avoid modifying recipeRequired
    const parentReductions = new Map<string, number>()

    // Process items in parent-first order (our fix)
    const visited = new Set<string>()
    const orderedIds: string[] = []

    const visit = (itemId: string) => {
      if (visited.has(itemId)) return
      visited.add(itemId)
      
      // Visit children first, then add this item
      // This ensures parents are processed before their children
      const children = dependencies.get(itemId)
      if (children) {
        for (const childId of children) {
          visit(childId)
        }
      }
      orderedIds.push(itemId)
    }

    visit(rootItemId)
    // Cover any remaining nodes (in case of disconnected graphs due to merged items)
    for (const itemId of breakdown.keys()) {
      if (!visited.has(itemId)) {
        visit(itemId)
      }
    }

    // Process in parent-first order (reverse of the visit order)
    const sortedItems = orderedIds
      .reverse()
      .map((itemId) => breakdown.get(itemId))
      .filter((item): item is RecipeBreakdownItem => Boolean(item))

    for (const item of sortedItems) {
      // Get current inventory for this item
      const currentInventory = this.getInventoryQuantity(item.itemId, inventoryMap)
      
      // Calculate how much of this item we still need
      const inventoryUsed = Math.min(item.recipeRequired, currentInventory)
      const parentReduction = parentReductions.get(item.itemId) || 0
      const remainingRequired = Math.max(0, item.recipeRequired - inventoryUsed - parentReduction)

      // Update item properties
      item.currentInventory = currentInventory
      item.actualRequired = remainingRequired
      item.deficit = remainingRequired

      // If this item has a recipe, adjust its children based on how many batches we can skip
      const recipe = this.getRecipe(item.itemId)
      if (!recipe || recipe.outputQuantity <= 0) {
        continue
      }

      if (!dependencies.has(item.itemId)) {
        continue
      }

      // Calculate how many batches we can skip due to inventory
      const originalBatches = Math.ceil(item.recipeRequired / recipe.outputQuantity)
      const remainingBatches = Math.ceil(remainingRequired / recipe.outputQuantity)
      const batchesSkipped = Math.max(0, originalBatches - remainingBatches)

      // If we can skip batches, reduce children accordingly
      if (batchesSkipped > 0) {
        const children = dependencies.get(item.itemId)
        if (!children) continue
        for (const childId of children) {
          const childItem = breakdown.get(childId)
          if (!childItem) continue

          const input = recipe.inputs.find((inp) => inp.itemId === childId)
          if (!input) continue

          // Track child reduction instead of modifying recipeRequired
          const childReduction = input.quantity * batchesSkipped
          const existingReduction = parentReductions.get(childId) || 0
          parentReductions.set(childId, existingReduction + childReduction)
          
          // Note: We don't recursively zero children - all requirements should be calculated
        }
      }
      
      // Note: We don't zero children when parent is satisfied - all requirements should be calculated
    }

    // Final pass to update actualRequired and deficit based on immutable recipeRequired
    for (const item of breakdown.values()) {
      const currentInventory = this.getInventoryQuantity(item.itemId, inventoryMap)
      item.currentInventory = currentInventory  // ← ADD THIS LINE
      const inventoryUsed = Math.min(item.recipeRequired, currentInventory)
      const parentReduction = parentReductions.get(item.itemId) || 0
      const remainingRequired = Math.max(0, item.recipeRequired - inventoryUsed - parentReduction)
      item.actualRequired = remainingRequired
      item.deficit = remainingRequired
    }
  }

  /**
   * Helper method to get inventory quantity with proper item ID normalization
   */
  private getInventoryQuantity(itemId: string, inventoryMap: Map<string, number>): number {
    // Try the normalized ID first
    const normalizedId = itemId.startsWith('item_') ? itemId : `item_${itemId}`
    let quantity = inventoryMap.get(normalizedId)
    
    if (quantity !== undefined) {
      return quantity
    }
    
    // Fallback: try the original ID as-is
    quantity = inventoryMap.get(itemId)
    if (quantity !== undefined) {
      return quantity
    }
    
    // Fallback: try removing "item_" prefix if present
    if (itemId.startsWith('item_')) {
      const withoutPrefix = itemId.replace(/^item_/, '')
      quantity = inventoryMap.get(withoutPrefix)
      if (quantity !== undefined) {
        return quantity
      }
    }
    
    return 0
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
  private calculateMaxDepth(
    itemId: string,
    stack: Set<string> = new Set(),
    currentDepth: number = 0
  ): number {
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
