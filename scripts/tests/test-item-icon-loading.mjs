#!/usr/bin/env node

/**
 * Test script to verify item icon loading with the updated logic
 */

import fs from 'fs';
import path from 'path';

// Test the updated icon path logic
const ITEM_NAME_MAPPINGS = {
  'AncientLorePage': 'AncientPage',
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

console.log('=== Testing Icon Path Generation ===\n');

const testItems = [
  { name: 'AncientLorePage', icon_asset_name: 'Items/AncientLorePage' },
  { name: 'LeatherBonnet', icon_asset_name: 'Items/LeatherBonnet' },
  { name: 'StrawberryPie', icon_asset_name: 'Items/StrawberryPie' },
  { name: 'Salt', icon_asset_name: 'Items/Salt' },
  { name: 'AncientGear', icon_asset_name: 'GeneratedIcons/Items/AncientGear' }
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
console.log('The GameDataIcon component will:');
console.log('1. Try the primary path first');
console.log('2. If that fails, try alternative paths in order');
console.log('3. Only show fallback/error after ALL paths have been tried');
console.log('4. This means users should see the correct icons without 404 errors');
