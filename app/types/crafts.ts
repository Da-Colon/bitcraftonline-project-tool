export interface Craft {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
  estimatedTime?: number;
  startTime?: string;
  endTime?: string;
  buildingName?: string;
  buildingEntityId?: string;
  playerName?: string;
  playerEntityId?: string;
  claimName?: string;
  claimEntityId?: string;
  regionId?: number;
  skillId?: number;
  skillName?: string;
  resources?: Array<{
    itemId: number;
    name: string;
    quantity: number;
    required: number;
  }>;
  output?: Array<{
    itemId: number;
    name: string;
    quantity: number;
  }>;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
