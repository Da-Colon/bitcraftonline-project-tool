import { useCallback, useEffect, useState } from "react";
import { SELECTED_PLAYER_KEY, type SelectedPlayer } from "~/constants/storage";

export function useSelectedPlayer() {
  const [player, setPlayer] = useState<SelectedPlayer | null>(null);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(SELECTED_PLAYER_KEY) : null;
      if (raw) setPlayer(JSON.parse(raw));
    } catch {/* ignore */}
  }, []);

  const savePlayer = useCallback((p: SelectedPlayer) => {
    setPlayer(p);
    try {
      localStorage.setItem(SELECTED_PLAYER_KEY, JSON.stringify(p));
    } catch {/* ignore */}
  }, []);

  const clearPlayer = useCallback(() => {
    setPlayer(null);
    try {
      localStorage.removeItem(SELECTED_PLAYER_KEY);
    } catch {/* ignore */}
  }, []);

  return { player, savePlayer, clearPlayer } as const;
}

