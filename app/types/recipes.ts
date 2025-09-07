export interface Item {
  id: string;
  name: string;
  category: string;
  tier: number;
  stackSize: number;
}

export interface RecipeInput {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  outputItemId: string;
  outputQuantity: number;
  inputs: RecipeInput[];
}

export interface ProjectItem {
  itemId: string;
  quantity: number;
  recipe?: Recipe;
}

export interface ProjectBreakdown {
  rawMaterials: Map<string, number>;
  intermediates: Map<string, number>;
  totalItems: Map<string, number>;
}

export interface Project {
  id: string;
  name: string;
  items: ProjectItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type TrackingStatus = 'not_started' | 'in_progress' | 'completed';

export interface TrackedItem {
  itemId: string;
  status: TrackingStatus;
  completedQuantity: number;
  totalQuantity: number;
}

export interface ProfessionProgress {
  profession: string;
  category: string;
  progress: number; // percentage 0-100
  completedItems: number;
  totalItems: number;
  tierQuantities: Record<number, { completed: number; total: number }>; // T1-T9
}

export interface TrackingData {
  trackedItems: Map<string, TrackedItem>;
  professionProgress: ProfessionProgress[];
  globalFilters: {
    showCompleted: boolean;
    showInProgress: boolean;
    showNotStarted: boolean;
  };
}
