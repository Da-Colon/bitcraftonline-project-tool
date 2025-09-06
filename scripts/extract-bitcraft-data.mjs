// Extract BitCraft Data for Browser Use
import { loadAndParseBitCraftData } from './bitcraft/bitcraft-data-loader.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('Extracting BitCraft data for browser use...');

try {
  // Load and parse the full BitCraft data
  const { items, recipes } = loadAndParseBitCraftData();
  
  console.log(`Processing ${items.length} items and ${recipes.length} recipes...`);
  
  // Create the data structure for browser use
  const browserData = {
    items: items,
    recipes: recipes
  };
  
  // Write to TypeScript file
  const outputPath = path.join(process.cwd(), 'app', 'data', 'bitcraft-data.ts');
  
  const tsContent = `// Generated BitCraft Data - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

import type { Item, Recipe } from '../types/recipes';

export const bitCraftItems: Item[] = ${JSON.stringify(items, null, 2)};

export const bitCraftRecipes: Recipe[] = ${JSON.stringify(recipes, null, 2)};

export const bitCraftData = {
  items: bitCraftItems,
  recipes: bitCraftRecipes
};
`;
  
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  console.log(`Successfully extracted BitCraft data to ${outputPath}`);
  console.log(`- ${items.length} items`);
  console.log(`- ${recipes.length} recipes`);
  
} catch (error) {
  console.error('Error extracting BitCraft data:', error);
  process.exit(1);
}
