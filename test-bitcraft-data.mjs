// Test BitCraft Data Integration

// Import our parsing functions
import { loadAndParseBitCraftData } from './bitcraft-data-loader.js';

console.log('Testing BitCraft Data Integration...');

// Load and parse the data
const { items, recipes } = loadAndParseBitCraftData();

// Display some sample data
console.log('\n--- Sample Items ---');
if (items.length > 0) {
  console.log('First 3 items:');
  items.slice(0, 3).forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} (ID: ${item.id}, Category: ${item.category}, Tier: ${item.tier})`);
  });
}

console.log('\n--- Sample Recipes ---');
if (recipes.length > 0) {
  console.log('First 3 recipes:');
  recipes.slice(0, 3).forEach((recipe, index) => {
    console.log(`${index + 1}. Recipe ID: ${recipe.id}`);
    console.log(`   Output: ${recipe.outputQuantity}x ${recipe.outputItemId}`);
    console.log(`   Inputs: ${recipe.inputs.length} items`);
    recipe.inputs.slice(0, 2).forEach(input => {
      console.log(`     - ${input.quantity}x ${input.itemId}`);
    });
    if (recipe.inputs.length > 2) {
      console.log(`     ... and ${recipe.inputs.length - 2} more inputs`);
    }
  });
}

console.log('\n--- Data Summary ---');
console.log(`Total Items: ${items.length}`);
console.log(`Total Recipes: ${recipes.length}`);

console.log('\nTest completed successfully!');
