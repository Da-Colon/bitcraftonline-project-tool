#!/usr/bin/env node

/**
 * Test script to examine item data structure and icon paths
 * This helps understand how items are structured and what icon paths should be generated
 */

import fs from 'fs';
import path from 'path';

const ITEM_DESC_PATH = './GameData/BitCraft_GameData/static/item_desc.json';

// Load the item data
const itemData = JSON.parse(fs.readFileSync(ITEM_DESC_PATH, 'utf8'));

console.log('=== Item Data Analysis ===\n');

// Find items that are failing to load
const failingItems = [
  'AncientLorePage',
  'LeatherBonnet', 
  'StrawberryPie',
  'WildBread',
  'PotatoAndWolfMeat',
  'RabbitMeatSandwich',
  'UncookedWhiteOnionRolls',
  'CookedBass',
  'CookedSalmon',
  'Salt',
  'CookedSunflowerSeeds',
  'FishAndChips',
  'BoarMeatCooked'
];

console.log('=== Failing Items Analysis ===\n');

failingItems.forEach(itemName => {
  const items = itemData.filter(item => 
    item.name === itemName || 
    item.icon_asset_name?.includes(itemName) ||
    item.icon_asset_name?.includes(itemName.replace(/([A-Z])/g, '$1'))
  );
  
  if (items.length > 0) {
    console.log(`\n--- ${itemName} ---`);
    items.forEach(item => {
      console.log(`ID: ${item.id}`);
      console.log(`Name: ${item.name}`);
      console.log(`Icon Asset Name: ${item.icon_asset_name}`);
      console.log(`Tier: ${item.tier}`);
      console.log(`Tag: ${item.tag}`);
      console.log('---');
    });
  } else {
    console.log(`\n--- ${itemName} ---`);
    console.log('No items found with this name');
  }
});

console.log('\n=== Sample Item Structure ===\n');

// Show a few sample items to understand the structure
const sampleItems = itemData.slice(0, 5);
sampleItems.forEach((item, index) => {
  console.log(`Item ${index + 1}:`);
  console.log(`  ID: ${item.id}`);
  console.log(`  Name: ${item.name}`);
  console.log(`  Icon Asset Name: ${item.icon_asset_name}`);
  console.log(`  Tier: ${item.tier}`);
  console.log(`  Tag: ${item.tag}`);
  console.log(`  Volume: ${item.volume}`);
  console.log(`  Description: ${item.description}`);
  console.log('---');
});

console.log('\n=== Icon Asset Name Patterns ===\n');

// Analyze different icon asset name patterns
const iconPatterns = {};
itemData.forEach(item => {
  if (item.icon_asset_name) {
    const pattern = item.icon_asset_name.split('/')[0] || 'root';
    iconPatterns[pattern] = (iconPatterns[pattern] || 0) + 1;
  }
});

console.log('Icon asset name patterns:');
Object.entries(iconPatterns)
  .sort(([,a], [,b]) => b - a)
  .forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${count} items`);
  });

console.log('\n=== Items with GeneratedIcons vs OldGeneratedIcons ===\n');

const generatedIconsItems = itemData.filter(item => 
  item.icon_asset_name?.startsWith('GeneratedIcons/')
);
const oldGeneratedIconsItems = itemData.filter(item => 
  item.icon_asset_name?.startsWith('Items/')
);

console.log(`Items with GeneratedIcons prefix: ${generatedIconsItems.length}`);
console.log(`Items with Items/ prefix: ${oldGeneratedIconsItems.length}`);

// Show some examples of each
console.log('\nGeneratedIcons examples:');
generatedIconsItems.slice(0, 3).forEach(item => {
  console.log(`  ${item.name}: ${item.icon_asset_name}`);
});

console.log('\nItems/ examples:');
oldGeneratedIconsItems.slice(0, 3).forEach(item => {
  console.log(`  ${item.name}: ${item.icon_asset_name}`);
});

console.log('\n=== Test Icon Path Generation ===\n');

// Test the current icon path generation logic
function convertIconAssetNameToPath(iconAssetName) {
  if (!iconAssetName || iconAssetName.trim() === "") {
    return null;
  }

  if (iconAssetName.includes("\\u") || iconAssetName.charCodeAt(0) < 32) {
    return null;
  }

  let cleanPath = iconAssetName.trim();

  const bracketIndex = cleanPath.indexOf("[");
  if (bracketIndex !== -1) {
    cleanPath = cleanPath.substring(0, bracketIndex);
  }

  while (cleanPath.includes("GeneratedIcons/Other/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/Other/GeneratedIcons/", "GeneratedIcons/");
  }

  while (cleanPath.includes("GeneratedIcons/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/GeneratedIcons/", "GeneratedIcons/");
  }

  if (!cleanPath.startsWith("GeneratedIcons/") && cleanPath.startsWith("Items/")) {
    cleanPath = `GeneratedIcons/${cleanPath}`;
  }

  if (!cleanPath.endsWith(".png")) {
    cleanPath += ".png";
  }

  return `/assets/${cleanPath}`;
}

// Test with some failing items
const testItems = [
  { name: 'AncientLorePage', icon_asset_name: 'Items/AncientLorePage' },
  { name: 'LeatherBonnet', icon_asset_name: 'Items/LeatherBonnet' },
  { name: 'StrawberryPie', icon_asset_name: 'Items/StrawberryPie' },
  { name: 'Salt', icon_asset_name: 'Items/Salt' }
];

testItems.forEach(item => {
  const generatedPath = convertIconAssetNameToPath(item.icon_asset_name);
  console.log(`${item.name}: ${item.icon_asset_name} -> ${generatedPath}`);
});

console.log('\n=== File System Check ===\n');

// Check what files actually exist
const publicAssetsPath = './public/assets';
const checkPaths = [
  '/GeneratedIcons/Items/AncientLorePage.png',
  '/OldGeneratedIcons/Items/AncientPage.png',
  '/OldGeneratedIcons/Items/LeatherBonnet.png',
  '/OldGeneratedIcons/Items/StrawberryPie.png'
];

checkPaths.forEach(checkPath => {
  const fullPath = path.join(publicAssetsPath, checkPath);
  const exists = fs.existsSync(fullPath);
  console.log(`${checkPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
});
