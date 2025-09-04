// Test RecipeCalculator with BitCraft Data
import { loadAndParseBitCraftData } from './bitcraft-data-loader.js';

// Simple RecipeCalculator implementation for testing
class TestRecipeCalculator {
  constructor() {
    this.items = new Map();
    this.recipes = new Map();
    this.loadData();
  }

  loadData() {
    const { items, recipes } = loadAndParseBitCraftData();
    
    // Load items
    for (const item of items) {
      this.items.set(item.id, item);
    }

    // Load recipes
    for (const recipe of recipes) {
      this.recipes.set(recipe.outputItemId, recipe);
    }
  }

  getAllItems() {
    return Array.from(this.items.values());
  }

  searchItems(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllItems().filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  getItem(itemId) {
    return this.items.get(itemId);
  }

  getRecipe(itemId) {
    return this.recipes.get(itemId);
  }
}

console.log('Testing RecipeCalculator with BitCraft data...');

const calculator = new TestRecipeCalculator();

// Test basic functionality
console.log(`\nTotal items loaded: ${calculator.getAllItems().length}`);

// Test search functionality
const searchTests = ['ferralith', 'wood', 'ore'];
searchTests.forEach(query => {
  const results = calculator.searchItems(query).slice(0, 3);
  console.log(`\nSearch "${query}": ${results.length} results`);
  results.forEach(item => {
    console.log(`  - ${item.name} (${item.id}) - ${item.category}`);
  });
});

// Test recipe functionality
console.log('\n--- Testing Recipe Functionality ---');
const itemsWithRecipes = [];
calculator.getAllItems().slice(0, 100).forEach(item => {
  const recipe = calculator.getRecipe(item.id);
  if (recipe) {
    itemsWithRecipes.push({ item, recipe });
  }
});

console.log(`Found ${itemsWithRecipes.length} items with recipes (from first 100 items)`);

if (itemsWithRecipes.length > 0) {
  const example = itemsWithRecipes[0];
  console.log(`\nExample recipe for ${example.item.name}:`);
  console.log(`  Output: ${example.recipe.outputQuantity}x ${example.item.name}`);
  console.log(`  Inputs: ${example.recipe.inputs.length} items`);
  example.recipe.inputs.slice(0, 3).forEach(input => {
    const inputItem = calculator.getItem(input.itemId);
    console.log(`    - ${input.quantity}x ${inputItem ? inputItem.name : input.itemId}`);
  });
}

console.log('\nRecipeCalculator test completed successfully!');
