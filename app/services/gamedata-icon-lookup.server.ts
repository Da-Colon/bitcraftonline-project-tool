// GameData Icon Lookup Service
// Provides fallback lookup for iconAssetName when API data is missing it

import itemsJson from "../../GameData/BitCraft_GameData/server/region/item_desc.json" assert { type: "json" }

import type { BitCraftItem } from "~/types/bitcraft-data"

// Create a lookup map from item ID to icon_asset_name
class GameDataIconLookup {
  private iconMap: Map<number, string> = new Map()

  constructor() {
    this.buildIconMap()
  }

  private buildIconMap() {
    const items = itemsJson as unknown as BitCraftItem[]

    for (const item of items) {
      if (item.icon_asset_name) {
        this.iconMap.set(item.id, item.icon_asset_name)
      }
    }
  }

  /**
   * Get icon asset name for an item ID
   * @param itemId - The numeric item ID from GameData
   * @returns The icon_asset_name or undefined if not found
   */
  getIconAssetName(itemId: number): string | undefined {
    return this.iconMap.get(itemId)
  }

  /**
   * Get icon asset name for a string item ID (format: "item_123")
   * @param stringItemId - The string item ID (e.g., "item_1090002")
   * @returns The icon_asset_name or undefined if not found
   */
  getIconAssetNameFromStringId(stringItemId: string): string | undefined {
    // Extract numeric ID from string format "item_123"
    const match = stringItemId.match(/^item_(\d+)$/)
    if (match) {
      const numericId = parseInt(match[1], 10)
      return this.getIconAssetName(numericId)
    }
    return undefined
  }

  /**
   * Enhance an item object by filling in missing iconAssetName
   * @param item - The item object that might be missing iconAssetName
   * @returns The item with iconAssetName filled in if possible
   */
  enhanceItem<T extends { id: string; iconAssetName?: string }>(item: T): T {
    if (!item.iconAssetName) {
      const iconAssetName = this.getIconAssetNameFromStringId(item.id)
      if (iconAssetName) {
        return { ...item, iconAssetName }
      }
    }
    return item
  }
}

// Singleton instance
let iconLookupInstance: GameDataIconLookup | null = null

export function getGameDataIconLookup(): GameDataIconLookup {
  if (!iconLookupInstance) {
    iconLookupInstance = new GameDataIconLookup()
  }
  return iconLookupInstance
}

// Convenience function to enhance a single item
export function enhanceItemWithIcon<T extends { id: string; iconAssetName?: string }>(item: T): T {
  return getGameDataIconLookup().enhanceItem(item)
}

// Convenience function to enhance multiple items
export function enhanceItemsWithIcons<T extends { id: string; iconAssetName?: string }>(
  items: T[]
): T[] {
  const lookup = getGameDataIconLookup()
  return items.map((item) => lookup.enhanceItem(item))
}
