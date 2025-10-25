// Test Search Functionality with BitCraft Data
import { loadAndParseBitCraftData } from '../bitcraft/bitcraft-data-loader.js';

console.log('Testing search functionality with BitCraft data...');

// Load the data
const { items } = loadAndParseBitCraftData();

// Create a simple search function like the one in RecipeCalculator
function searchItems(query, itemsList) {
  const lowerQuery = query.toLowerCase();
  return itemsList.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );
}

// Test some searches
const testQueries = ['ore', 'wood', 'coin', 'gear', 'ferralith'];

console.log('\n--- Search Results ---');
testQueries.forEach(query => {
  const results = searchItems(query, items).slice(0, 5); // Limit to 5 results
  console.log(`\nSearch for "${query}": ${results.length} results`);
  results.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.name} (${item.category}) - Tier ${item.tier}`);
  });
});

// Test category distribution
const categories = new Map();
items.forEach(item => {
  const count = categories.get(item.category) || 0;
  categories.set(item.category, count + 1);
});

console.log('\n--- Category Distribution ---');
const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
sortedCategories.slice(0, 10).forEach(([category, count]) => {
  console.log(`${category}: ${count} items`);
});

console.log('\nSearch test completed successfully!');
