// Legacy test (does not run as-is): kept for reference
// Simple test to verify the calculator works
// Note: This attempted to import a TypeScript server file directly in Node.
// Use scripts/tests/test-recipe-calculator.mjs for a working example.
import { RecipeCalculator } from "./app/services/recipe-calculator.ts";

const calculator = new RecipeCalculator();

// Test 1: Basic item lookup
console.log("=== Test 1: Item Lookup ===");
const wood = calculator.getItem("wood");
console.log("Wood:", wood);

const hammer = calculator.getItem("hammer");
console.log("Hammer:", hammer);

// Test 2: Recipe lookup
console.log("\n=== Test 2: Recipe Lookup ===");
const hammerRecipe = calculator.getRecipe("hammer");
console.log("Hammer Recipe:", hammerRecipe);

// Test 3: Search functionality
console.log("\n=== Test 3: Search ===");
const searchResults = calculator.searchItems("wood");
console.log("Search 'wood':", searchResults.map(item => item.name));

// Test 4: Calculate requirements for a hammer
console.log("\n=== Test 4: Calculate Hammer Requirements ===");
const projectItems = [
  { itemId: "hammer", quantity: 1 }
];

const breakdown = calculator.calculateRequirements(projectItems);
console.log("Raw Materials:", Array.from(breakdown.rawMaterials.entries()));
console.log("Intermediates:", Array.from(breakdown.intermediates.entries()));
console.log("Total Items:", Array.from(breakdown.totalItems.entries()));

// Test 5: Complex item (furnace)
console.log("\n=== Test 5: Calculate Furnace Requirements ===");
const furnaceProject = [
  { itemId: "furnace", quantity: 1 }
];

const furnaceBreakdown = calculator.calculateRequirements(furnaceProject);
console.log("Furnace Raw Materials:", Array.from(furnaceBreakdown.rawMaterials.entries()));
console.log("Furnace Intermediates:", Array.from(furnaceBreakdown.intermediates.entries()));

// Test 6: Crafting steps
console.log("\n=== Test 6: Crafting Steps ===");
const steps = calculator.getCraftingSteps(furnaceProject);
console.log("Crafting Steps:", steps.map(step => {
  const item = calculator.getItem(step.itemId);
  return `${item?.name} (Tier ${step.tier}): ${step.quantity}`;
}));

console.log("\n=== All Tests Complete ===");
