/**
 * Types for the resource tracking system
 */

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

export interface TrackingStats {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
}
