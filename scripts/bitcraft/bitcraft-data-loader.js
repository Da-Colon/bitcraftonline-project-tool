// BitCraft Data Loader (JavaScript version for testing) - moved under scripts/bitcraft
import * as fs from 'fs';
import * as path from 'path';
import { parseItem, parseRecipe, parseExtractionRecipe } from './bitcraft-parser.js';

// Load items from BitCraft GameData
export function loadBitCraftItems() {
  try {
    const gameDataPath = path.join(process.cwd(), 'GameData', 'BitCraft_GameData', 'static', 'item_desc.json');
    const rawData = fs.readFileSync(gameDataPath, 'utf-8');
    const items = JSON.parse(rawData);
    return items;
  } catch (error) {
    console.error('Error loading BitCraft items:', error);
    return [];
  }
}

// Load crafting recipes from BitCraft GameData
export function loadBitCraftRecipes() {
  try {
    const gameDataPath = path.join(process.cwd(), 'GameData', 'BitCraft_GameData', 'static', 'crafting_recipe_desc.json');
    const rawData = fs.readFileSync(gameDataPath, 'utf-8');
    const recipes = JSON.parse(rawData);
    return recipes;
  } catch (error) {
    console.error('Error loading BitCraft recipes:', error);
    return [];
  }
}

// Load extraction recipes from BitCraft GameData
export function loadBitCraftExtractionRecipes() {
  try {
    const gameDataPath = path.join(process.cwd(), 'GameData', 'BitCraft_GameData', 'static', 'extraction_recipe_desc.json');
    const rawData = fs.readFileSync(gameDataPath, 'utf-8');
    const recipes = JSON.parse(rawData);
    return recipes;
  } catch (error) {
    console.error('Error loading BitCraft extraction recipes:', error);
    return [];
  }
}

// Load and parse all BitCraft data
export function loadAndParseBitCraftData() {
  console.log('Loading BitCraft GameData...');
  
  // Load raw data
  const rawItems = loadBitCraftItems();
  const rawRecipes = loadBitCraftRecipes();
  const rawExtractionRecipes = loadBitCraftExtractionRecipes();
  
  console.log(`Loaded ${rawItems.length} items, ${rawRecipes.length} crafting recipes, ${rawExtractionRecipes.length} extraction recipes`);
  
  // Parse items
  const parsedItems = rawItems.map(parseItem);
  
  // Parse crafting recipes
  const parsedCraftingRecipes = rawRecipes.map(parseRecipe).filter((recipe) => recipe !== null);
  
  // Parse extraction recipes
  const parsedExtractionRecipes = rawExtractionRecipes.map((recipe) => parseExtractionRecipe(recipe)).filter((recipe) => recipe !== null);
  
  // Combine all recipes
  const allParsedRecipes = [...parsedCraftingRecipes, ...parsedExtractionRecipes];
  
  console.log(`Parsed ${parsedItems.length} items and ${allParsedRecipes.length} recipes`);
  
  return {
    items: parsedItems,
    recipes: allParsedRecipes
  };
}

// Example usage:
// const { items, recipes } = loadAndParseBitCraftData();
// console.log('First item:', items[0]);
// console.log('First recipe:', recipes[0]);
