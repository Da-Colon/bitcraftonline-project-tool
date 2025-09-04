// BitCraft Data Parser (JavaScript version for testing)

// Convert BitCraft numeric ID to our string ID format
function convertId(id) {
  return `item_${id}`;
}

// Map BitCraft tags to our category system
function mapCategory(tag) {
  const categoryMap = {
    'Ore': 'Raw Materials',
    'Crushed Ore': 'Raw Materials',
    'Ancient Ingredients': 'Special Materials',
    'Recipe': 'Recipes',
    'Coins': 'Currency',
    'Deed': 'Documents',
    // Add more mappings as needed
  };
  
  return categoryMap[tag] || tag || 'Unknown';
}

// Parse a BitCraft item to our format
function parseItem(bitCraftItem) {
  return {
    id: convertId(bitCraftItem.id),
    name: bitCraftItem.name,
    category: mapCategory(bitCraftItem.tag),
    tier: bitCraftItem.tier,
    stackSize: 100, // Default stack size since BitCraft data doesn't include this
  };
}

// Parse BitCraft recipe inputs to our format
function parseRecipeInputs(consumedItemStacks) {
  const inputs = [];
  
  // Each consumed item stack has format: [itemId, quantity, ...]
  for (const stack of consumedItemStacks) {
    if (Array.isArray(stack) && stack.length >= 2) {
      const itemId = stack[0];
      const quantity = stack[1];
      
      if (typeof itemId === 'number' && typeof quantity === 'number') {
        inputs.push({
          itemId: convertId(itemId),
          quantity: quantity,
        });
      }
    }
  }
  
  return inputs;
}

// Parse BitCraft recipe outputs to get primary output
function parseRecipeOutput(craftedItemStacks) {
  // Get the first crafted item as the primary output
  if (craftedItemStacks.length > 0) {
    const stack = craftedItemStacks[0];
    if (Array.isArray(stack) && stack.length >= 2) {
      const itemId = stack[0];
      const quantity = stack[1];
      
      if (typeof itemId === 'number' && typeof quantity === 'number') {
        return {
          itemId: convertId(itemId),
          quantity: quantity,
        };
      }
    }
  }
  
  return null;
}

// Parse a BitCraft recipe to our format
function parseRecipe(bitCraftRecipe) {
  const inputs = parseRecipeInputs(bitCraftRecipe.consumed_item_stacks);
  const output = parseRecipeOutput(bitCraftRecipe.crafted_item_stacks);
  
  // Only create recipe if we have valid output
  if (output) {
    return {
      id: convertId(bitCraftRecipe.id),
      outputItemId: output.itemId,
      outputQuantity: output.quantity,
      inputs: inputs,
    };
  }
  
  return null;
}

// Parse extraction recipe to get raw materials
function parseExtractionRecipe(extractionRecipe) {
  const inputs = parseRecipeInputs(extractionRecipe.consumed_item_stacks);
  
  // Extract output items from extracted_item_stacks
  // Format: [[0, [itemId, quantity, ...]], probability]
  if (extractionRecipe.extracted_item_stacks.length > 0) {
    const stack = extractionRecipe.extracted_item_stacks[0];
    if (Array.isArray(stack) && stack.length >= 1) {
      const itemInfo = stack[0];
      if (Array.isArray(itemInfo) && itemInfo.length >= 2) {
        const itemDetails = itemInfo[1];
        if (Array.isArray(itemDetails) && itemDetails.length >= 2) {
          const itemId = itemDetails[0];
          const quantity = itemDetails[1];
          
          if (typeof itemId === 'number' && typeof quantity === 'number') {
            return {
              id: convertId(extractionRecipe.id),
              outputItemId: convertId(itemId),
              outputQuantity: quantity,
              inputs: inputs,
            };
          }
        }
      }
    }
  }
  
  return null;
}

// Batch parse items
function parseItems(bitCraftItems) {
  return bitCraftItems.map(parseItem);
}

// Batch parse recipes
function parseRecipes(bitCraftRecipes) {
  return bitCraftRecipes.map(parseRecipe).filter(recipe => recipe !== null);
}

// Export functions
export { convertId, mapCategory, parseItem, parseRecipeInputs, parseRecipeOutput, parseRecipe, parseExtractionRecipe, parseItems, parseRecipes };
