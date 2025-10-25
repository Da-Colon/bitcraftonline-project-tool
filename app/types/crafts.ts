export interface Craft {
  entityId: string;
  buildingEntityId: string;
  ownerEntityId: string;
  regionId: number;
  progress: number;
  recipeId: number;
  craftCount: number;
  lockExpiration: string;
  actionsRequiredPerItem: number;
  craftedItem: Array<{
    itemId: number;
    name: string;
    quantity: number;
  }>;
  levelRequirements: Array<unknown>;
  toolRequirements: Array<unknown>;
  buildingName: string;
  ownerUsername: string;
  claimEntityId: string;
  claimName: string;
  claimLocationX: number;
  claimLocationZ: number;
  totalActionsRequired: number;
  completed: boolean;
  isPublic: boolean;
}

export interface CraftsResponse {
  crafts: Craft[];
  totalCount?: number;
  hasMore?: boolean;
}

export interface ActiveTasksViewProps {
  claimId?: string;
  claimName?: string;
  playerId?: string;
}
