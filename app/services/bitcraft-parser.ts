// BitCraft Data Parser
import type {
  BitCraftItem,
  BitCraftRecipe,
  ParsedItem,
  ParsedRecipe,
  ParsedRecipeInput,
} from "../types/bitcraft-data"

// Convert BitCraft numeric ID to our string ID format
function convertId(id: number): string {
  return `item_${id}`
}

// Map BitCraft tags to our category system
function mapCategory(tag: string): string {
  const categoryMap: Record<string, string> = {
    Ore: "Raw Materials",
    "Crushed Ore": "Raw Materials",
    "Ancient Ingredients": "Special Materials",
    Recipe: "Recipes",
    Coins: "Currency",
    Deed: "Documents",
    // Add more mappings as needed
  }

  return categoryMap[tag] || tag || "Unknown"
}

// Parse a BitCraft item to our format
export function parseItem(bitCraftItem: BitCraftItem): ParsedItem {
  return {
    id: convertId(bitCraftItem.id),
    name: bitCraftItem.name,
    category: mapCategory(bitCraftItem.tag),
    tier: bitCraftItem.tier,
    stackSize: 100, // Default stack size since BitCraft data doesn't include this
    iconAssetName: bitCraftItem.icon_asset_name,
  }
}

// Parse BitCraft recipe inputs to our format
function parseRecipeInputs(consumedItemStacks: unknown[]): ParsedRecipeInput[] {
  const inputs: ParsedRecipeInput[] = []

  // Each consumed item stack has format: [itemId, quantity, ...]
  for (const stack of consumedItemStacks) {
    if (Array.isArray(stack) && stack.length >= 2) {
      const itemId = stack[0]
      const quantity = stack[1]

      if (typeof itemId === "number" && typeof quantity === "number") {
        inputs.push({
          itemId: convertId(itemId),
          quantity: quantity,
        })
      }
    }
  }

  return inputs
}

// Parse BitCraft recipe outputs to get primary output
function parseRecipeOutput(craftedItemStacks: unknown[]): { itemId: string; quantity: number } | null {
  // Get the first crafted item as the primary output
  if (craftedItemStacks.length > 0) {
    const stack = craftedItemStacks[0]
    if (Array.isArray(stack) && stack.length >= 2) {
      const itemId = stack[0]
      const quantity = stack[1]

      if (typeof itemId === "number" && typeof quantity === "number") {
        return {
          itemId: convertId(itemId),
          quantity: quantity,
        }
      }
    }
  }

  return null
}

// Parse a BitCraft recipe to our format
export function parseRecipe(bitCraftRecipe: BitCraftRecipe): ParsedRecipe | null {
  const inputs = parseRecipeInputs(bitCraftRecipe.consumed_item_stacks)
  const output = parseRecipeOutput(bitCraftRecipe.crafted_item_stacks)

  // Only create recipe if we have valid output
  if (output) {
    return {
      id: convertId(bitCraftRecipe.id),
      outputItemId: output.itemId,
      outputQuantity: output.quantity,
      inputs: inputs,
      actionsRequired: bitCraftRecipe.actions_required ?? undefined,
    }
  }

  return null
}

// Parse extraction recipe to get raw materials
export function parseExtractionRecipe(extractionRecipe: unknown): ParsedRecipe | null {
  if (!extractionRecipe || typeof extractionRecipe !== 'object') {
    return null
  }
  
  const recipe = extractionRecipe as { consumed_item_stacks?: unknown[]; extracted_item_stacks?: unknown[] }
  
  if (!recipe.consumed_item_stacks || !recipe.extracted_item_stacks) {
    return null
  }
  
  const inputs = parseRecipeInputs(recipe.consumed_item_stacks)

  // Extract output items from extracted_item_stacks
  // Format: [[0, [itemId, quantity, ...]], probability]
  if (recipe.extracted_item_stacks.length > 0) {
    const stack = recipe.extracted_item_stacks[0]
    if (Array.isArray(stack) && stack.length >= 1) {
      const itemInfo = stack[0]
      if (Array.isArray(itemInfo) && itemInfo.length >= 2) {
        const itemDetails = itemInfo[1]
        if (Array.isArray(itemDetails) && itemDetails.length >= 2) {
          const itemId = itemDetails[0]
          const quantity = itemDetails[1]

          if (typeof itemId === "number" && typeof quantity === "number") {
            return {
              id: convertId((recipe as { id: number }).id),
              outputItemId: convertId(itemId),
              outputQuantity: quantity,
              inputs: inputs,
            }
          }
        }
      }
    }
  }

  return null
}

// Batch parse items
export function parseItems(bitCraftItems: BitCraftItem[]): ParsedItem[] {
  return bitCraftItems.map(parseItem)
}

// Batch parse recipes
export function parseRecipes(bitCraftRecipes: BitCraftRecipe[]): ParsedRecipe[] {
  return bitCraftRecipes
    .map(parseRecipe)
    .filter((recipe): recipe is ParsedRecipe => recipe !== null)
}

// Example usage:
// const parsedItems = parseItems(bitCraftItems);
// const parsedRecipes = parseRecipes(bitCraftRecipes);
