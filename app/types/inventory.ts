export interface InventoryItem {
  itemId: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface Inventory {
  id: string;
  name: string;
  type: string;
  items: InventoryItem[];
  maxSlots?: number;
}

export interface PlayerInventories {
  house_inventory?: Inventory[];
  personal_banks?: Inventory[];
  personal_storages?: Inventory[];
}

export type ContentViewType = 'dashboard' | 'personal-inventories';
