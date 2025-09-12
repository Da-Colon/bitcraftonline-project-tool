import type { PlayerInventories, InventoryItem, Inventory } from "~/types/inventory";

export interface TierData {
  tier: number;
  quantity: number;
}

export interface CategoryTierSummary {
  category: string;
  tiers: TierData[];
  totalQuantity: number;
}

export interface InventoryTierSummary {
  inventoryId: string;
  inventoryName: string;
  inventoryType: string;
  categories: CategoryTierSummary[];
}

// Reusable function to aggregate items by tier for any list of items
export function aggregateItemListByTier(items: InventoryItem[]): CategoryTierSummary[] {
  const categoryMap = new Map<string, Map<number, number>>();

  // Aggregate by category and tier
  items.forEach(item => {
    const category = item.category || 'Uncategorized';
    const tier = item.tier ?? -1;
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Map());
    }
    
    const tierMap = categoryMap.get(category)!;
    const currentQuantity = tierMap.get(tier) || 0;
    tierMap.set(tier, currentQuantity + item.quantity);
  });

  // Convert to sorted array
  const result: CategoryTierSummary[] = [];
  
  categoryMap.forEach((tierMap, category) => {
    const tiers: TierData[] = [];
    let totalQuantity = 0;
    
    tierMap.forEach((quantity, tier) => {
      tiers.push({ tier, quantity });
      totalQuantity += quantity;
    });
    
    // Sort tiers ascending
    tiers.sort((a, b) => a.tier - b.tier);
    
    result.push({
      category,
      tiers,
      totalQuantity,
    });
  });

  // Sort categories by total quantity descending
  result.sort((a, b) => b.totalQuantity - a.totalQuantity);
  
  return result;
}

// Aggregate items by tier while maintaining inventory separation
export function aggregateInventoriesByTier(inventories: PlayerInventories): InventoryTierSummary[] {
  const result: InventoryTierSummary[] = [];
  
  const processInventoryGroup = (invs: Inventory[] | undefined, groupType: string) => {
    if (!invs) return;
    
    invs.forEach(inv => {
      const categories = aggregateItemListByTier(inv.items);
      if (categories.length > 0) {
        result.push({
          inventoryId: inv.id,
          inventoryName: inv.name,
          inventoryType: groupType,
          categories,
        });
      }
    });
  };

  processInventoryGroup(inventories.personal, 'Personal');
  processInventoryGroup(inventories.banks, 'Banks');
  processInventoryGroup(inventories.storage, 'Storage');
  processInventoryGroup(inventories.recovery, 'Recovery');

  return result;
}

// Legacy function for backward compatibility - aggregates across all inventories
export function aggregateItemsByTier(inventories: PlayerInventories): CategoryTierSummary[] {
  const allItems: InventoryItem[] = [];
  
  if (inventories.personal) {
    inventories.personal.forEach(inv => allItems.push(...inv.items));
  }
  if (inventories.banks) {
    inventories.banks.forEach(inv => allItems.push(...inv.items));
  }
  if (inventories.storage) {
    inventories.storage.forEach(inv => allItems.push(...inv.items));
  }
  if (inventories.recovery) {
    inventories.recovery.forEach(inv => allItems.push(...inv.items));
  }

  return aggregateItemListByTier(allItems);
}
