#!/usr/bin/env node

/**
 * Test script to verify the updated icon path logic
 */

// Copy the updated logic from the TypeScript file
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

console.log('=== Testing Updated Icon Path Logic ===\n');

const testItems = [
  { name: 'AncientLorePage', icon_asset_name: 'Items/AncientLorePage' },
  { name: 'LeatherBonnet', icon_asset_name: 'Items/LeatherBonnet' },
  { name: 'StrawberryPie', icon_asset_name: 'Items/StrawberryPie' },
  { name: 'Salt', icon_asset_name: 'Items/Salt' },
  { name: 'HexCoin', icon_asset_name: 'Items/HexCoin[,3,10,500]' },
  { name: 'AncientGear', icon_asset_name: 'GeneratedIcons/Items/AncientGear' }
];

testItems.forEach(item => {
  const generatedPath = convertIconAssetNameToPath(item.icon_asset_name);
  console.log(`${item.name}: ${item.icon_asset_name} -> ${generatedPath}`);
});

console.log('\n=== File System Verification ===\n');

import fs from 'fs';
import path from 'path';

const publicAssetsPath = './public/assets';
const checkPaths = [
  '/OldGeneratedIcons/Items/AncientPage.png',
  '/OldGeneratedIcons/Items/LeatherBonnet.png',
  '/OldGeneratedIcons/Items/StrawberryPie.png',
  '/OldGeneratedIcons/Items/Salt.png',
  '/OldGeneratedIcons/Items/HexCoin.png',
  '/GeneratedIcons/Items/AncientGear.png'
];

checkPaths.forEach(checkPath => {
  const fullPath = path.join(publicAssetsPath, checkPath);
  const exists = fs.existsSync(fullPath);
  console.log(`${checkPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
});
