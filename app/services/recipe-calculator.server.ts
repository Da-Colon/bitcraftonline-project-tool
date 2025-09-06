import type { Item, Recipe, ProjectItem, ProjectBreakdown } from "~/types/recipes";
import { parseItem, parseRecipe, parseExtractionRecipe } from "~/services/bitcraft-parser";
import type { BitCraftItem, BitCraftRecipe, BitCraftExtractionRecipe } from "~/types/bitcraft-data";

// Import BitCraft JSON data directly from GameData submodule
import itemsJson from "../../GameData/BitCraft_GameData/server/region/item_desc.json" assert { type: "json" };
import recipesJson from "../../GameData/BitCraft_GameData/server/region/crafting_recipe_desc.json" assert { type: "json" };
import extractionRecipesJson from "../../GameData/BitCraft_GameData/server/region/extraction_recipe_desc.json" assert { type: "json" };

export class RecipeCalculator {
  private items: Map<string, Item>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.items = new Map();
    this.recipes = new Map();
    this.loadData();
  }

  private loadData() {
    // Parse BitCraft items directly from GameData
    const parsedItems = (itemsJson as unknown as BitCraftItem[]).map(parseItem);
    
    // Parse BitCraft recipes directly from GameData
    const parsedCraftingRecipes = (recipesJson as unknown as BitCraftRecipe[])
      .map((recipe) => parseRecipe(recipe))
      .filter((recipe): recipe is Recipe => recipe !== null);
    const parsedExtractionRecipes = (extractionRecipesJson as unknown as BitCraftExtractionRecipe[])
      .map((recipe) => parseExtractionRecipe(recipe))
      .filter((recipe): recipe is Recipe => recipe !== null);
    
    const allRecipes = [...parsedCraftingRecipes, ...parsedExtractionRecipes];
    
    // Load items
    for (const item of parsedItems) {
      this.items.set(item.id, item);
    }

    // Load recipes
    for (const recipe of allRecipes) {
      this.recipes.set(recipe.outputItemId, recipe);
    }
  }

  getItem(itemId: string): Item | undefined {
    return this.items.get(itemId);
  }

  getRecipe(itemId: string): Recipe | undefined {
    return this.recipes.get(itemId);
  }

  getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  searchItems(query: string): Item[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllItems().filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  calculateRequirements(projectItems: ProjectItem[]): ProjectBreakdown {
    const rawMaterials = new Map<string, number>();
    const intermediates = new Map<string, number>();
    const totalItems = new Map<string, number>();

    // Calculate requirements for each project item
    projectItems.forEach(projectItem => {
      this.calculateItemRequirements(
        projectItem.itemId,
        projectItem.quantity,
        rawMaterials,
        intermediates,
        totalItems
      );
    });

    return {
      rawMaterials,
      intermediates,
      totalItems
    };
  }

  private calculateItemRequirements(
    itemId: string,
    quantity: number,
    rawMaterials: Map<string, number>,
    intermediates: Map<string, number>,
    totalItems: Map<string, number>,
    stack: Set<string> = new Set()
  ): void {
    if (stack.has(itemId)) {
      // Cycle detected - treat as raw material to break the cycle
      const item = this.getItem(itemId);
      const itemName = item?.name || itemId;
      console.warn(`Cycle detected in recipes for item: ${itemId} (${itemName}) - treating as raw material`);
      
      // Add to raw materials to break the cycle
      const currentRaw = rawMaterials.get(itemId) || 0;
      rawMaterials.set(itemId, currentRaw + quantity);
      return;
    }
    stack.add(itemId);
    const item = this.getItem(itemId);
    if (!item) return;

    // Add to total items
    const currentTotal = totalItems.get(itemId) || 0;
    totalItems.set(itemId, currentTotal + quantity);

    const recipe = this.getRecipe(itemId);
    
    if (!recipe) {
      // This is a raw material (no recipe)
      const currentRaw = rawMaterials.get(itemId) || 0;
      rawMaterials.set(itemId, currentRaw + quantity);
      return;
    }

    // This item has a recipe, so it's an intermediate
    const currentIntermediate = intermediates.get(itemId) || 0;
    intermediates.set(itemId, currentIntermediate + quantity);

    // Calculate how many times we need to craft this recipe
    const craftingBatches = Math.ceil(quantity / recipe.outputQuantity);

    // Recursively calculate requirements for each input
    recipe.inputs.forEach(input => {
      const requiredQuantity = input.quantity * craftingBatches;
      this.calculateItemRequirements(
        input.itemId,
        requiredQuantity,
        rawMaterials,
        intermediates,
        totalItems,
        stack
      );
    });
    stack.delete(itemId);
  }

  getItemsByCategory(): Map<string, Item[]> {
    const categories = new Map<string, Item[]>();
    
    this.getAllItems().forEach(item => {
      if (!categories.has(item.category)) {
        categories.set(item.category, []);
      }
      categories.get(item.category)!.push(item);
    });

    return categories;
  }

  getCraftingSteps(projectItems: ProjectItem[]): Array<{itemId: string, quantity: number, tier: number}> {
    const breakdown = this.calculateRequirements(projectItems);
    const steps: Array<{itemId: string, quantity: number, tier: number}> = [];

    // Add all items that need to be crafted, sorted by tier
    breakdown.intermediates.forEach((quantity, itemId) => {
      const item = this.getItem(itemId);
      if (item) {
        steps.push({
          itemId,
          quantity,
          tier: item.tier
        });
      }
    });

    // Sort by tier (craft lower tier items first)
    steps.sort((a, b) => a.tier - b.tier);

    return steps;
  }
}

