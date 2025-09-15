// BitJita API response structure
export interface BitJitaPocket {
  locked: boolean
  volume: number
  contents: {
    itemId: number
    itemType: number
    quantity: number
  }
}

export interface BitJitaInventory {
  entityId: string
  playerOwnerEntityId: string
  ownerEntityId: string
  pockets: BitJitaPocket[]
  inventoryIndex: number
  cargoIndex: number
  buildingName: string | null
  claimEntityId: string | null
  claimName: string | null
  claimLocationX: number | null
  claimLocationZ: number | null
  claimLocationDimension: number | null
  regionId: number
  inventoryName: string
}

export interface BitJitaItem {
  id?: number
  name: string
  iconAssetName: string
  tier: number
  rarityStr: string
  tag: string
  toolLevel?: number
  toolPower?: number
  toolType?: number
  toolSkillId?: number
}

export interface BitJitaInventoriesResponse {
  inventories: BitJitaInventory[]
  items: Record<string, BitJitaItem>
  cargos?: Record<string, BitJitaItem>
}

// Our internal UI structure
export interface InventoryItem {
  itemId: string
  quantity: number
  name?: string
  tier?: number
  category?: string
  rarity?: string
  iconAssetName?: string
}

export interface Inventory {
  id: string
  name: string
  type: string
  items: InventoryItem[]
  maxSlots?: number
  buildingName?: string
  claimName?: string
  region?: number
}

export interface PlayerInventories {
  personal?: Inventory[]
  banks?: Inventory[]
  storage?: Inventory[]
  recovery?: Inventory[]
  housing?: Inventory[]
}

// Claim inventory types
export interface ClaimInventory {
  id: string
  name: string
  type: string
  items: InventoryItem[]
  maxSlots?: number
  buildingName?: string
  claimName: string // Always present for claim inventories
  claimId: string
  region?: number
}

export interface ClaimInventoriesResponse {
  inventories: ClaimInventory[]
  claimName: string
  claimId: string
}

export type ContentViewType = "dashboard" | "personal-inventories" | "claim-inventories"

// Housing inventory types
export interface BitJitaHousingInfo {
  buildingEntityId: string
  buildingName: string
  playerEntityId: string
  rank: number
  lockedUntil: string
  isEmpty: boolean
  regionId: number
  entranceDimensionId: number
  claimName: string
  claimRegionId: number
  claimEntityId: string
  locationX: number
  locationZ: number
  locationDimension: number
  locationRegionId: number
}

export interface BitJitaHousingInventoryItem {
  locked: boolean
  volume: number
  contents: {
    item_id: number
    quantity: number
    item_type: string
  }
}

export interface BitJitaHousingInventoryContainer {
  entityId: string
  inventory: BitJitaHousingInventoryItem[]
  buildingName: string
  buildingNickname: string | null
}

export interface BitJitaHousingDetailsResponse extends BitJitaHousingInfo {
  inventories: BitJitaHousingInventoryContainer[]
  items: BitJitaItem[]
  cargos: BitJitaItem[]
}

export type BitJitaHousingResponse = BitJitaHousingInfo[]
