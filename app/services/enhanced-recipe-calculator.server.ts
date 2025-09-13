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
    // Create inventory map for quick lookup
    const inventoryMap = new Map<string, number>();
    inventory.forEach(item => {
      inventoryMap.set(item.itemId, item.quantity);
    });

    // Get base recipe breakdown
    const baseBreakdown = this.calculateItemBreakdown(targetItemId, targetQuantity);
    
    // Apply inventory directly to breakdown items
    const adjustedBreakdown = baseBreakdown.map(item => ({
      ...item,
      currentInventory: inventoryMap.get(item.itemId) || 0,
      actualRequired: Math.max(0, item.recipeRequired - (inventoryMap.get(item.itemId) || 0)),
      deficit: Math.max(0, item.recipeRequired - (inventoryMap.get(item.itemId) || 0))
    }));
    
    // Calculate total deficit
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
    
    this.calculateItemRequirementsDetailed(itemId, quantity, breakdown, new Set());
    
    // Initialize currentInventory to 0 for all items
    const result = Array.from(breakdown.values()).map(item => ({
      ...item,
      currentInventory: 0
    }));
    
    return result;
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
   * Apply tier-based inventory adjustments to the breakdown
   */
  private applyTierBasedInventoryAdjustments(
    breakdown: RecipeBreakdownItem[],
    inventoryMap: Map<string, number>
  ): RecipeBreakdownItem[] {
    console.log("applyTierBasedInventoryAdjustments - input breakdown:", breakdown);
    console.log("applyTierBasedInventoryAdjustments - inventoryMap:", Array.from(inventoryMap.entries()));
    
    // Create a working copy of the breakdown
    const adjustedBreakdown = breakdown.map(item => ({ ...item }));

    // Set current inventory for each item
    adjustedBreakdown.forEach(item => {
      item.currentInventory = inventoryMap.get(item.itemId) || 0;
    });

    console.log("After setting currentInventory:", adjustedBreakdown.map(item => ({
      itemId: item.itemId,
      name: item.name,
      currentInventory: item.currentInventory,
      recipeRequired: item.recipeRequired,
      actualRequired: item.actualRequired
    })));

    // Process from highest tier to lowest tier
    // This ensures higher tier items reduce lower tier requirements first
    const sortedByTier = adjustedBreakdown.sort((a, b) => b.tier - a.tier);
    
    for (const item of sortedByTier) {
      // Apply inventory to this item
      const availableInventory = Math.min(item.currentInventory, item.actualRequired);
      item.actualRequired = Math.max(0, item.actualRequired - availableInventory);
      item.deficit = item.actualRequired;

      console.log(`Processing ${item.itemId}: availableInventory=${availableInventory}, actualRequired=${item.actualRequired}, deficit=${item.deficit}`);

      // If we have inventory that satisfies this item's requirement,
      // we need to reduce the requirements for its recipe inputs
      if (availableInventory > 0) {
        this.reduceInputRequirements(item.itemId, availableInventory, adjustedBreakdown);
      }
    }

    console.log("Final adjustedBreakdown:", adjustedBreakdown.map(item => ({
      itemId: item.itemId,
      name: item.name,
      currentInventory: item.currentInventory,
      actualRequired: item.actualRequired,
      deficit: item.deficit
    })));

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
