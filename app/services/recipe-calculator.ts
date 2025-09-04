import type { Item, Recipe, ProjectItem, ProjectBreakdown } from "../types/recipes";

// Import JSON data directly for Remix compatibility
const recipesData = {
  "items": [
    { "id": "wood", "name": "Wood", "tier": 0, "category": "Raw Material", "stackSize": 100 },
    { "id": "stone", "name": "Stone", "tier": 0, "category": "Raw Material", "stackSize": 100 },
    { "id": "iron_ore", "name": "Iron Ore", "tier": 0, "category": "Raw Material", "stackSize": 100 },
    { "id": "coal", "name": "Coal", "tier": 0, "category": "Raw Material", "stackSize": 100 },
    { "id": "copper_ore", "name": "Copper Ore", "tier": 0, "category": "Raw Material", "stackSize": 100 },
    { "id": "planks", "name": "Planks", "tier": 1, "category": "Building Material", "stackSize": 50 },
    { "id": "iron_ingot", "name": "Iron Ingot", "tier": 1, "category": "Metal", "stackSize": 50 },
    { "id": "copper_ingot", "name": "Copper Ingot", "tier": 1, "category": "Metal", "stackSize": 50 },
    { "id": "nails", "name": "Nails", "tier": 1, "category": "Component", "stackSize": 200 },
    { "id": "hammer", "name": "Hammer", "tier": 1, "category": "Tool", "stackSize": 1 },
    { "id": "pickaxe", "name": "Pickaxe", "tier": 1, "category": "Tool", "stackSize": 1 },
    { "id": "furnace", "name": "Furnace", "tier": 2, "category": "Building", "stackSize": 1 },
    { "id": "anvil", "name": "Anvil", "tier": 2, "category": "Building", "stackSize": 1 },
    { "id": "workbench", "name": "Workbench", "tier": 1, "category": "Building", "stackSize": 1 },
    { "id": "chest", "name": "Chest", "tier": 1, "category": "Storage", "stackSize": 1 },
    { "id": "steel_ingot", "name": "Steel Ingot", "tier": 2, "category": "Metal", "stackSize": 50 },
    { "id": "steel_hammer", "name": "Steel Hammer", "tier": 2, "category": "Tool", "stackSize": 1 },
    { "id": "steel_pickaxe", "name": "Steel Pickaxe", "tier": 2, "category": "Tool", "stackSize": 1 },
    { "id": "advanced_workbench", "name": "Advanced Workbench", "tier": 2, "category": "Building", "stackSize": 1 },
    { "id": "gear", "name": "Gear", "tier": 2, "category": "Component", "stackSize": 20 }
  ],
  "recipes": [
    { "id": "recipe_planks", "outputItemId": "planks", "inputs": [{ "itemId": "wood", "quantity": 2 }], "outputQuantity": 4 },
    { "id": "recipe_iron_ingot", "outputItemId": "iron_ingot", "inputs": [{ "itemId": "iron_ore", "quantity": 1 }, { "itemId": "coal", "quantity": 1 }], "outputQuantity": 1 },
    { "id": "recipe_copper_ingot", "outputItemId": "copper_ingot", "inputs": [{ "itemId": "copper_ore", "quantity": 1 }, { "itemId": "coal", "quantity": 1 }], "outputQuantity": 1 },
    { "id": "recipe_nails", "outputItemId": "nails", "inputs": [{ "itemId": "iron_ingot", "quantity": 1 }], "outputQuantity": 10 },
    { "id": "recipe_hammer", "outputItemId": "hammer", "inputs": [{ "itemId": "iron_ingot", "quantity": 2 }, { "itemId": "planks", "quantity": 1 }], "outputQuantity": 1 },
    { "id": "recipe_pickaxe", "outputItemId": "pickaxe", "inputs": [{ "itemId": "iron_ingot", "quantity": 3 }, { "itemId": "planks", "quantity": 2 }], "outputQuantity": 1 },
    { "id": "recipe_furnace", "outputItemId": "furnace", "inputs": [{ "itemId": "stone", "quantity": 8 }, { "itemId": "iron_ingot", "quantity": 2 }], "outputQuantity": 1 },
    { "id": "recipe_anvil", "outputItemId": "anvil", "inputs": [{ "itemId": "iron_ingot", "quantity": 5 }, { "itemId": "stone", "quantity": 3 }], "outputQuantity": 1 },
    { "id": "recipe_workbench", "outputItemId": "workbench", "inputs": [{ "itemId": "planks", "quantity": 4 }, { "itemId": "nails", "quantity": 8 }], "outputQuantity": 1 },
    { "id": "recipe_chest", "outputItemId": "chest", "inputs": [{ "itemId": "planks", "quantity": 6 }, { "itemId": "nails", "quantity": 4 }], "outputQuantity": 1 },
    { "id": "recipe_steel_ingot", "outputItemId": "steel_ingot", "inputs": [{ "itemId": "iron_ingot", "quantity": 2 }, { "itemId": "coal", "quantity": 2 }], "outputQuantity": 1 },
    { "id": "recipe_steel_hammer", "outputItemId": "steel_hammer", "inputs": [{ "itemId": "steel_ingot", "quantity": 2 }, { "itemId": "planks", "quantity": 1 }], "outputQuantity": 1 },
    { "id": "recipe_steel_pickaxe", "outputItemId": "steel_pickaxe", "inputs": [{ "itemId": "steel_ingot", "quantity": 3 }, { "itemId": "planks", "quantity": 2 }], "outputQuantity": 1 },
    { "id": "recipe_advanced_workbench", "outputItemId": "advanced_workbench", "inputs": [{ "itemId": "workbench", "quantity": 1 }, { "itemId": "steel_ingot", "quantity": 4 }, { "itemId": "gear", "quantity": 2 }], "outputQuantity": 1 },
    { "id": "recipe_gear", "outputItemId": "gear", "inputs": [{ "itemId": "iron_ingot", "quantity": 4 }, { "itemId": "copper_ingot", "quantity": 2 }], "outputQuantity": 1 }
  ]
};

export class RecipeCalculator {
  private items: Map<string, Item>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.items = new Map();
    this.recipes = new Map();
    this.loadData();
  }

  private loadData() {
    // Load items
    for (const item of recipesData.items) {
      this.items.set(item.id, item as Item);
    }

    // Load recipes
    for (const recipe of recipesData.recipes) {
      this.recipes.set(recipe.outputItemId, recipe as Recipe);
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
