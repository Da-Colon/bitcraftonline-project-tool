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
    this.applyInventoryReductions(targetItemId, breakdown, dependencies, inventoryMap)

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
          .map((b) => ({
            id: b.itemId,
            have: b.currentInventory,
            need: b.recipeRequired,
            deficit: b.deficit,
          }))
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
        const children = dependencies.get(item.itemId)!
        for (const childId of children) {
          const childItem = breakdown.get(childId)
          if (!childItem) continue

          const input = recipe.inputs.find((inp) => inp.itemId === childId)
          if (!input) continue

          // Track child reduction instead of modifying recipeRequired
          const childReduction = input.quantity * batchesSkipped
          const existingReduction = parentReductions.get(childId) || 0
          parentReductions.set(childId, existingReduction + childReduction)
          
          // If child would be fully satisfied, recursively zero its children
          const childRemaining = Math.max(0, childItem.recipeRequired - (parentReductions.get(childId) || 0))
          if (childRemaining === 0) {
            this.zeroChildrenRecursively(childId, breakdown, dependencies, parentReductions)
          }
        }
      }
      
      // If this item is fully satisfied BY INVENTORY, zero all its children
      if (remainingRequired === 0 && currentInventory > 0 && item.itemId !== rootItemId) {
        this.zeroAllChildrenInBreakdown(item.itemId, breakdown, dependencies, parentReductions)
      }
    }

    // Final pass to update actualRequired and deficit based on immutable recipeRequired
    for (const item of breakdown.values()) {
      const currentInventory = this.getInventoryQuantity(item.itemId, inventoryMap)
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
   * Helper method to recursively zero all children when a parent is fully satisfied
   * Preserves recipeRequired immutability - only modifies actualRequired and deficit
   */
  private zeroChildrenRecursively(
    itemId: string,
    breakdown: Map<string, RecipeBreakdownItem>,
    dependencies: Map<string, Set<string>>,
    parentReductions: Map<string, number>
  ): void {
    const children = dependencies.get(itemId)
    if (!children) return
    
    for (const childId of children) {
      const childItem = breakdown.get(childId)
      if (!childItem) continue
      
      // Set parent reduction to full recipeRequired to effectively zero the child
      parentReductions.set(childId, childItem.recipeRequired)
      
      // Recursively zero its children
      this.zeroChildrenRecursively(childId, breakdown, dependencies, parentReductions)
    }
  }

  /**
   * Comprehensive method to zero ALL items in breakdown when a parent is fully satisfied BY INVENTORY
   * Preserves recipeRequired immutability - only modifies actualRequired and deficit via parentReductions
   */
  private zeroAllChildrenInBreakdown(
    satisfiedItemId: string,
    breakdown: Map<string, RecipeBreakdownItem>,
    dependencies: Map<string, Set<string>>,
    parentReductions: Map<string, number>
  ): void {
    // Zero all items except the satisfied item by setting parent reductions
    for (const [itemId, item] of breakdown.entries()) {
      if (itemId === satisfiedItemId) continue // Don't zero the satisfied item itself
      
      // Set parent reduction to full recipeRequired to effectively zero the item
      parentReductions.set(itemId, item.recipeRequired)
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
