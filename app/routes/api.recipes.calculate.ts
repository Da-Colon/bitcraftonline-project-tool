/**
 * @fileoverview Recipe Calculation API Endpoint
 * 
 * POST /api/recipes/calculate
 * 
 * Calculates recipe requirements using either enhanced or basic calculator.
 * Supports both single-item calculations with inventory (enhanced) and
 * legacy multi-item project calculations (basic).
 * 
 * @dependencies EnhancedRecipeCalculator, RecipeCalculator, StandardErrorResponse
 * @caching No cache (calculation results are dynamic)
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";

import { getEnhancedRecipeCalculator } from "~/services/enhanced-recipe-calculator.server";
import { RecipeCalculator } from "~/services/recipe-calculator.server";
import type { StandardErrorResponse } from "~/types/api-responses";
import type { 
  ProjectItem, 
  Item, 
  Recipe, 
  RecipeBreakdownItem, 
  InventoryItem 
} from "~/types/recipes";

/**
 * Response type for basic calculator (legacy multi-item projects)
 */
type CalcResponse = {
  rawMaterials: Array<[string, number]>;
  intermediates: Array<[string, number]>;
  totalItems: Array<[string, number]>;
  steps: Array<{ itemId: string; quantity: number; tier: number }>;
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
};

/**
 * Response type for enhanced calculator (single item with inventory)
 */
type EnhancedCalcResponse = {
  breakdown: RecipeBreakdownItem[];
  totalDeficit: Array<[string, number]>;
};

/**
 * POST /api/recipes/calculate
 * 
 * Calculate recipe requirements using enhanced or basic calculator
 * 
 * @param {string} itemId - Item ID for enhanced calculation (form data)
 * @param {number} quantity - Quantity for enhanced calculation (form data)
 * @param {string} inventory - JSON string of inventory items (form data)
 * @param {ProjectItem[]} items - Array of project items for basic calculation (JSON body)
 * @returns {CalcResponse | EnhancedCalcResponse} Calculation results
 * @throws {400} When input validation fails
 * @throws {405} When method is not POST
 * 
 * @example
 * POST /api/recipes/calculate
 * Form data: { itemId: "123", quantity: 10, inventory: "[...]" }
 * Returns: { breakdown: [...], totalDeficit: [...] }
 * 
 * @example
 * POST /api/recipes/calculate
 * JSON body: { items: [{ itemId: "123", quantity: 10 }] }
 * Returns: { rawMaterials: [...], intermediates: [...], ... }
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST method
  if (request.method !== "POST") {
    return json<StandardErrorResponse>(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  const formData = await request.formData();
  const itemId = formData.get("itemId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const inventoryJson = formData.get("inventory") as string;

  // Handle enhanced recipe calculation (single item with inventory)
  if (itemId && quantity && inventoryJson) {
    // Validate enhanced calculation inputs
    if (!itemId || isNaN(quantity) || quantity <= 0) {
      return json<StandardErrorResponse>(
        { error: "Invalid itemId or quantity" },
        { status: 400 }
      );
    }

    try {
      const inventory: InventoryItem[] = JSON.parse(inventoryJson);
      
      if (!Array.isArray(inventory)) {
        return json<StandardErrorResponse>(
          { error: "Inventory must be an array" },
          { status: 400 }
        );
      }

      // Use the enhanced calculator for single-item calculations with inventory
      const calculator = getEnhancedRecipeCalculator();
      const result = calculator.calculateWithInventory(itemId, quantity, inventory);
      
      const response: EnhancedCalcResponse = {
        breakdown: result.breakdown,
        totalDeficit: [],
      };
      
      return json<EnhancedCalcResponse>(response, {
        headers: {
          "Cache-Control": "no-store", // Calculation results are dynamic
        },
      });
    } catch {
      // console.error("Enhanced calculation error:", error);
      return json<StandardErrorResponse>(
        { error: "Invalid inventory data" },
        { status: 400 }
      );
    }
  }

  // Handle legacy project calculation (multiple items, no inventory)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json<StandardErrorResponse>(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const bodyWithItems = body as { items?: ProjectItem[] };
  const items = Array.isArray(bodyWithItems?.items) ? bodyWithItems.items : null;
  
  if (!items) {
    return json<StandardErrorResponse>(
      { error: "'items' array is required" },
      { status: 400 }
    );
  }

  try {
    // Use the basic calculator for multi-item project calculations
    const calculator = new RecipeCalculator();
    const breakdown = calculator.calculateRequirements(items);
    const steps = calculator.getCraftingSteps(items);

    // Collect all involved item IDs for metadata
    const ids = new Set<string>();
    for (const [id] of breakdown.totalItems.entries()) ids.add(id);
    for (const [id] of breakdown.rawMaterials.entries()) ids.add(id);
    for (const [id] of breakdown.intermediates.entries()) ids.add(id);
    for (const it of items) ids.add(it.itemId);

    // Build items and recipes metadata
    const itemsMap: Record<string, Item> = {};
    const recipesMap: Record<string, Recipe> = {};
    ids.forEach((id) => {
      const item = calculator.getItem(id);
      if (item) itemsMap[id] = item;
      const recipe = calculator.getRecipe(id);
      if (recipe) recipesMap[id] = recipe;
    });

    const response: CalcResponse = {
      rawMaterials: Array.from(breakdown.rawMaterials.entries()),
      intermediates: Array.from(breakdown.intermediates.entries()),
      totalItems: Array.from(breakdown.totalItems.entries()),
      steps,
      items: itemsMap,
      recipes: recipesMap,
    };

    return json<CalcResponse>(response, {
      headers: {
        "Cache-Control": "no-store", // Calculation results are dynamic
      },
    });
  } catch {
    // console.error("Basic calculation error:", error);
    return json<StandardErrorResponse>(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}
