#!/usr/bin/env node

/**
 * Test script to verify the fix for the new failing items
 */

import fs from 'fs';
import path from 'path';

// Test the updated icon path logic with new mappings
const ITEM_NAME_MAPPINGS = {
  'AncientLorePage': 'AncientPage',
  'ToolScrap': 'AncientScrap',
  'GiantSkitchShell': 'SwarmCrabShell',
}

function getCorrectedItemName(itemName) {
  return ITEM_NAME_MAPPINGS[itemName] || itemName
}

function convertIconAssetNameToPath(iconAssetName) {
  if (!iconAssetName || iconAssetName.trim() === "") {
    return null
  }

  if (iconAssetName.includes("\\u") || iconAssetName.charCodeAt(0) < 32) {
    return null
  }

  let cleanPath = iconAssetName.trim()

  const bracketIndex = cleanPath.indexOf("[")
  if (bracketIndex !== -1) {
    cleanPath = cleanPath.substring(0, bracketIndex)
  }

  while (cleanPath.includes("GeneratedIcons/Other/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/Other/GeneratedIcons/", "GeneratedIcons/")
  }

  while (cleanPath.includes("GeneratedIcons/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/GeneratedIcons/", "GeneratedIcons/")
  }

  if (!cleanPath.startsWith("GeneratedIcons/") && cleanPath.startsWith("Items/")) {
    const itemName = cleanPath.replace("Items/", "")
    const correctedItemName = getCorrectedItemName(itemName)
    cleanPath = `OldGeneratedIcons/Items/${correctedItemName}`
  }

  if (!cleanPath.endsWith(".png")) {
    cleanPath += ".png"
  }

  return `/assets/${cleanPath}`
}

function getAlternativeIconPaths(iconAssetName) {
  const primaryPath = convertIconAssetNameToPath(iconAssetName)
  if (!primaryPath) return []

  const alternatives = []

  if (primaryPath.includes("/GeneratedIcons/")) {
    alternatives.push(primaryPath.replace("/GeneratedIcons/", "/OldGeneratedIcons/"))
  }

  if (primaryPath.includes("/OldGeneratedIcons/")) {
    alternatives.push(primaryPath.replace("/OldGeneratedIcons/", "/GeneratedIcons/"))
  }

  return alternatives
}

console.log('=== Testing New Failing Items Fix ===\n');

const testItems = [
  { name: 'ToolScrap', icon_asset_name: 'Items/ToolScrap' },
  { name: 'GiantSkitchShell', icon_asset_name: 'Items/GiantSkitchShell' },
  { name: 'CookedSunflowerSeeds', icon_asset_name: 'Items/CookedSunflowerSeeds' }
];

testItems.forEach(item => {
  const primaryPath = convertIconAssetNameToPath(item.icon_asset_name);
  const alternativePaths = getAlternativeIconPaths(item.icon_asset_name);
  const allPaths = primaryPath ? [primaryPath, ...alternativePaths] : [];
  
  console.log(`\n--- ${item.name} ---`);
  console.log(`Icon Asset Name: ${item.icon_asset_name}`);
  console.log(`Primary Path: ${primaryPath}`);
  console.log(`Alternative Paths: ${alternativePaths.join(', ')}`);
  console.log(`All Paths: ${allPaths.join(' -> ')}`);
  
  // Check if files exist
  const publicAssetsPath = './public/assets';
  allPaths.forEach((testPath, index) => {
    const fullPath = path.join(publicAssetsPath, testPath.replace('/assets/', ''));
    const exists = fs.existsSync(fullPath);
    console.log(`  Path ${index + 1}: ${testPath} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  });
});

console.log('\n=== Summary ===');
console.log('The updated mappings should help resolve the failing items:');
console.log('- ToolScrap -> AncientScrap (should exist)');
console.log('- GiantSkitchShell -> SwarmCrabShell (should exist)');
console.log('- CookedSunflowerSeeds (no mapping, will show fallback)');
