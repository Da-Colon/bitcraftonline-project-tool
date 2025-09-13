export interface Item {
  id: string;
  name: string;
  category: string;
  tier: number;
  stackSize: number;
}

export interface RecipeInput {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  outputItemId: string;
  outputQuantity: number;
  inputs: RecipeInput[];
}

export interface ProjectItem {
  itemId: string;
  quantity: number;
  recipe?: Recipe;
}

export interface ProjectBreakdown {
  rawMaterials: Map<string, number>;
  intermediates: Map<string, number>;
  totalItems: Map<string, number>;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface RecipeBreakdownItem {
  itemId: string;
  name: string;
  tier: number;
  category: string;
  recipeRequired: number;  // Total needed by recipe
  actualRequired: number;  // Needed after inventory adjustments
  currentInventory: number; // Available in inventory
  deficit: number;         // Still needed after inventory
}

export interface TierCalculationResult {
  breakdown: RecipeBreakdownItem[];
  totalDeficit: Map<string, number>;
}

export interface Project {
  id: string;
  name: string;
  items: ProjectItem[];
  createdAt: Date;
  updatedAt: Date;
}

