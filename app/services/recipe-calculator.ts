import type { Item, Recipe, ProjectItem, ProjectBreakdown } from "../types/recipes";
import { loadAndParseBitCraftData } from "./bitcraft-data-loader";

// Cache for BitCraft data to avoid reloading on every instance
let bitCraftDataCache: { items: Item[]; recipes: Recipe[] } | null = null;

function loadBitCraftData(): { items: Item[]; recipes: Recipe[] } {
  if (!bitCraftDataCache) {
    try {
      bitCraftDataCache = loadAndParseBitCraftData();
      console.log(`Loaded ${bitCraftDataCache.items.length} items and ${bitCraftDataCache.recipes.length} recipes from BitCraft data`);
    } catch (error) {
      console.error('Failed to load BitCraft data, falling back to empty data:', error);
      bitCraftDataCache = { items: [], recipes: [] };
    }
  }
  return bitCraftDataCache;
}

export class RecipeCalculator {
  private items: Map<string, Item>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.items = new Map();
    this.recipes = new Map();
    this.loadData();
  }

  private loadData() {
    const { items, recipes } = loadBitCraftData();
    
    // Load items
    for (const item of items) {
      this.items.set(item.id, item);
    }

    // Load recipes
    for (const recipe of recipes) {
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
    totalItems: Map<string, number>
  ): void {
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
        totalItems
      );
    });
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
