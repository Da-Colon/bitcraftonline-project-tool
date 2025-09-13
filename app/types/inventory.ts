// BitJita API response structure
export interface BitJitaPocket {
  locked: boolean;
  volume: number;
  contents: {
    itemId: number;
    itemType: number;
    quantity: number;
  };
}

export interface BitJitaInventory {
  entityId: string;
  playerOwnerEntityId: string;
  ownerEntityId: string;
  pockets: BitJitaPocket[];
  inventoryIndex: number;
  cargoIndex: number;
  buildingName: string | null;
  claimEntityId: string | null;
  claimName: string | null;
  claimLocationX: number | null;
  claimLocationZ: number | null;
  claimLocationDimension: number | null;
  regionId: number;
  inventoryName: string;
}

export interface BitJitaItem {
  name: string;
  iconAssetName: string;
  tier: number;
  rarityStr: string;
  tag: string;
  toolLevel?: number;
  toolPower?: number;
  toolType?: number;
  toolSkillId?: number;
}

export interface BitJitaInventoriesResponse {
  inventories: BitJitaInventory[];
  items: Record<string, BitJitaItem>;
  cargos?: Record<string, BitJitaItem>;
}

// Our internal UI structure
export interface InventoryItem {
  itemId: string;
  quantity: number;
  name?: string;
  tier?: number;
  category?: string;
  rarity?: string;
}

export interface Inventory {
  id: string;
  name: string;
  type: string;
  items: InventoryItem[];
  maxSlots?: number;
  buildingName?: string;
  claimName?: string;
  region?: number;
}

export interface PlayerInventories {
  personal?: Inventory[];
  banks?: Inventory[];
  storage?: Inventory[];
  recovery?: Inventory[];
}

// Claim inventory types
export interface ClaimInventory {
  id: string;
  name: string;
  type: string;
  items: InventoryItem[];
  maxSlots?: number;
  buildingName?: string;
  claimName: string; // Always present for claim inventories
  claimId: string;
  region?: number;
}

export interface ClaimInventoriesResponse {
  inventories: ClaimInventory[];
  claimName: string;
  claimId: string;
}

export type ContentViewType = 'dashboard' | 'personal-inventories' | 'claim-inventories';
