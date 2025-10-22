import { useCallback, useEffect, useState } from "react";

import { SELECTED_PLAYER_KEY, type SelectedPlayer } from "~/constants/storage";

export function useSelectedPlayer() {
  const [player, setPlayer] = useState<SelectedPlayer | null>(null);

  // Load from localStorage on mount and listen for changes
  useEffect(() => {
    const loadPlayer = () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(SELECTED_PLAYER_KEY) : null;
        setPlayer(raw ? JSON.parse(raw) : null);
      } catch {
        setPlayer(null);
      }
    };

    // Load initial value
    loadPlayer();

    // Listen for localStorage changes (from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_PLAYER_KEY) {
        loadPlayer();
      }
    };

    // Listen for custom events (for same-tab changes)
    const handleCustomStorageChange = () => {
      loadPlayer();
    };

    if (typeof window !== "undefined") {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('selectedPlayerChanged', handleCustomStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('selectedPlayerChanged', handleCustomStorageChange);
      }
    };
  }, []);

  const savePlayer = useCallback((p: SelectedPlayer) => {
    try {
      localStorage.setItem(SELECTED_PLAYER_KEY, JSON.stringify(p));
      // Dispatch custom event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('selectedPlayerChanged'));
      }
    } catch {/* ignore */}
  }, []);

  const clearPlayer = useCallback(() => {
    try {
      localStorage.removeItem(SELECTED_PLAYER_KEY);
      // Dispatch custom event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('selectedPlayerChanged'));
      }
    } catch {/* ignore */}
  }, []);

  return { player, savePlayer, clearPlayer } as const;
}

