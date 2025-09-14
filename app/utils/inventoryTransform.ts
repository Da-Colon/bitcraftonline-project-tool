import type { BitJitaInventoriesResponse, BitJitaInventory, PlayerInventories, Inventory, InventoryItem } from "~/types/inventory";

export function transformBitJitaInventories(response: BitJitaInventoriesResponse): PlayerInventories {
  const { inventories, items, cargos } = response;
  
  const personal: Inventory[] = [];
  const banks: Inventory[] = [];
  const storage: Inventory[] = [];
  const recovery: Inventory[] = [];

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
    };

    // Categorize inventories based on name and type
    const inventoryName = inv.inventoryName?.toLowerCase() || '';
    if (inventoryName.includes('bank')) {
      banks.push(transformedInventory);
    } else if (inventoryName.includes('recovery')) {
      recovery.push(transformedInventory);
    } else if (inventoryName.includes('cache') || inventoryName.includes('storage')) {
      storage.push(transformedInventory);
    } else {
      personal.push(transformedInventory);
    }
  });

  return {
    personal: personal.length > 0 ? personal : undefined,
    banks: banks.length > 0 ? banks : undefined,
    storage: storage.length > 0 ? storage : undefined,
    recovery: recovery.length > 0 ? recovery : undefined,
  };
}

function transformPockets(
  pockets: BitJitaInventory['pockets'], 
  items: Record<string, any>, 
  cargos?: Record<string, any>
): InventoryItem[] {
  return pockets
    .filter(pocket => pocket.contents) // Only include pockets with contents
    .map(pocket => {
      const itemId = pocket.contents.itemId.toString();
      const gameItem = items[itemId] || cargos?.[itemId];
      
      return {
        itemId,
        quantity: pocket.contents.quantity,
        name: gameItem?.name,
        tier: gameItem?.tier,
        category: gameItem?.tag,
        rarity: gameItem?.rarityStr,
      };
    });
}

function getInventoryType(inv: BitJitaInventory): string {
  const inventoryName = inv.inventoryName?.toLowerCase() || '';
  if (inventoryName.includes('bank')) return 'bank';
  if (inventoryName.includes('recovery')) return 'recovery';
  if (inventoryName.includes('cache')) return 'storage';
  if (inventoryName.includes('storage')) return 'storage';
  if (inventoryName.includes('toolbelt')) return 'toolbelt';
  if (inventoryName.includes('wallet')) return 'wallet';
  if (inventoryName.includes('inventory')) return 'inventory';
  return 'personal';
}
