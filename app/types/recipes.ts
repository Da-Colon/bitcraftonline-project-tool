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

export interface Project {
  id: string;
  name: string;
  items: ProjectItem[];
  createdAt: Date;
  updatedAt: Date;
}

