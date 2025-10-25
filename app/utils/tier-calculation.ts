import type { Item } from "~/types/recipes";

/**
 * Calculates how higher tier items can reduce lower tier requirements
 * This implements tier-aware inventory optimization where higher tier items
 * can substitute for multiple lower tier items of the same category
 */

interface TierReduction {
  itemId: string;
  reducedQuantity: number;
  sourceItemId: string;
  sourceQuantity: number;
}

export function calculateTierReductions(
  requiredItems: Map<string, number>,
  availableItems: Map<string, number>,
  itemMap: Map<string, Item>
): Map<string, TierReduction[]> {
  const reductions = new Map<string, TierReduction[]>();
  
  // Group items by category and tier
  const itemsByCategory = new Map<string, Map<number, Item[]>>();
  
  for (const [itemId] of requiredItems) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    
    const category = item.category || "Other";
    if (!itemsByCategory.has(category)) {
      itemsByCategory.set(category, new Map());
    }
    
    let categoryTiers = itemsByCategory.get(category);
    if (!categoryTiers) {
      categoryTiers = new Map();
      itemsByCategory.set(category, categoryTiers);
    }
    
    if (!categoryTiers.has(item.tier)) {
      categoryTiers.set(item.tier, []);
    }
    const tierItems = categoryTiers.get(item.tier);
    if (tierItems) {
      tierItems.push(item);
    }
  }
  
  // For each category, check if higher tier available items can reduce lower tier requirements
  for (const [, tierMap] of itemsByCategory) {
    const sortedTiers = Array.from(tierMap.keys()).sort((a, b) => b - a); // Highest tier first
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const higherTier = sortedTiers[i];
      const higherTierItems = tierMap.get(higherTier);
      if (!higherTierItems) continue;
      
      // Check if we have any available items of this higher tier
      for (const higherItem of higherTierItems) {
        const availableQuantity = availableItems.get(higherItem.id) || 0;
        if (availableQuantity === 0) continue;
        
        // Calculate how much this higher tier item can reduce lower tier requirements
        for (let j = i + 1; j < sortedTiers.length; j++) {
          const lowerTier = sortedTiers[j];
          const lowerTierItems = tierMap.get(lowerTier);
          if (!lowerTierItems) continue;
          
          const tierDifference = higherTier - lowerTier;
          if (tierDifference <= 0) continue;
          
          // Higher tier items can substitute for lower tier items
          // Rule: Each higher tier item can replace (tierDifference * 2) lower tier items
          const substitutionRatio = Math.pow(2, tierDifference);
          
          for (const lowerItem of lowerTierItems) {
            const requiredQuantity = requiredItems.get(lowerItem.id) || 0;
            if (requiredQuantity === 0) continue;
            
            // Calculate how much we can reduce based on available higher tier items
            const maxReductionFromHigherTier = availableQuantity * substitutionRatio;
            const actualReduction = Math.min(maxReductionFromHigherTier, requiredQuantity);
            
            if (actualReduction > 0) {
              const usedHigherTierQuantity = Math.ceil(actualReduction / substitutionRatio);
              
              if (!reductions.has(lowerItem.id)) {
                reductions.set(lowerItem.id, []);
              }
              
              const itemReductions = reductions.get(lowerItem.id);
              if (itemReductions) {
                itemReductions.push({
                  itemId: lowerItem.id,
                  reducedQuantity: actualReduction,
                  sourceItemId: higherItem.id,
                  sourceQuantity: usedHigherTierQuantity,
                });
              }
            }
          }
        }
      }
    }
  }
  
  return reductions;
}

/**
 * Applies tier reductions to the required items map
 */
export function applyTierReductions(
  requiredItems: Map<string, number>,
  reductions: Map<string, TierReduction[]>
): Map<string, number> {
  const adjustedRequirements = new Map(requiredItems);
  
  for (const [itemId, itemReductions] of reductions) {
    const currentRequired = adjustedRequirements.get(itemId) || 0;
    const totalReduction = itemReductions.reduce((sum, reduction) => sum + reduction.reducedQuantity, 0);
    const newRequired = Math.max(0, currentRequired - totalReduction);
    
    if (newRequired === 0) {
      adjustedRequirements.delete(itemId);
    } else {
      adjustedRequirements.set(itemId, newRequired);
    }
  }
  
  return adjustedRequirements;
}

/**
 * Gets a summary of tier optimizations for display
 */
export function getTierOptimizationSummary(
  reductions: Map<string, TierReduction[]>,
  itemMap: Map<string, Item>
): Array<{
  category: string;
  higherTierItem: string;
  lowerTierItem: string;
  savedQuantity: number;
  usedQuantity: number;
}> {
  const summary: Array<{
    category: string;
    higherTierItem: string;
    lowerTierItem: string;
    savedQuantity: number;
    usedQuantity: number;
  }> = [];
  
  for (const [itemId, itemReductions] of reductions) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    
    for (const reduction of itemReductions) {
      const sourceItem = itemMap.get(reduction.sourceItemId);
      if (!sourceItem) continue;
      
      summary.push({
        category: item.category || "Other",
        higherTierItem: sourceItem.name,
        lowerTierItem: item.name,
        savedQuantity: reduction.reducedQuantity,
        usedQuantity: reduction.sourceQuantity,
      });
    }
  }
  
  return summary;
}
