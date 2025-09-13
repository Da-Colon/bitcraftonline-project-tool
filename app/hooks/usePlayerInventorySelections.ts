import { useState, useEffect, useCallback } from "react";
import { PLAYER_INVENTORY_SELECTIONS_KEY, type PlayerInventorySelections } from "~/constants/storage";

interface PlayerInventorySelection {
  availableInventories: string[];
  selectedInventories: string[];
  lastUpdated: string;
}

export function usePlayerInventorySelections() {
  const [selections, setSelections] = useState<PlayerInventorySelections>({});

  // Load from localStorage on mount and listen for changes
  useEffect(() => {
    const loadSelections = () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(PLAYER_INVENTORY_SELECTIONS_KEY) : null;
        setSelections(raw ? JSON.parse(raw) : {});
      } catch {
        setSelections({});
      }
    };

    // Load initial value
    loadSelections();

    // Listen for localStorage changes (from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PLAYER_INVENTORY_SELECTIONS_KEY) {
        loadSelections();
      }
    };

    // Listen for custom events (for same-tab changes)
    const handleCustomStorageChange = () => {
      loadSelections();
    };

    if (typeof window !== "undefined") {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('playerInventorySelectionsChanged', handleCustomStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('playerInventorySelectionsChanged', handleCustomStorageChange);
      }
    };
  }, []);

  const saveSelections = useCallback((newSelections: PlayerInventorySelections) => {
    try {
      localStorage.setItem(PLAYER_INVENTORY_SELECTIONS_KEY, JSON.stringify(newSelections));
      setSelections(newSelections);
      // Dispatch custom event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('playerInventorySelectionsChanged'));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const updatePlayerSelections = useCallback((
    playerName: string, 
    update: Partial<PlayerInventorySelection>
  ) => {
    const current = selections[playerName] || {
      availableInventories: [],
      selectedInventories: [],
      lastUpdated: new Date().toISOString()
    };

    const updated = {
      ...current,
      ...update,
      lastUpdated: new Date().toISOString()
    };

    const newSelections = {
      ...selections,
      [playerName]: updated
    };

    saveSelections(newSelections);
  }, [selections, saveSelections]);

  const getPlayerSelections = useCallback((playerName: string): PlayerInventorySelection | null => {
    return selections[playerName] || null;
  }, [selections]);

  const clearPlayerSelections = useCallback((playerName: string) => {
    const newSelections = { ...selections };
    delete newSelections[playerName];
    saveSelections(newSelections);
  }, [selections, saveSelections]);

  const clearAllSelections = useCallback(() => {
    saveSelections({});
  }, [saveSelections]);

  // Helper to check if selections are stale (older than 24 hours)
  const areSelectionsStale = useCallback((playerName: string): boolean => {
    const playerSelections = selections[playerName];
    if (!playerSelections) return true;

    const lastUpdated = new Date(playerSelections.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 24; // Consider stale after 24 hours
  }, [selections]);

  return {
    selections,
    updatePlayerSelections,
    getPlayerSelections,
    clearPlayerSelections,
    clearAllSelections,
    areSelectionsStale,
  } as const;
}
