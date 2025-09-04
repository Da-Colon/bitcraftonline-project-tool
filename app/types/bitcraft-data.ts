// BitCraft GameData Types

// Item types from BitCraft_GameData/server/region/item_desc.json
export interface BitCraftItem {
  id: number;           // Numeric ID
  name: string;         // Item name
  description: string;  // Item description
  volume: number;       // Volume/size
  durability: number;   // Durability
  icon_asset_name: string; // Icon path
  tier: number;         // Item tier
  tag: string;          // Category/tag
  rarity: [number, any]; // Rarity information
}

// Recipe types from BitCraft_GameData/server/region/crafting_recipe_desc.json
export interface BitCraftRecipeInput {
  itemId: number;       // ID of the required item
  quantity: number;     // Required quantity
  // Additional fields omitted for simplicity
}

export interface BitCraftRecipeOutput {
  itemId: number;       // ID of the crafted item
  quantity: number;     // Output quantity
  // Additional fields omitted for simplicity
}

export interface BitCraftRecipe {
  id: number;                           // Recipe ID
  name: string;                         // Recipe name
  time_requirement: number;             // Time to complete
  stamina_requirement: number;          // Stamina cost
  building_requirement: any[];          // Building requirements
  level_requirements: number[][];       // Level requirements
  tool_requirements: number[][];        // Tool requirements
  consumed_item_stacks: any[];          // Input items (format: [itemId, quantity, ...])
  crafted_item_stacks: any[];           // Output items (format: [itemId, quantity, ...])
  actions_required: number;             // Number of actions
}

// Extraction recipe types from BitCraft_GameData/server/region/extraction_recipe_desc.json
export interface BitCraftExtractionRecipe {
  id: number;                           // Recipe ID
  resource_id: number;                  // Resource ID
  extracted_item_stacks: any[];         // Items extracted (format: [[0, [itemId, quantity, ...]], probability])
  consumed_item_stacks: any[];          // Items consumed
  tool_requirements: number[][];        // Tool requirements
  level_requirements: number[][];       // Level requirements
}

// Simplified types for our recipe calculator
export interface ParsedItem {
  id: string;           // String ID for our system
  name: string;         // Item name
  category: string;     // Mapped category
  tier: number;         // Item tier
  stackSize: number;    // Stack size (defaulted since not in BitCraft data)
}

export interface ParsedRecipeInput {
  itemId: string;       // String ID
  quantity: number;     // Required quantity
}

export interface ParsedRecipe {
  id: string;           // String ID
  outputItemId: string; // Output item ID
  outputQuantity: number; // Output quantity
  inputs: ParsedRecipeInput[]; // Input items
}
