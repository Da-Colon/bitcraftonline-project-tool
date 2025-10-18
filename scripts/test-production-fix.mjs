// Test the production fix with the actual EnhancedRecipeCalculator
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Testing Production Recipe Calculator Fix ===');

// Load real BitCraft game data
const itemsJson = JSON.parse(readFileSync(join(__dirname, '../GameData/BitCraft_GameData/server/region/item_desc.json'), 'utf8'));
const recipesJson = JSON.parse(readFileSync(join(__dirname, '../GameData/BitCraft_GameData/server/region/crafting_recipe_desc.json'), 'utf8'));

// Find Heated Capacitor and Refined Peerless Brick
const heatedCapacitor = itemsJson.find(item => item.name === 'Heated Capacitor');
const refinedPeerlessBrick = itemsJson.find(item => item.name === 'Refined Peerless Brick');

console.log('Heated Capacitor ID:', heatedCapacitor?.id);
console.log('Refined Peerless Brick ID:', refinedPeerlessBrick?.id);

if (!heatedCapacitor || !refinedPeerlessBrick) {
  console.error('Could not find required items');
  process.exit(1);
}

// Test scenario: Need 1x Heated Capacitor, have 2x Refined Peerless Brick
const inventory = [
  { itemId: refinedPeerlessBrick.id.toString(), quantity: 2 }
];

console.log('\n=== Test Scenario ===');
console.log('Target: 1x Heated Capacitor');
console.log('Inventory: 2x Refined Peerless Brick');
console.log('Expected: All children should be zeroed when parent is fully satisfied');

// Since we can't directly import the TypeScript class, we'll test via HTTP
console.log('\n=== Testing via HTTP API ===');
console.log('Note: This test requires the development server to be running');

const testData = {
  itemId: heatedCapacitor.id.toString(),
  quantity: 1,
  inventory: inventory
};

console.log('Test data:', JSON.stringify(testData, null, 2));

// Make HTTP request to test the fix
fetch('http://localhost:3000/api/recipes/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    itemId: testData.itemId,
    quantity: testData.quantity.toString(),
    inventory: JSON.stringify(testData.inventory)
  })
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('\n=== API Response ===');
  console.log('Success! Received response from API');
  
  // Check if the fix is working by looking for zeroed items
  if (data.breakdown && Array.isArray(data.breakdown)) {
    console.log(`\nBreakdown contains ${data.breakdown.length} items`);
    
    // Find the Refined Peerless Brick in the breakdown
    const peerlessBrick = data.breakdown.find(item => item.itemId === refinedPeerlessBrick.id.toString());
    
    if (peerlessBrick) {
      console.log('\nRefined Peerless Brick status:');
      console.log(`  Need: ${peerlessBrick.recipeRequired}`);
      console.log(`  Have: ${peerlessBrick.currentInventory}`);
      console.log(`  Deficit: ${peerlessBrick.deficit}`);
      
      if (peerlessBrick.deficit === 0) {
        console.log('✅ Refined Peerless Brick is fully satisfied');
        
        // Check if children are zeroed
        const childItems = data.breakdown.filter(item => 
          item.itemId !== refinedPeerlessBrick.id.toString() && 
          item.itemId !== heatedCapacitor.id.toString()
        );
        
        const zeroedChildren = childItems.filter(item => item.deficit === 0);
        const nonZeroedChildren = childItems.filter(item => item.deficit > 0);
        
        console.log(`\nChildren analysis:`);
        console.log(`  Total children: ${childItems.length}`);
        console.log(`  Zeroed children: ${zeroedChildren.length}`);
        console.log(`  Non-zeroed children: ${nonZeroedChildren.length}`);
        
        if (nonZeroedChildren.length === 0) {
          console.log('🎉 SUCCESS: All children are zeroed! The fix is working!');
        } else {
          console.log('❌ BUG: Some children are not zeroed:');
          nonZeroedChildren.slice(0, 10).forEach(item => {
            console.log(`    ${item.name} (T${item.tier}): deficit=${item.deficit}`);
          });
        }
      } else {
        console.log('❌ Refined Peerless Brick is not fully satisfied - unexpected');
      }
    } else {
      console.log('✅ Refined Peerless Brick not in breakdown - fully satisfied by inventory');
      
      // Check if children are zeroed
      const childItems = data.breakdown.filter(item => item.itemId !== heatedCapacitor.id.toString());
      const zeroedChildren = childItems.filter(item => item.deficit === 0);
      const nonZeroedChildren = childItems.filter(item => item.deficit > 0);
      
      console.log(`\nChildren analysis:`);
      console.log(`  Total children: ${childItems.length}`);
      console.log(`  Zeroed children: ${zeroedChildren.length}`);
      console.log(`  Non-zeroed children: ${nonZeroedChildren.length}`);
      
      if (nonZeroedChildren.length === 0) {
        console.log('🎉 SUCCESS: All children are zeroed! The fix is working!');
      } else {
        console.log('❌ BUG: Some children are not zeroed:');
        nonZeroedChildren.slice(0, 10).forEach(item => {
          console.log(`    ${item.name} (T${item.tier}): deficit=${item.deficit}`);
        });
      }
    }
  } else {
    console.log('❌ Unexpected response format');
  }
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
  console.log('\nMake sure the development server is running: npm run dev');
  process.exit(1);
});
