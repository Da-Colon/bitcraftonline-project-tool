import { json, type ActionFunctionArgs } from "@remix-run/node";
import type { ProjectItem, Item, Recipe } from "~/types/recipes";
import { RecipeCalculator } from "~/services/recipe-calculator.server";

type CalcResponse = {
  rawMaterials: Array<[string, number]>;
  intermediates: Array<[string, number]>;
  totalItems: Array<[string, number]>;
  steps: Array<{ itemId: string; quantity: number; tier: number }>;
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray((body as any)?.items) ? ((body as any).items as ProjectItem[]) : null;
  if (!items) {
    return json({ error: "'items' array is required" }, { status: 400 });
  }

  const calculator = new RecipeCalculator();
  const breakdown = calculator.calculateRequirements(items);
  const steps = calculator.getCraftingSteps(items);

  // Collect all involved item ids
  const ids = new Set<string>();
  for (const [id] of breakdown.totalItems.entries()) ids.add(id);
  for (const [id] of breakdown.rawMaterials.entries()) ids.add(id);
  for (const [id] of breakdown.intermediates.entries()) ids.add(id);
  for (const it of items) ids.add(it.itemId);

  const itemsMap: Record<string, Item> = {};
  const recipesMap: Record<string, Recipe> = {};
  ids.forEach((id) => {
    const it = calculator.getItem(id);
    if (it) itemsMap[id] = it;
    const rc = calculator.getRecipe(id);
    if (rc) recipesMap[id] = rc;
  });

  const response: CalcResponse = {
    rawMaterials: Array.from(breakdown.rawMaterials.entries()),
    intermediates: Array.from(breakdown.intermediates.entries()),
    totalItems: Array.from(breakdown.totalItems.entries()),
    steps,
    items: itemsMap,
    recipes: recipesMap,
  };

  return json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

