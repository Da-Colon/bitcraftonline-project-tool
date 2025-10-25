import type {
  BitJitaInventoriesResponse,
  BitJitaInventory,
  PlayerInventories,
  Inventory,
  InventoryItem,
} from "~/types/inventory"
import { normalizeItemId } from "~/utils/itemId"

export function transformBitJitaInventories(
  response: BitJitaInventoriesResponse
): PlayerInventories {
  const { inventories, items, cargos } = response

  const personal: Inventory[] = []
  const banks: Inventory[] = []
  const storage: Inventory[] = []
  const recovery: Inventory[] = []

  inventories.forEach((inv: BitJitaInventory) => {
    const transformedInventory: Inventory = {
      id: inv.entityId,
      name: inv.inventoryName,
      type: getInventoryType(inv),
      items: transformPockets(inv.pockets, items, cargos),
      maxSlots: inv.pockets.length,
      buildingName: inv.buildingName || undefined,
      claimName: inv.claimName || undefined,
      region: inv.regionId,
    }

    // Categorize inventories based on name and type
    if (inv.inventoryName.toLowerCase().includes("bank")) {
      banks.push(transformedInventory)
    } else if (inv.inventoryName.toLowerCase().includes("recovery")) {
      recovery.push(transformedInventory)
    } else if (
      inv.inventoryName.toLowerCase().includes("cache") ||
      inv.inventoryName.toLowerCase().includes("storage")
    ) {
      storage.push(transformedInventory)
    } else {
      personal.push(transformedInventory)
    }
  })

  return {
    personal: personal.length > 0 ? personal : undefined,
    banks: banks.length > 0 ? banks : undefined,
    storage: storage.length > 0 ? storage : undefined,
    recovery: recovery.length > 0 ? recovery : undefined,
  }
}

function transformPockets(
  pockets: BitJitaInventory["pockets"],
  items: Record<string, unknown>,
  cargos?: Record<string, unknown>
): InventoryItem[] {
  return pockets
    .filter((pocket) => pocket.contents) // Only include pockets with contents
    .map((pocket) => {
      const rawId = pocket.contents.itemId.toString()
      const itemId = normalizeItemId(pocket.contents.itemId)
      const gameItem = items[rawId] || cargos?.[rawId]

      const item = gameItem as { name?: string; tier?: number; tag?: string; rarityStr?: string; iconAssetName?: string } | undefined
      
      return {
        itemId,
        quantity: pocket.contents.quantity,
        name: item?.name,
        tier: item?.tier,
        category: item?.tag,
        rarity: item?.rarityStr,
        iconAssetName: item?.iconAssetName,
      }
    })
}

function getInventoryType(inv: BitJitaInventory): string {
  if (inv.inventoryName.toLowerCase().includes("bank")) return "bank"
  if (inv.inventoryName.toLowerCase().includes("recovery")) return "recovery"
  if (inv.inventoryName.toLowerCase().includes("cache")) return "storage"
  if (inv.inventoryName.toLowerCase().includes("storage")) return "storage"
  if (inv.inventoryName.toLowerCase().includes("toolbelt")) return "toolbelt"
  if (inv.inventoryName.toLowerCase().includes("wallet")) return "wallet"
  if (inv.inventoryName.toLowerCase().includes("inventory")) return "inventory"
  return "personal"
}
