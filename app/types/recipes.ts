export interface Item {
  id: string
  name: string
  category: string
  tier: number
  stackSize: number
  iconAssetName?: string
}

export interface RecipeInput {
  itemId: string
  quantity: number
}

export interface Recipe {
  id: string
  outputItemId: string
  outputQuantity: number
  inputs: RecipeInput[]
  actionsRequired?: number // Number of actions required per batch
}

export interface ProjectItem {
  itemId: string
  quantity: number
  recipe?: Recipe
}

export interface ProjectBreakdown {
  rawMaterials: Map<string, number>
  intermediates: Map<string, number>
  totalItems: Map<string, number>
}

export interface InventoryItem {
  itemId: string
  quantity: number
}

export interface RecipeBreakdownItem {
  itemId: string
  name: string
  tier: number
  category: string
  recipeRequired: number // Total needed by recipe
  actualRequired: number // Needed after inventory adjustments
  currentInventory: number // Available in inventory
  iconAssetName?: string
  effortPerBatch?: number // Effort per crafting batch (from recipe.actionsRequired)
  totalEffort?: number // Total effort for this item (effortPerBatch × batches)
  effortAfterInventory?: number // Effort remaining after inventory adjustments
}

export interface TierCalculationResult {
  breakdown: RecipeBreakdownItem[]
}

export interface Project {
  id: string
  name: string
  items: ProjectItem[]
  createdAt: Date
  updatedAt: Date
}
