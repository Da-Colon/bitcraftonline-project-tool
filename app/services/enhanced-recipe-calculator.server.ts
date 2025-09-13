import type { Item, Recipe, RecipeBreakdownItem, TierCalculationResult, InventoryItem } from "~/types/recipes";
import { RecipeCalculator } from "./recipe-calculator.server";

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
    // First, get the basic recipe breakdown without inventory
    const baseBreakdown = this.calculateItemBreakdown(targetItemId, targetQuantity);
    
    // Convert inventory to a map for efficient lookups
    const inventoryMap = new Map<string, number>();
    inventory.forEach(item => {
      inventoryMap.set(item.itemId, item.quantity);
    });

    // Apply tier-based inventory adjustments
    const adjustedBreakdown = this.applyTierBasedInventoryAdjustments(baseBreakdown, inventoryMap);
    
    // Calculate final deficits
    const totalDeficit = new Map<string, number>();
    adjustedBreakdown.forEach(item => {
      if (item.deficit > 0) {
        totalDeficit.set(item.itemId, item.deficit);
      }
    });

    return {
      breakdown: adjustedBreakdown,
      totalDeficit
    };
  }

  /**
   * Get detailed breakdown for a single item including all nested requirements
   */
  private calculateItemBreakdown(itemId: string, quantity: number): RecipeBreakdownItem[] {
    const breakdown = new Map<string, RecipeBreakdownItem>();
    
    // Recursively calculate all requirements
    this.calculateItemRequirementsDetailed(itemId, quantity, breakdown);
    
    // Convert to array and sort by tier (highest first for processing)
    return Array.from(breakdown.values()).sort((a, b) => b.tier - a.tier);
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
      console.warn(`Cycle detected for item: ${itemId}`);
      return;
    }

    const item = this.getItem(itemId);
    if (!item) return;

    stack.add(itemId);

    // Update or create breakdown item
    const existing = breakdown.get(itemId);
    if (existing) {
      existing.recipeRequired += quantity;
    } else {
      breakdown.set(itemId, {
        itemId,
        name: item.name,
        tier: item.tier,
        category: item.category,
        recipeRequired: quantity,
        actualRequired: quantity,
        currentInventory: 0,
        deficit: quantity
      });
    }

    // If this item has a recipe, calculate requirements for inputs
    const recipe = this.getRecipe(itemId);
    if (recipe) {
      const craftingBatches = Math.ceil(quantity / recipe.outputQuantity);
      
      recipe.inputs.forEach(input => {
        const requiredQuantity = input.quantity * craftingBatches;
        this.calculateItemRequirementsDetailed(
          input.itemId,
          requiredQuantity,
          breakdown,
          stack
        );
      });
    }

    stack.delete(itemId);
  }

  /**
   * Apply tier-based inventory adjustments from highest to lowest tier
   * This is where the magic happens - higher tier items reduce lower tier requirements
   */
  private applyTierBasedInventoryAdjustments(
    breakdown: RecipeBreakdownItem[],
    inventoryMap: Map<string, number>
  ): RecipeBreakdownItem[] {
    // Create a working copy
    const adjustedBreakdown = breakdown.map(item => ({ ...item }));
    
    // Set current inventory for all items
    adjustedBreakdown.forEach(item => {
      item.currentInventory = inventoryMap.get(item.itemId) || 0;
    });

    // Process from highest tier to lowest tier
    // This ensures higher tier items reduce lower tier requirements first
    const sortedByTier = adjustedBreakdown.sort((a, b) => b.tier - a.tier);
    
    for (const item of sortedByTier) {
      // Apply inventory to this item
      const availableInventory = Math.min(item.currentInventory, item.actualRequired);
      item.actualRequired = Math.max(0, item.actualRequired - availableInventory);
      item.deficit = item.actualRequired;

      // If we have inventory that satisfies this item's requirement,
      // we need to reduce the requirements for its recipe inputs
      if (availableInventory > 0) {
        this.reduceInputRequirements(item.itemId, availableInventory, adjustedBreakdown);
      }
    }

    return adjustedBreakdown;
  }

  /**
   * Reduce input requirements when we have inventory of a higher-tier item
   */
  private reduceInputRequirements(
    itemId: string,
    satisfiedQuantity: number,
    breakdown: RecipeBreakdownItem[]
  ): void {
    const recipe = this.getRecipe(itemId);
    if (!recipe) return;

    // Calculate how many crafting batches we can skip
    const skippedBatches = Math.floor(satisfiedQuantity / recipe.outputQuantity);
    if (skippedBatches <= 0) return;

    // Reduce requirements for each input
    recipe.inputs.forEach(input => {
      const reductionAmount = input.quantity * skippedBatches;
      const inputItem = breakdown.find(b => b.itemId === input.itemId);
      
      if (inputItem) {
        inputItem.actualRequired = Math.max(0, inputItem.actualRequired - reductionAmount);
        inputItem.deficit = Math.max(0, inputItem.actualRequired - inputItem.currentInventory);
        
        // Recursively reduce requirements for this input's inputs
        this.reduceInputRequirements(input.itemId, reductionAmount, breakdown);
      }
    });
  }

  /**
   * Get recipe tree for visualization
   */
  getRecipeTree(itemId: string, quantity: number): RecipeTreeNode | null {
    const item = this.getItem(itemId);
    const recipe = this.getRecipe(itemId);
    
    if (!item) return null;

    const node: RecipeTreeNode = {
      itemId,
      name: item.name,
      tier: item.tier,
      category: item.category,
      quantity,
      children: []
    };

    if (recipe) {
      const craftingBatches = Math.ceil(quantity / recipe.outputQuantity);
      
      recipe.inputs.forEach(input => {
        const requiredQuantity = input.quantity * craftingBatches;
        const childNode = this.getRecipeTree(input.itemId, requiredQuantity);
        if (childNode) {
          node.children.push(childNode);
        }
      });
    }

    return node;
  }
}

export interface RecipeTreeNode {
  itemId: string;
  name: string;
  tier: number;
  category: string;
  quantity: number;
  children: RecipeTreeNode[];
}

// Singleton instance
let enhancedCalculatorInstance: EnhancedRecipeCalculator | null = null;

export function getEnhancedRecipeCalculator(): EnhancedRecipeCalculator {
  if (!enhancedCalculatorInstance) {
    enhancedCalculatorInstance = new EnhancedRecipeCalculator();
  }
  return enhancedCalculatorInstance;
}
