import { useMemo } from "react";
import type { Item } from "~/types/recipes";

// This will be populated with actual GameData in a future implementation
// For now, providing a basic structure to prevent TypeScript errors
export function useGameData() {
  const getItemById = useMemo(() => {
    return (itemId: string): Item | undefined => {
      // TODO: Implement actual GameData lookup
      // This should read from GameData/BitCraft_GameData/server/region/ JSON files
      return undefined;
    };
  }, []);

  return { getItemById };
}
